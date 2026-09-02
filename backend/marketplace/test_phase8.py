from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from marketplace.models import ProviderProfile, Service, Category
from marketplace.views import calculate_trust_indicator

User = get_user_model()

class Phase8TrustAndSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.provider_user_1 = User.objects.create_user(
            username="elder_artisan_1",
            first_name="Kamala",
            email="kamala@silverhands.org",
            role=User.Role.PROVIDER
        )
        self.profile_1 = ProviderProfile.objects.create(
            user=self.provider_user_1,
            location="Adyar, Chennai",
            skills=["Traditional Cooking", "Pickle Making"],
            experience_years=25,
            bio="Traditional south indian home cook with 25 years experience."
        )

        self.provider_user_2 = User.objects.create_user(
            username="elder_artisan_2",
            first_name="Radha",
            email="radha@silverhands.org",
            role=User.Role.PROVIDER
        )
        self.profile_2 = ProviderProfile.objects.create(
            user=self.provider_user_2,
            location="Mylapore, Chennai",
            skills=["Tailoring"],
            experience_years=15,
            bio="Traditional saree blouse tailoring expert."
        )

        self.customer_user = User.objects.create_user(
            username="cust_vikram",
            email="vikram@example.com",
            role=User.Role.CUSTOMER
        )

    def test_transparent_trust_indicator_calculation(self):
        """Test trust score is calculated transparently from real factors."""
        trust = calculate_trust_indicator(self.profile_1)
        self.assertIn('trust_score', trust)
        self.assertIn('factors', trust)
        self.assertIn('explanation', trust)
        self.assertGreaterEqual(trust['trust_score'], 50)
        self.assertLessEqual(trust['trust_score'], 99)
        self.assertTrue(any('experience' in f.lower() for f in trust['factors']))

    def test_provider_profile_security_isolation(self):
        """Test provider 1 cannot mutate provider 2's profile via /api/providers/me/."""
        self.client.force_authenticate(user=self.provider_user_1)
        
        patch_data = {
            "bio": "Hacked bio for Kamala",
            "experience_years": 40
        }
        res = self.client.patch('/api/providers/me/', patch_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Profile 1 should update
        self.profile_1.refresh_from_db()
        self.assertEqual(self.profile_1.bio, "Hacked bio for Kamala")

        # Profile 2 MUST remain unchanged
        self.profile_2.refresh_from_db()
        self.assertNotEqual(self.profile_2.bio, "Hacked bio for Kamala")
        self.assertEqual(self.profile_2.experience_years, 15)

    def test_no_secrets_leaked_in_responses(self):
        """Test API responses never contain API keys or secret tokens."""
        self.client.force_authenticate(user=self.provider_user_1)
        res = self.client.get('/api/providers/me/')
        data_str = str(res.json()).lower()
        self.assertNotIn("groq_api_key", data_str)
        self.assertNotIn("secret_key", data_str)
        self.assertNotIn("gsk_", data_str)

    def test_unauthenticated_requests_blocked(self):
        """Test unauthenticated mutation requests are rejected."""
        res = self.client.patch('/api/providers/me/', {"bio": "Anonymous mutation"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
