"""
SilverHands Phase 2: Conversational AI Orchestrator

Unified assistant that handles:
- Multi-turn conversational memory (Conversation Manager)
- Intent detection and dynamic action planning (AI Orchestrator)
- Step-by-step guidance without massive forms
- Real database integration and strict confirmation workflows
"""

import json
import logging
from typing import Dict, List, Optional, Any
from django.contrib.auth import get_user_model
from .ai_client import ai_client, AIServiceException

logger = logging.getLogger('silverhands.assistant')
User = get_user_model()

# Available Intents for the Orchestrator
AVAILABLE_INTENTS = [
    'CREATE_PROFILE', 'UPDATE_PROFILE', 'CREATE_SERVICE', 'CREATE_PRODUCT',
    'SEARCH_SERVICE', 'FIND_PROVIDER', 'VIEW_PROFILE', 'VIEW_SERVICES',
    'VIEW_BOOKINGS', 'VIEW_REVIEWS', 'VIEW_EARNINGS', 'FIND_OPPORTUNITIES',
    'NAVIGATE', 'ASK_HELP', 'GENERAL_QUERY'
]

class AssistantSession:
    """
    Conversation Manager maintaining real task context across multiple turns.
    """
    def __init__(self, user_id: int = None, user_role: str = None):
        self.user_id = user_id
        self.user_role = user_role
        self.conversation_history = []
        self.current_intent = None
        self.current_task = None
        self.collected_entities = {}
        self.missing_entities = []
        self.confirmation_required = False
        self.confirmation_status = None
        self.last_action = None
        self.next_action = None

    def add_message(self, role: str, text: str):
        self.conversation_history.append({'role': role, 'content': text})
        # Keep history short (last 12 turns) to prevent prompt explosion
        if len(self.conversation_history) > 12:
            self.conversation_history = self.conversation_history[-12:]

    def update_state(self, new_intent: str, new_entities: dict):
        if new_intent and new_intent != self.current_intent:
            self.current_intent = new_intent
            self.collected_entities = {} # Reset entities on intent change
        
        if new_entities:
            for k, v in new_entities.items():
                if v is not None:
                    self.collected_entities[k] = v

    def to_dict(self):
        return {
            'user_role': self.user_role,
            'current_intent': self.current_intent,
            'collected_entities': self.collected_entities,
            'conversation_history': self.conversation_history[-6:], # Send last 6 for context to LLM
            'confirmation_required': self.confirmation_required
        }


class AIOrchestrator:
    """
    Uses the AI Client to natively process conversation context, extract info,
    and plan the next action or backend API call.
    """

    @staticmethod
    def process_turn(session: AssistantSession, user_input: str) -> Dict[str, Any]:
        """
        Send the current session state and user input to the LLM.
        """
        session_context = json.dumps(session.to_dict())
        
        system_instruction = f"""
You are the SilverHands AI Orchestrator, an action-oriented conversational guide for livelihood enablement.
Your goal is to guide the user (Role: {session.user_role or 'GUEST'}) step-by-step.
Current Conversation State: {session_context}

CRITICAL RULES FOR EXTRACTION & ACTIONS:
1. EXTRACTION OF FACTS:
   Extract ONLY facts explicitly stated by the user. NEVER invent or assume unstated details (no fake prices, DOB, address, certifications, or ratings).
   For Provider Onboarding (CREATE_PROFILE / UPDATE_PROFILE), extract:
   - "name": full or first name string
   - "age": integer
   - "location": area/city string (e.g. "Adyar, Chennai")
   - "skills": list of strings (e.g. ["Traditional Cooking", "Tutoring"])
   - "experience": integer of years (or experience_years)

2. STEP-BY-STEP GUIDANCE & MISSING FIELDS:
   If essential onboarding info is missing, ask for only ONE missing field at a time in a warm, respectful, senior-friendly manner.
   Do not overwhelm the user with long forms.

3. STRICT CONFIRMATION:
   When all key profile information (name, location, skills, experience) is collected, or when the user provides them in one go:
   - Set requires_confirmation=true.
   - In "message", start with: "Here's what I understood: Name: ..., Age: ..., Location: ..., Skills: ..., Experience: ... years. Should I save this to your profile?"
   - Do NOT execute the action until the user confirms (e.g. says "yes", "proceed", "save").

4. ACTION EXECUTION ON CONFIRMATION:
   When the user confirms (or when processing a confirmed action):
   - For Provider profile saving:
     "action_on_confirm": {{
         "endpoint": "/api/providers/me/",
         "method": "PATCH",
         "payload": {{
             "first_name": "<extracted name>",
             "age": <extracted age>,
             "location": "<extracted location>",
             "skills": <extracted skills list>,
             "experience_years": <extracted experience years>
         }}
     }}
   - For Customer Service Search:
     "action_on_confirm": {{
         "endpoint": "/api/search/?q=<extracted query or service>",
         "method": "GET",
         "payload": {{}}
     }}

5. TONE & ACCESSIBILITY:
   Keep language simple, respectful, and encouraging. Never expose internal JSON schemas or technical jargon to the user.
   Intents must be one of: {AVAILABLE_INTENTS}.

Return pure valid JSON with format:
{{
    "intent": "CREATE_PROFILE" | "UPDATE_PROFILE" | "SEARCH_SERVICE" | "GENERAL_QUERY" | etc.,
    "message": "Senior-friendly conversational response text",
    "extracted_entities": {{"name": "...", "age": 65, "location": "...", "skills": [...], "experience": 25}},
    "requires_confirmation": true/false,
    "action_on_confirm": {{
        "endpoint": "/api/providers/me/",
        "method": "PATCH",
        "payload": {{ ... }}
    }} or null,
    "navigation_target": "/profile" or "/services" or null
}}
"""
        try:
            result = ai_client.generate_json(
                prompt=user_input,
                system_instruction=system_instruction
            )
            return result
        except AIServiceException as e:
            logger.error(f"DIAGNOSTIC ERROR: AI Configuration/API Failure - {e}")
            return {
                "intent": "GENERAL_QUERY",
                "message": "I'm having trouble connecting to my brain. Please try again.",
                "extracted_entities": {},
                "requires_confirmation": False,
                "action_on_confirm": None,
                "navigation_target": None
            }
        except Exception as e:
            logger.error(f"AI Orchestrator failed: {e}")
            return {
                "intent": "GENERAL_QUERY",
                "message": "I'm sorry, I encountered an error. Let's try that again.",
                "extracted_entities": {},
                "requires_confirmation": False,
                "action_on_confirm": None,
                "navigation_target": None
            }


class SilverHandsAssistant:
    """
    Main Assistant Class that maintains sessions and calls the orchestrator.
    """
    def __init__(self):
        self.sessions = {}  # In-memory session storage (Conversation Manager)

    def process_user_input(self, user_input: str, user=None, session_id: str = None) -> Dict[str, Any]:
        """
        Main entry point for UI.
        """
        # 1. Retrieve or Create Session
        sid = session_id or (str(user.id) if user else 'anon')
        user_role = user.role if user and hasattr(user, 'role') else 'GUEST'
        
        if sid not in self.sessions:
            self.sessions[sid] = AssistantSession(user_id=user.id if user else None, user_role=user_role)
        
        session = self.sessions[sid]
        
        # 2. Add user message to history
        session.add_message('user', user_input)

        # 3. Check for manual confirmation shortcut (yes/no on pending confirmation)
        if session.confirmation_required:
            lower_input = user_input.lower().strip()
            cancel_triggers = ['no', 'nope', 'cancel', 'stop', 'wait', 'change', "don't"]
            if any(lower_input.startswith(t) or f" {t}" in lower_input for t in cancel_triggers):
                session.confirmation_required = False
                session.add_message('assistant', "Okay, I've cancelled that. What would you like to change?")
                return {
                    'intent': session.current_intent,
                    'message': "Okay, I've cancelled that. What would you like to change or do instead?",
                    'confirmation_needed': False,
                    'action_on_confirm': None,
                    'extracted_data': session.collected_entities
                }

        # 4. Orchestrate with AI
        ai_response = AIOrchestrator.process_turn(session, user_input)
        
        # 5. Update Conversation Manager State
        new_intent = ai_response.get('intent', 'GENERAL_QUERY')
        new_entities = ai_response.get('extracted_entities', {})
        session.update_state(new_intent, new_entities)
        session.confirmation_required = ai_response.get('requires_confirmation', False)
        msg = ai_response.get('message', "I understand.")
        
        # 6. Check for Customer Search / Match Execution
        matches_data = []
        if new_intent in ['SEARCH_SERVICE', 'FIND_PROVIDER']:
            from .matching import match_providers
            req_text = user_input
            loc = session.collected_entities.get('location', '')
            cat = session.collected_entities.get('service') or session.collected_entities.get('category', '')
            lang = session.collected_entities.get('language', '')
            
            # Determine sorting preference from input
            sort_by = 'relevance'
            if any(k in user_input.lower() for k in ['rating', 'best', 'top', 'star']):
                sort_by = 'rating'
            elif any(k in user_input.lower() for k in ['experience', 'senior', 'years']):
                sort_by = 'experience'
            elif any(k in user_input.lower() for k in ['close', 'near', 'distance', 'around']):
                sort_by = 'location'

            match_res = match_providers(
                requirement_text=req_text,
                category=cat,
                location=loc,
                language=lang,
                sort_by=sort_by,
                limit=4
            )
            matches_data = match_res.get('matches', [])
            
            # If real matches exist, refine assistant explanation using real data
            if matches_data:
                top_m = matches_data[0]
                provider_name = top_m.get('provider_name', 'a verified provider')
                provider_loc = top_m.get('location', '')
                exp = top_m.get('explanation', '')
                
                if len(matches_data) == 1:
                    msg = f"I found {provider_name} in {provider_loc}! {exp} Would you like to view their profile or book a service?"
                else:
                    msg = f"I found {len(matches_data)} verified providers for you! {provider_name} is a top match ({exp}). Here are the details below:"
            else:
                msg = f"I checked our records, but couldn't find any verified providers matching '{user_input}' in that specific area right now. Would you like to search in nearby areas or for a related skill?"

        # 7. Record Assistant Response in History
        session.add_message('assistant', msg)
        
        # 8. Format Output for Frontend UI
        return {
            'intent': new_intent,
            'message': msg,
            'confirmation_needed': session.confirmation_required,
            'extracted_data': session.collected_entities,
            'matches': matches_data,
            'action_on_confirm': ai_response.get('action_on_confirm'),
            'navigation_target': ai_response.get('navigation_target')
        }

# Singleton instance
assistant = SilverHandsAssistant()
