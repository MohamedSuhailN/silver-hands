from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from marketplace.models import ProviderProfile, Service, Category
from ai_engine.services.matching import match_providers
from ai_engine.services.assistant import SilverHandsAssistant

User = get_user_model()

class Phase4CustomerMatchingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat_cooking = Category.objects.create(name="Traditional Cooking", slug="cooking")
        self.cat_tutoring = Category.objects.create(name="Tutoring & Teaching", slug="tutoring")
        
        # Create Provider 1: Lakshmi in Adyar
        self.user_lakshmi = User.objects.create_user(
            username="lakshmi",
            first_name="Lakshmi",
            email="lakshmi@silverhands.org",
            role=User.Role.PROVIDER
        )
        self.profile_lakshmi = ProviderProfile.objects.create(
            user=self.user_lakshmi,
            location="Adyar, Chennai",
            skills=["Traditional Cooking", "Tamil Tutoring"],
            experience_years=25,
            languages=["Tamil", "English"],
            rating=5.0,
            review_count=18
        )
        Service.objects.create(
            provider=self.profile_lakshmi,
            category=self.cat_tutoring,
            title="Tamil Language & Literature Tutoring",
            description="Personalized Tamil tutoring for school children and adults.",
            price=400,
            is_available=True
        )

        # Create Provider 2: Ramani in Anna Nagar
        self.user_ramani = User.objects.create_user(
            username="ramani",
            first_name="Ramani",
            email="ramani@silverhands.org",
            role=User.Role.PROVIDER
        )
        self.profile_ramani = ProviderProfile.objects.create(
            user=self.user_ramani,
            location="Anna Nagar, Chennai",
            skills=["Mathematics Tutoring", "Physics"],
            experience_years=15,
            languages=["English", "Tamil"],
            rating=4.8,
            review_count=10
        )
        Service.objects.create(
            provider=self.profile_ramani,
            category=self.cat_tutoring,
            title="High School Math Tutoring",
            description="Clear conceptual tutoring in Math and Science.",
            price=500,
            is_available=True
        )

    def test_direct_match_providers_tamil_adyar(self):
        """Test match_providers returns Lakshmi for Tamil tutoring near Adyar."""
        result = match_providers(
            requirement_text="I need someone to teach Tamil near Adyar",
            location="Adyar",
            language="Tamil"
        )
        self.assertGreater(len(result['matches']), 0)
        top_match = result['matches'][0]
        self.assertEqual(top_match['provider_name'], "Lakshmi")
        self.assertIn("Adyar", top_match['location'])
        self.assertIn("Tamil", str(top_match['reasons']))

    def test_matching_sorting_by_rating_and_experience(self):
        """Test that sorting by experience and rating places senior providers at top."""
        result = match_providers(
            requirement_text="Find top rated experienced teachers",
            sort_by="experience"
        )
        self.assertGreaterEqual(len(result['matches']), 2)
        # Lakshmi has 25 yrs, Ramani has 15 yrs
        self.assertEqual(result['matches'][0]['provider_name'], "Lakshmi")

    def test_zero_match_graceful_fallback(self):
        """Test that non-existent skill in database returns clean empty list rather than hallucinating."""
        result = match_providers(
            requirement_text="Need aerospace jet engine mechanic in Coimbatore",
            location="Coimbatore"
        )
        self.assertEqual(len(result['matches']), 0)

    @patch('ai_engine.services.assistant.ai_client.generate_json')
    def test_customer_ai_assistant_discovery_flow(self, mock_generate):
        """Test end-to-end customer query through AIAssistantView returns real matched providers."""
        mock_generate.return_value = {
            "intent": "SEARCH_SERVICE",
            "message": "Looking for Tamil tutoring near Adyar...",
            "extracted_entities": {
                "service": "Tamil tutoring",
                "location": "Adyar",
                "language": "Tamil"
            },
            "requires_confirmation": False,
            "action_on_confirm": None,
            "navigation_target": None
        }

        response = self.client.post('/api/ai/assistant/', {
            "user_input": "I need someone near Adyar who can teach Tamil.",
            "session_id": "test_customer_session_1"
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['intent'], "SEARCH_SERVICE")
        self.assertIn("Lakshmi", data['message'])
        self.assertGreaterEqual(len(data['matches']), 1)
        self.assertEqual(data['matches'][0]['provider_name'], "Lakshmi")
        self.assertEqual(data['matches'][0]['provider_id'], self.profile_lakshmi.id)

    @patch('ai_engine.services.assistant.ai_client.generate_json')
    def test_conversational_refinement(self, mock_generate):
        """Test conversational refinement retains session context."""
        assistant = SilverHandsAssistant()
        
        # Step 1: Initial query
        mock_generate.return_value = {
            "intent": "SEARCH_SERVICE",
            "message": "Found matching providers in Adyar.",
            "extracted_entities": {"location": "Adyar", "service": "Tutoring"},
            "requires_confirmation": False,
            "action_on_confirm": None,
            "navigation_target": None
        }
        res1 = assistant.process_user_input("I need a tutor in Adyar", session_id="refine_sess")
        self.assertGreaterEqual(len(res1['matches']), 1)
        self.assertEqual(res1['matches'][0]['provider_name'], "Lakshmi")
        
        # Step 2: Refine: "Who has the best rating?"
        mock_generate.return_value = {
            "intent": "SEARCH_SERVICE",
            "message": "Lakshmi has the highest rating of 5.0 stars.",
            "extracted_entities": {},
            "requires_confirmation": False,
            "action_on_confirm": None,
            "navigation_target": None
        }
        res2 = assistant.process_user_input("Who has the best rating?", session_id="refine_sess")
        self.assertEqual(res2['extracted_data']['location'], "Adyar")
        self.assertGreaterEqual(len(res2['matches']), 1)
