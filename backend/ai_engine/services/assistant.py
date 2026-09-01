"""
SilverHands Phase 1: Central AI Assistant Service

Unified assistant that handles:
- Intent detection (CREATE_PROFILE, UPDATE_PROFILE, SEARCH_SERVICE, etc.)
- Context extraction (name, location, skills, preferences)
- Confirmation workflows (ask user to confirm before saving)
- Action routing (call appropriate backend APIs)
- Step-by-step guidance (conversational flow)

Never fabricates data. Always fetches from backend or user.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from django.contrib.auth import get_user_model
from .ai_client import ai_client, AIServiceException

logger = logging.getLogger('silverhands.assistant')
User = get_user_model()

# Intent type constants
INTENT_CREATE_PROFILE = 'CREATE_PROFILE'
INTENT_UPDATE_PROFILE = 'UPDATE_PROFILE'
INTENT_CREATE_SERVICE = 'CREATE_SERVICE'
INTENT_UPDATE_SERVICE = 'UPDATE_SERVICE'
INTENT_SEARCH_SERVICE = 'SEARCH_SERVICE'
INTENT_FIND_PROVIDER = 'FIND_PROVIDER'
INTENT_VIEW_BOOKINGS = 'VIEW_BOOKINGS'
INTENT_VIEW_EARNINGS = 'VIEW_EARNINGS'
INTENT_VIEW_PROFILE = 'VIEW_PROFILE'
INTENT_UPDATE_AVAILABILITY = 'UPDATE_AVAILABILITY'
INTENT_NAVIGATE = 'NAVIGATE'
INTENT_ASK_HELP = 'ASK_HELP'
INTENT_GENERAL_QUERY = 'GENERAL_QUERY'


class AssistantSession:
    """
    Maintains conversation context for a user.
    Tracks:
    - Extracted profile info (name, location, skills, etc.)
    - Current step in flow (e.g., asked for email, waiting for confirmation)
    - Previous messages
    """
    def __init__(self, user_id: int = None):
        self.user_id = user_id
        self.extracted_data = {}
        self.confirmation_pending = False
        self.pending_action = None
        self.step = 0
        self.context = {}

    def set_extracted_data(self, key: str, value: Any):
        self.extracted_data[key] = value

    def set_confirmation_pending(self, action: str, data: Dict):
        self.confirmation_pending = True
        self.pending_action = action
        self.extracted_data = data

    def clear_confirmation(self):
        self.confirmation_pending = False
        self.pending_action = None

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'extracted_data': self.extracted_data,
            'confirmation_pending': self.confirmation_pending,
            'pending_action': self.pending_action,
            'step': self.step
        }


class IntentDetector:
    """
    Detects user intent from text input.
    Uses rule-based patterns (fast, reliable).
    Falls back to AI if needed.
    """

    @staticmethod
    def detect(user_input: str, user_role: str = None) -> str:
        """
        Detects intent from user input.
        
        Args:
            user_input: Raw text from user
            user_role: 'CUSTOMER' or 'PROVIDER'
            
        Returns:
            Intent constant (e.g., 'SEARCH_SERVICE')
        """
        text = user_input.lower().strip()

        # CREATE_PROFILE patterns
        if any(phrase in text for phrase in [
            'register', 'sign up', 'new account', 'create account', 
            'i am', 'my name is', 'i\'m', 'hello i\'m', 'started with silverhands',
            'first time', 'new provider', 'become provider'
        ]):
            if user_role == 'PROVIDER' or 'provider' in text or 'cook' in text or 'tutor' in text or 'skill' in text:
                return INTENT_CREATE_PROFILE

        # UPDATE_PROFILE patterns
        if any(phrase in text for phrase in [
            'update profile', 'change profile', 'modify profile', 'edit profile',
            'update my', 'change my', 'modify my', 'edit my',
            'update location', 'change address', 'new address', 'moving to',
            'update skills', 'new skill', 'added skill', 'learn skill'
        ]):
            return INTENT_UPDATE_PROFILE

        # CREATE_SERVICE patterns
        if any(phrase in text for phrase in [
            'create service', 'list service', 'new service', 'add service',
            'offer service', 'sell service', 'start offering', 'launch service',
            'create product', 'list product', 'handmade product'
        ]):
            return INTENT_CREATE_SERVICE

        # UPDATE_SERVICE patterns
        if any(phrase in text for phrase in [
            'update service', 'change service', 'edit service', 'modify service',
            'change price', 'update price', 'new price', 'change description',
            'update description', 'edit description'
        ]):
            return INTENT_UPDATE_SERVICE

        # SEARCH_SERVICE patterns
        if any(phrase in text for phrase in [
            'need someone', 'looking for', 'find', 'search', 'want', 'hire',
            'book', 'show me', 'help me find', 'where can i find', 'teach me',
            'i need', 'looking to hire'
        ]):
            return INTENT_SEARCH_SERVICE

        # FIND_PROVIDER patterns
        if any(phrase in text for phrase in [
            'show providers', 'list providers', 'available providers', 'who can',
            'providers near', 'local providers', 'providers in'
        ]):
            return INTENT_FIND_PROVIDER

        # VIEW_BOOKINGS patterns
        if any(phrase in text for phrase in [
            'show bookings', 'my bookings', 'list bookings', 'upcoming bookings',
            'pending bookings', 'booking status', 'when is my booking', 'what\'s pending'
        ]):
            return INTENT_VIEW_BOOKINGS

        # VIEW_EARNINGS patterns
        if any(phrase in text for phrase in [
            'earnings', 'revenue', 'income', 'how much earned', 'monthly earnings',
            'total earnings', 'payment history', 'money earned'
        ]):
            return INTENT_VIEW_EARNINGS

        # VIEW_PROFILE patterns
        if any(phrase in text for phrase in [
            'show profile', 'my profile', 'profile details', 'view profile', 'display profile',
            'who am i', 'my details', 'my information'
        ]):
            return INTENT_VIEW_PROFILE

        # UPDATE_AVAILABILITY patterns
        if any(phrase in text for phrase in [
            'i\'m available', 'free', 'unavailable', 'busy', 'mark available',
            'mark unavailable', 'open', 'closed', 'availability', 'available on',
            'free on'
        ]):
            return INTENT_UPDATE_AVAILABILITY

        # NAVIGATE patterns
        if any(phrase in text for phrase in [
            'go to', 'show', 'open', 'dashboard', 'homepage', 'home', 'marketplace',
            'services', 'products', 'providers', 'radar', 'messages', 'bookings page',
            'orders page'
        ]):
            return INTENT_NAVIGATE

        # ASK_HELP patterns
        if any(phrase in text for phrase in [
            'help', 'how does', 'how to', 'what is', 'explain', 'teach', 'tutorial',
            'guide', 'instructions', 'confused', 'not sure', 'don\'t know', 'how do i'
        ]):
            return INTENT_ASK_HELP

        # Default to GENERAL_QUERY
        return INTENT_GENERAL_QUERY


class ContextExtractor:
    """
    Extracts structured data from user input.
    Examples:
    - "I am Lakshmi, 65 years old, living in Adyar Chennai, 25 years cooking"
      → {name: 'Lakshmi', age: 65, location: 'Adyar, Chennai', skills: ['Cooking'], experience: 25}
    """

    @staticmethod
    def extract_profile_info(user_input: str) -> Dict[str, Any]:
        """
        Extract profile information from user input.
        Used for profile creation/update.
        """
        system_instruction = """
        Extract profile information from the user's input.
        Return ONLY valid JSON with these fields (omit if not mentioned):
        {
            "name": "string or null",
            "age": "integer or null",
            "location": "string or null",
            "skills": ["list of skills or empty"],
            "experience_years": "integer or null",
            "email": "string or null",
            "phone": "string or null",
            "language": "string or null",
            "bio": "string or null"
        }
        
        Be conservative: only extract information EXPLICITLY mentioned.
        Do NOT guess or infer.
        """

        try:
            result = ai_client.generate_json(
                prompt=f"Extract profile info from: {user_input}",
                system_instruction=system_instruction,
                default_fallback={
                    "name": None,
                    "age": None,
                    "location": None,
                    "skills": [],
                    "experience_years": None,
                    "email": None,
                    "phone": None,
                    "language": None,
                    "bio": None
                }
            )
            return result
        except Exception as e:
            logger.error(f"Context extraction failed: {e}")
            return {
                "name": None,
                "age": None,
                "location": None,
                "skills": [],
                "experience_years": None,
                "email": None,
                "phone": None,
                "language": None,
                "bio": None
            }

    @staticmethod
    def extract_search_requirement(user_input: str) -> Dict[str, Any]:
        """
        Extract service requirement from user input.
        Used for SEARCH_SERVICE intent.
        Example: "Tamil tutoring near Adyar" → {service: 'Tamil Tutoring', location: 'Adyar'}
        """
        system_instruction = """
        Extract service requirement details.
        Return ONLY valid JSON:
        {
            "service": "what service/skill they need",
            "location": "location if mentioned",
            "budget": "budget if mentioned as number",
            "urgency": "asap/urgent/flexible/future",
            "other_details": "other important details"
        }
        
        Be conservative. Only extract EXPLICITLY mentioned information.
        """

        try:
            result = ai_client.generate_json(
                prompt=f"Extract service requirement from: {user_input}",
                system_instruction=system_instruction,
                default_fallback={
                    "service": None,
                    "location": None,
                    "budget": None,
                    "urgency": "flexible",
                    "other_details": None
                }
            )
            return result
        except Exception as e:
            logger.error(f"Service extraction failed: {e}")
            return {
                "service": None,
                "location": None,
                "budget": None,
                "urgency": "flexible",
                "other_details": None
            }


class AssistantActions:
    """
    Handles specific actions based on intent.
    Returns:
    - Response message to user
    - Confirmation needed flag
    - Next action
    """

    @staticmethod
    def handle_create_profile(user_input: str, user=None) -> Dict[str, Any]:
        """
        Handle CREATE_PROFILE intent.
        Extracts info, asks for confirmation, returns what to save.
        """
        # Extract profile info
        extracted = ContextExtractor.extract_profile_info(user_input)

        # If minimal info, ask for more
        if not extracted['name']:
            return {
                'intent': INTENT_CREATE_PROFILE,
                'action': 'ask_name',
                'message': "I'd like to create your profile. What's your name?",
                'confirmation_needed': False,
                'extracted_data': None
            }

        # If we have name but missing key fields
        missing_fields = []
        if not extracted['email']:
            missing_fields.append('email')
        if not extracted['location']:
            missing_fields.append('location')

        if missing_fields:
            prompt = f"Great! I have your name as {extracted['name']}. "
            prompt += f"To complete your profile, I need: {', '.join(missing_fields)}. "
            prompt += f"What's your {missing_fields[0]}?"

            return {
                'intent': INTENT_CREATE_PROFILE,
                'action': 'ask_field',
                'message': prompt,
                'confirmation_needed': False,
                'extracted_data': extracted,
                'missing_field': missing_fields[0]
            }

        # We have enough info - ask for confirmation
        confirmation_message = f"""
I've gathered your profile information:
- Name: {extracted['name']}
- Location: {extracted['location']}
- Skills: {', '.join(extracted['skills']) if extracted['skills'] else 'Not specified yet'}
- Experience: {extracted['experience_years']} years
- Email: {extracted['email']}

Is this correct? Please say YES to proceed or NO to make changes.
"""

        return {
            'intent': INTENT_CREATE_PROFILE,
            'action': 'confirm_profile',
            'message': confirmation_message,
            'confirmation_needed': True,
            'extracted_data': extracted,
            'action_on_confirm': {
                'endpoint': '/api/auth/register/',
                'method': 'POST',
                'payload': {
                    'username': extracted.get('email', '').split('@')[0] if extracted.get('email') else None,
                    'email': extracted.get('email'),
                    'password': 'temp_will_be_prompted',  # Should be sent by user
                    'first_name': extracted.get('name', '').split()[0] if extracted.get('name') else '',
                    'last_name': ' '.join(extracted.get('name', '').split()[1:]) if extracted.get('name') else '',
                    'phone': extracted.get('phone'),
                    'role': 'PROVIDER',
                    'address': extracted.get('location'),
                    'preferred_language': extracted.get('language', 'en'),
                }
            }
        }

    @staticmethod
    def handle_search_service(user_input: str, user=None) -> Dict[str, Any]:
        """
        Handle SEARCH_SERVICE intent.
        Extract requirement, prepare API call to /api/ai/match/
        """
        extracted = ContextExtractor.extract_search_requirement(user_input)

        if not extracted['service']:
            return {
                'intent': INTENT_SEARCH_SERVICE,
                'action': 'ask_service',
                'message': "What service or skill are you looking for? (e.g., Tamil tutoring, cooking, tailoring)",
                'confirmation_needed': False,
                'extracted_data': None
            }

        searching_msg = f"Looking for {extracted['service']}"
        if extracted['location']:
            searching_msg += f" near {extracted['location']}"
        searching_msg += "..."

        return {
            'intent': INTENT_SEARCH_SERVICE,
            'action': 'search_providers',
            'message': searching_msg,
            'confirmation_needed': False,
            'extracted_data': extracted,
            'action_on_confirm': {
                'endpoint': '/api/ai/match/',
                'method': 'POST',
                'payload': {
                    'requirement_text': user_input,
                    'category': extracted.get('service'),
                    'location': extracted.get('location'),
                    'budget': extracted.get('budget'),
                    'lat': 13.0827,  # Default Chennai
                    'lng': 80.2707
                }
            }
        }

    @staticmethod
    def handle_view_profile(user=None) -> Dict[str, Any]:
        """
        Handle VIEW_PROFILE intent.
        Return user's current profile data.
        """
        if not user or not user.is_authenticated:
            return {
                'intent': INTENT_VIEW_PROFILE,
                'action': 'login_required',
                'message': "Please log in first to view your profile.",
                'confirmation_needed': False,
                'extracted_data': None
            }

        profile_data = {
            'username': user.username,
            'email': user.email,
            'name': user.get_full_name() or user.username,
            'phone': user.phone,
            'location': user.address,
            'role': user.role,
            'preferred_language': user.preferred_language,
        }

        # If provider, add provider-specific data
        if hasattr(user, 'provider_profile'):
            pp = user.provider_profile
            profile_data.update({
                'bio': pp.bio,
                'skills': pp.skills,
                'experience_years': pp.experience_years,
                'rating': str(pp.rating),
                'trust_score': pp.trust_score,
            })

        profile_text = f"""
Your SilverHands Profile:
- Name: {profile_data['name']}
- Email: {profile_data['email']}
- Role: {profile_data['role']}
- Location: {profile_data['location']}
- Language: {profile_data['preferred_language']}
"""

        if 'bio' in profile_data:
            profile_text += f"- Bio: {profile_data['bio']}\n"
            profile_text += f"- Skills: {', '.join(profile_data.get('skills', []))}\n"
            profile_text += f"- Experience: {profile_data.get('experience_years')} years\n"
            profile_text += f"- Rating: {profile_data.get('rating')} ⭐\n"

        return {
            'intent': INTENT_VIEW_PROFILE,
            'action': 'show_profile',
            'message': profile_text,
            'confirmation_needed': False,
            'extracted_data': profile_data
        }

    @staticmethod
    def handle_navigate(user_input: str) -> Dict[str, Any]:
        """
        Handle NAVIGATE intent.
        Extract destination page and return navigation instruction.
        """
        text = user_input.lower()

        # Map keywords to routes
        route_map = {
            'services': '/services',
            'products': '/products',
            'providers': '/providers',
            'marketplace': '/services',
            'home': '/',
            'dashboard': '/provider/dashboard',
            'bookings': '/bookings',
            'orders': '/orders',
            'messages': '/messages',
            'radar': '/radar',
            'profile': '/profile',
            'skill': '/skill-passport',
        }

        route = None
        for keyword, path in route_map.items():
            if keyword in text:
                route = path
                break

        if not route:
            return {
                'intent': INTENT_NAVIGATE,
                'action': 'ask_destination',
                'message': "Where would you like to go? (Services, Products, Providers, Dashboard, Bookings, Orders, etc.)",
                'confirmation_needed': False,
                'extracted_data': None
            }

        return {
            'intent': INTENT_NAVIGATE,
            'action': 'navigate',
            'message': f"Taking you to {route.replace('/', '').replace('-', ' ').title()}...",
            'confirmation_needed': False,
            'extracted_data': {'route': route},
            'navigation_target': route
        }

    @staticmethod
    def handle_ask_help(user_input: str) -> Dict[str, Any]:
        """
        Handle ASK_HELP intent.
        Provide guidance and links.
        """
        help_text = """
Welcome to SilverHands Help!

👵🏽 **For Providers (Homemakers & Artisans):**
1. **Create Profile**: Tell me "I'm a provider" or describe yourself
2. **List Services**: Say "Create a service" to add your offerings
3. **Check Earnings**: Ask "How much have I earned?"
4. **Manage Bookings**: Ask "Show my bookings"
5. **Update Profile**: Say "Update my skills" or "Change my location"

🏘️ **For Customers (Buyers & Seniors):**
1. **Find Services**: Say "I need a tailor" or "Looking for Tamil tutoring"
2. **Book Service**: Say "Book Lakshmi for cooking" 
3. **View Bookings**: Ask "Show my bookings"
4. **Leave Review**: After booking, leave a review

📱 **Voice Tips:**
- Tap the Mic button to speak
- Speak clearly
- If voice doesn't work, type instead
- Available in English, Tamil, and Hindi

❓ **Still confused?** Just ask!
"""

        return {
            'intent': INTENT_ASK_HELP,
            'action': 'show_help',
            'message': help_text,
            'confirmation_needed': False,
            'extracted_data': None
        }

    @staticmethod
    def handle_general_query(user_input: str, user=None) -> Dict[str, Any]:
        """
        Handle GENERAL_QUERY intent.
        Call AI business assistant for advice.
        """
        return {
            'intent': INTENT_GENERAL_QUERY,
            'action': 'get_ai_advice',
            'message': "Let me think about that...",
            'confirmation_needed': False,
            'extracted_data': None,
            'action_on_confirm': {
                'endpoint': '/api/ai/business-assistant/',
                'method': 'POST',
                'payload': {'question': user_input}
            }
        }


class SilverHandsAssistant:
    """
    Main AI Assistant class.
    Orchestrates intent detection, context extraction, and action routing.
    """

    def __init__(self):
        self.sessions = {}  # In-memory session storage

    def process_user_input(self, user_input: str, user=None, session_id: str = None) -> Dict[str, Any]:
        """
        Main entry point for processing user input.

        Args:
            user_input: Text from user (voice→text already converted)
            user: Django User object
            session_id: Session identifier for multi-turn conversations

        Returns:
            Response dict with:
            - intent: Detected intent
            - action: Action to take
            - message: Response to user
            - confirmation_needed: Whether to wait for confirmation
            - extracted_data: Any data extracted
            - navigation_target: Route to navigate to (if applicable)
        """

        # Get or create session
        sid = session_id or (str(user.id) if user else 'anon')
        if sid not in self.sessions:
            self.sessions[sid] = AssistantSession(user_id=user.id if user else None)

        session = self.sessions[sid]

        # Handle confirmation from previous step
        if session.confirmation_pending and user_input.lower() in ['yes', 'yeah', 'confirm', 'ok', 'sure']:
            return self._handle_confirmation(session, user)

        if session.confirmation_pending and user_input.lower() in ['no', 'nope', 'cancel', 'retry']:
            session.clear_confirmation()
            return {
                'intent': session.pending_action,
                'action': 'retry',
                'message': "No problem! Let's try again. Please tell me your details once more.",
                'confirmation_needed': False,
                'extracted_data': None
            }

        # Detect intent
        user_role = user.role if user and hasattr(user, 'role') else None
        intent = IntentDetector.detect(user_input, user_role=user_role)

        # Route to handler
        if intent == INTENT_CREATE_PROFILE:
            result = AssistantActions.handle_create_profile(user_input, user)
        elif intent == INTENT_UPDATE_PROFILE:
            result = {
                'intent': intent,
                'action': 'ask_details',
                'message': "What would you like to update? (name, location, skills, email, phone, language)",
                'confirmation_needed': False,
                'extracted_data': None
            }
        elif intent == INTENT_CREATE_SERVICE:
            result = {
                'intent': intent,
                'action': 'ask_service_details',
                'message': "Great! Let's create a new service. What service would you like to offer?",
                'confirmation_needed': False,
                'extracted_data': None
            }
        elif intent == INTENT_SEARCH_SERVICE:
            result = AssistantActions.handle_search_service(user_input, user)
        elif intent == INTENT_FIND_PROVIDER:
            result = {
                'intent': intent,
                'action': 'search_providers',
                'message': "Who are you looking for? (e.g., Tamil tutors, cooks, tailors)",
                'confirmation_needed': False,
                'extracted_data': None
            }
        elif intent == INTENT_VIEW_PROFILE:
            result = AssistantActions.handle_view_profile(user)
        elif intent == INTENT_VIEW_BOOKINGS:
            result = {
                'intent': intent,
                'action': 'fetch_bookings',
                'message': "Fetching your bookings...",
                'confirmation_needed': False,
                'extracted_data': None,
                'action_on_confirm': {
                    'endpoint': '/api/bookings/',
                    'method': 'GET'
                }
            }
        elif intent == INTENT_NAVIGATE:
            result = AssistantActions.handle_navigate(user_input)
        elif intent == INTENT_ASK_HELP:
            result = AssistantActions.handle_ask_help(user_input)
        else:  # GENERAL_QUERY
            result = AssistantActions.handle_general_query(user_input, user)

        # Store confirmation if needed
        if result.get('confirmation_needed'):
            session.set_confirmation_pending(intent, result.get('extracted_data', {}))

        return result

    def _handle_confirmation(self, session: AssistantSession, user) -> Dict[str, Any]:
        """Handle user confirmation of pending action."""
        session.clear_confirmation()

        # TODO: Execute the action based on session.pending_action
        # This will be handled by the view layer that calls these APIs

        return {
            'intent': session.pending_action,
            'action': 'confirmed',
            'message': "Perfect! Processing your request...",
            'confirmation_needed': False,
            'extracted_data': session.extracted_data
        }


# Singleton instance
assistant = SilverHandsAssistant()
