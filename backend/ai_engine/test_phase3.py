import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from ai_engine.services.assistant import AssistantSession, AIOrchestrator, SilverHandsAssistant
from ai_engine.services.ai_client import AIServiceException
from marketplace.models import ProviderProfile

User = get_user_model()

class Phase3AIAssistantTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testprovider',
            email='provider@silverhands.org',
            password='TestPassword123!',
            role=User.Role.PROVIDER
        )
        self.client.force_authenticate(user=self.user)

    def test_provider_profile_patch_successful(self):
        """Test real backend execution for updating provider profile."""
        payload = {
            "first_name": "Lakshmi",
            "age": 65,
            "location": "Adyar, Chennai",
            "skills": ["Traditional Cooking", "Tutoring"],
            "experience_years": 25
        }
        response = self.client.patch('/api/providers/me/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify database state
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Lakshmi")
        self.assertTrue(self.user.is_senior) # Age >= 60 sets is_senior
        
        profile = ProviderProfile.objects.get(user=self.user)
        self.assertEqual(profile.location, "Adyar, Chennai")
        self.assertEqual(profile.experience_years, 25)
        self.assertIn("Traditional Cooking", profile.skills)
        self.assertEqual(profile.skill_passport.get('age'), 65)

    def test_provider_profile_unauthorized(self):
        """Test that unauthenticated requests to provider profile mutation fail securely."""
        unauth_client = APIClient()
        response = unauth_client.patch('/api/providers/me/', {"location": "Adyar"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('ai_engine.services.assistant.ai_client.generate_json')
    def test_ai_extraction_and_confirmation(self, mock_generate):
        """Test AI extraction of facts and confirmation prompt generation."""
        mock_generate.return_value = {
            "intent": "CREATE_PROFILE",
            "message": "Here's what I understood: Name: Lakshmi, Age: 65, Location: Adyar, Chennai, Skills: Traditional Cooking, Tutoring, Experience: 25 years. Should I save this to your profile?",
            "extracted_entities": {
                "name": "Lakshmi",
                "age": 65,
                "location": "Adyar, Chennai",
                "skills": ["Traditional Cooking", "Tutoring"],
                "experience": 25
            },
            "requires_confirmation": True,
            "action_on_confirm": {
                "endpoint": "/api/marketplace/providers/me/",
                "method": "PATCH",
                "payload": {
                    "first_name": "Lakshmi",
                    "age": 65,
                    "location": "Adyar, Chennai",
                    "skills": ["Traditional Cooking", "Tutoring"],
                    "experience_years": 25
                }
            },
            "navigation_target": None
        }

        assistant = SilverHandsAssistant()
        res = assistant.process_user_input(
            "I am Lakshmi, 65 years old, living in Adyar, Chennai. I have 25 years of experience in traditional cooking and tutoring.",
            user=self.user,
            session_id="test_session_extract"
        )
        self.assertTrue(res['confirmation_needed'])
        self.assertIn("Lakshmi", res['message'])
        self.assertEqual(res['extracted_data']['age'], 65)
        self.assertIsNotNone(res['action_on_confirm'])

    @patch('ai_engine.services.assistant.ai_client.generate_json')
    def test_ai_missing_fields_one_at_a_time(self, mock_generate):
        """Test AI prompting for missing field without overwhelming the user."""
        mock_generate.return_value = {
            "intent": "CREATE_PROFILE",
            "message": "Hello Lakshmi! Which area or city do you live in?",
            "extracted_entities": {"name": "Lakshmi"},
            "requires_confirmation": False,
            "action_on_confirm": None,
            "navigation_target": None
        }

        assistant = SilverHandsAssistant()
        res = assistant.process_user_input("My name is Lakshmi", user=self.user, session_id="test_session_missing")
        self.assertFalse(res['confirmation_needed'])
        self.assertIn("Which area", res['message'])

    @patch('ai_engine.services.assistant.ai_client.generate_json')
    def test_ai_malformed_output_fallback(self, mock_generate):
        """Test safe fallback when external LLM output is malformed or throws AIServiceException."""
        mock_generate.side_effect = AIServiceException("LLM returned non-JSON")

        assistant = SilverHandsAssistant()
        res = assistant.process_user_input("Hello", user=self.user, session_id="test_session_err")
        self.assertIn("trouble connecting", res['message'])
        self.assertFalse(res['confirmation_needed'])

    @patch('ai_engine.services.assistant.ai_client.generate_json')
    def test_confirmation_cancellation(self, mock_generate):
        """Test that user saying 'no' or 'cancel' resets the confirmation requirement."""
        assistant = SilverHandsAssistant()
        session = assistant.sessions.setdefault("test_cancel", AssistantSession(user_id=self.user.id, user_role='PROVIDER'))
        session.confirmation_required = True

        res = assistant.process_user_input("No, cancel", user=self.user, session_id="test_cancel")
        self.assertFalse(res['confirmation_needed'])
        self.assertIn("cancelled", res['message'].lower())
