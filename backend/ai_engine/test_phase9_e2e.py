from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from marketplace.models import Category, ProviderProfile, Service, Product
from bookings.models import Booking
from reviews.models import Review
from platform_ops.models import Opportunity, OpportunityResponse
from ai_engine.services.matching import match_providers

User = get_user_model()

class Phase9MasterE2EIntegrationTests(TestCase):
    """
    Master end-to-end integration test suite verifying the complete SilverHands livelihood ecosystem across all phases.
    """
    def setUp(self):
        self.client = APIClient()

        # Category
        self.category_cook = Category.objects.create(name="Cooking", slug="cooking", icon="cook")
        self.category_tutor = Category.objects.create(name="Tutoring", slug="tutoring", icon="tutor")

        # Elder Provider: Lakshmi (65 yrs old)
        self.lakshmi_user = User.objects.create_user(
            username="lakshmi_amma",
            first_name="Lakshmi",
            last_name="Sundaram",
            email="lakshmi@silverhands.org",
            role=User.Role.PROVIDER,
            is_senior=True
        )
        self.lakshmi_profile = ProviderProfile.objects.create(
            user=self.lakshmi_user,
            location="Adyar, Chennai",
            latitude=13.0067,
            longitude=80.2574,
            skills=["Traditional Cooking", "Pickle Making", "Tamil Tutoring"],
            experience_years=35,
            bio="65-year old elder cook specializing in Tanjore style vegetarian cooking and pickles.",
            rating=5.0,
            review_count=3,
            is_verified=True
        )

        self.service_meals = Service.objects.create(
            provider=self.lakshmi_profile,
            category=self.category_cook,
            title="Authentic South Indian Meals",
            price=Decimal('500.00'),
            is_available=True
        )

        # Customer: Senthil
        self.customer_user = User.objects.create_user(
            username="senthil_k",
            first_name="Senthil",
            email="senthil@example.com",
            role=User.Role.CUSTOMER
        )

        # Opportunity Gig
        self.opp_catering = Opportunity.objects.create(
            title="Housewarming Feast Cook Needed",
            category="Traditional Cooking",
            description="Need authentic traditional cooking for 15 family guests in Adyar.",
            budget=Decimal('2500.00'),
            location_name="Adyar, Chennai",
            latitude=13.0067,
            longitude=80.2574,
            is_active=True
        )

    def test_e2e_customer_matching_and_discovery(self):
        """1. Verify customer search matches provider by skill and location with explainability."""
        res = match_providers(requirement_text="traditional cooking", location="Adyar")
        matches = res.get('matches', []) or res.get('providers', []) or res.get('services', [])
        self.assertGreaterEqual(len(matches), 1)
        top_match = matches[0]
        self.assertIn("Traditional Cooking", str(top_match.get('reasons') or top_match.get('match_reasons') or top_match.get('title') or ''))

    def test_e2e_provider_analytics_and_opportunity_radar(self):
        """2. Verify provider analytics calculation and Opportunity Radar gig matching."""
        # Create 1 completed booking for Lakshmi
        Booking.objects.create(
            customer=self.customer_user,
            service=self.service_meals,
            provider=self.lakshmi_profile,
            total_price=Decimal('500.00'),
            status=Booking.Status.COMPLETED
        )

        self.client.force_authenticate(user=self.lakshmi_user)
        res = self.client.get('/api/providers/me/analytics/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertTrue(data['has_data'])
        self.assertEqual(data['total_earnings'], 500.0)
        self.assertEqual(data['completed_jobs'], 1)
        self.assertGreaterEqual(len(data['recommended_opportunities']), 1)
        self.assertEqual(data['recommended_opportunities'][0]['title'], "Housewarming Feast Cook Needed")

    def test_e2e_provider_opportunity_response(self):
        """3. Verify provider can express interest / accept opportunity gig."""
        self.client.force_authenticate(user=self.lakshmi_user)
        payload = {
            "message": "Namaste! I have 35 years of traditional feast cooking experience.",
            "proposed_price": 2500
        }
        res = self.client.post(f'/api/opportunities/{self.opp_catering.id}/respond/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(OpportunityResponse.objects.filter(opportunity=self.opp_catering, provider=self.lakshmi_user).exists())

    def test_e2e_review_intelligence_synthesis(self):
        """4. Verify customer review creates structured review intelligence for provider."""
        Review.objects.create(
            provider=self.lakshmi_profile,
            service=self.service_meals,
            customer=self.customer_user,
            rating=5,
            comment="Lakshmi Amma's Tanjore meals were delicious, authentic, and punctual."
        )
        Review.objects.create(
            provider=self.lakshmi_profile,
            service=self.service_meals,
            customer=self.customer_user,
            rating=5,
            comment="The traditional spices and sambar were outstanding. High hygiene."
        )

        self.client.force_authenticate(user=self.lakshmi_user)
        res = self.client.get('/api/reviews/intelligence/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertTrue(data['has_sufficient_data'])
        self.assertGreaterEqual(data['total_reviews'], 2)
        self.assertIn('summary', data)
        self.assertGreaterEqual(len(data['strengths']), 1)
