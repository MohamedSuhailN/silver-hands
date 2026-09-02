from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from marketplace.models import ProviderProfile, Service, Category
from reviews.models import Review
from ai_engine.services.ai_client import AIServiceException

User = get_user_model()

class Phase5ReviewIntelligenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Provider User
        self.provider_user = User.objects.create_user(
            username="artisan_lakshmi",
            first_name="Lakshmi",
            email="lakshmi@silverhands.org",
            role=User.Role.PROVIDER
        )
        self.profile = ProviderProfile.objects.create(
            user=self.provider_user,
            location="Adyar, Chennai",
            skills=["Traditional Cooking", "Tutoring"],
            experience_years=25,
            rating=5.0,
            review_count=2
        )
        
        # Customer User
        self.customer_user = User.objects.create_user(
            username="customer_anand",
            email="anand@example.com",
            role=User.Role.CUSTOMER
        )
        
        self.cat = Category.objects.create(name="Cooking", slug="cooking")
        self.service = Service.objects.create(
            provider=self.profile,
            category=self.cat,
            title="Traditional Chettinad Cooking Class",
            description="Authentic home-style cooking instruction.",
            price=500,
            is_available=True
        )

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated requests to review intelligence return 401."""
        response = self.client.get('/api/reviews/intelligence/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_role_denied(self):
        """Test that non-providers cannot access provider review intelligence."""
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get('/api/reviews/intelligence/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_insufficient_reviews_empty_state(self):
        """Test that providers with < 2 reviews receive a helpful insufficient-data response."""
        self.client.force_authenticate(user=self.provider_user)
        response = self.client.get('/api/reviews/intelligence/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertFalse(data['has_sufficient_data'])
        self.assertIn("Not enough customer feedback", data['message'])

    @patch('ai_engine.services.ai_client.ai_client.generate_json')
    def test_review_intelligence_success(self, mock_generate):
        """Test AI review analysis on real customer reviews."""
        # Create 2 real reviews
        Review.objects.create(
            customer=self.customer_user,
            provider=self.profile,
            service=self.service,
            rating=5,
            comment="Lakshmi is incredibly patient and her traditional sambar recipe is unbeatable!"
        )
        Review.objects.create(
            customer=self.customer_user,
            provider=self.profile,
            service=self.service,
            rating=5,
            comment="Wonderful elder teacher. Clear instructions and warm hospitality."
        )

        mock_generate.return_value = {
            "summary": "Customers consistently praise Lakshmi for her patient teaching style and authentic traditional recipes.",
            "strengths": ["Authentic traditional recipes", "Patient and warm teaching style"],
            "improvement_areas": ["Consider offering weekend morning slots"],
            "customer_preferences": ["Hands-on cooking guidance"],
            "demand_signals": ["High demand for South Indian vegetarian feasts"]
        }

        self.client.force_authenticate(user=self.provider_user)
        response = self.client.get('/api/reviews/intelligence/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['has_sufficient_data'])
        self.assertEqual(data['total_reviews'], 2)
        self.assertIn("patient teaching style", data['summary'])
        self.assertIn("Authentic traditional recipes", data['strengths'])

    @patch('ai_engine.services.ai_client.ai_client.generate_json')
    def test_review_intelligence_ai_fallback(self, mock_generate):
        """Test graceful fallback when external AI fails."""
        Review.objects.create(
            customer=self.customer_user,
            provider=self.profile,
            service=self.service,
            rating=5,
            comment="Great experience learning to cook traditional meals!"
        )
        Review.objects.create(
            customer=self.customer_user,
            provider=self.profile,
            service=self.service,
            rating=4,
            comment="Very helpful and kind artisan."
        )

        mock_generate.side_effect = AIServiceException("AI Service Timeout")

        self.client.force_authenticate(user=self.provider_user)
        response = self.client.get('/api/reviews/intelligence/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['has_sufficient_data'])
        self.assertEqual(data['total_reviews'], 2)
        self.assertIn("High client satisfaction", data['strengths'])
