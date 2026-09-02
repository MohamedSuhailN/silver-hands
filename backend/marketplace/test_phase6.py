from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from marketplace.models import ProviderProfile, Service, Category, Product
from bookings.models import Booking, Order
from platform_ops.models import Opportunity, OpportunityResponse

User = get_user_model()

class Phase6ProviderDashboardAndRadarTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Provider user
        self.provider_user = User.objects.create_user(
            username="artisan_meena",
            first_name="Meena",
            email="meena@silverhands.org",
            role=User.Role.PROVIDER
        )
        self.profile = ProviderProfile.objects.create(
            user=self.provider_user,
            location="Mylapore, Chennai",
            latitude=13.0336,
            longitude=80.2676,
            skills=["Traditional Cooking", "Kolam Art"],
            experience_years=30,
            rating=5.0,
            review_count=12
        )

        # Customer user
        self.customer_user = User.objects.create_user(
            username="cust_karthik",
            email="karthik@example.com",
            role=User.Role.CUSTOMER
        )

        self.cat = Category.objects.create(name="Culinary", slug="culinary")
        self.service = Service.objects.create(
            provider=self.profile,
            category=self.cat,
            title="Traditional South Indian Meals",
            price=Decimal('450.00'),
            is_available=True
        )

        self.product = Product.objects.create(
            provider=self.profile,
            category=self.cat,
            title="Homemade Andhra Pickles",
            price=Decimal('200.00'),
            quantity=15,
            is_available=True
        )

        # Create active opportunities
        self.opp_cooking = Opportunity.objects.create(
            title="Family Feast Cook Needed",
            category="Traditional Cooking",
            description="Need an elder cook experienced in Traditional Cooking for 10 people in Mylapore.",
            budget=Decimal('1500.00'),
            location_name="Mylapore, Chennai",
            latitude=13.0336,
            longitude=80.2676,
            is_active=True
        )

        self.opp_distant = Opportunity.objects.create(
            title="Gardener in Bangalore",
            category="Gardening",
            description="Need organic gardening help in Bangalore.",
            budget=Decimal('800.00'),
            location_name="Indiranagar, Bangalore",
            latitude=12.9716,
            longitude=77.5946,
            is_active=True
        )

    def test_unauthenticated_analytics_denied(self):
        """Test unauthenticated access to provider analytics returns 401."""
        response = self.client.get('/api/providers/me/analytics/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_role_analytics_denied(self):
        """Test customers cannot access provider analytics."""
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get('/api/providers/me/analytics/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_real_analytics_aggregation(self):
        """Test real earnings and completed work calculations."""
        # 1 Completed Booking: ₹450
        Booking.objects.create(
            customer=self.customer_user,
            service=self.service,
            provider=self.profile,
            total_price=Decimal('450.00'),
            status=Booking.Status.COMPLETED
        )
        # 1 Completed Order: ₹400 (2 * ₹200)
        Order.objects.create(
            customer=self.customer_user,
            product=self.product,
            provider=self.profile,
            quantity=2,
            unit_price=Decimal('200.00'),
            total_price=Decimal('400.00'),
            status=Order.Status.COMPLETED
        )
        # 1 Pending Booking
        Booking.objects.create(
            customer=self.customer_user,
            service=self.service,
            provider=self.profile,
            total_price=Decimal('450.00'),
            status=Booking.Status.PENDING
        )

        self.client.force_authenticate(user=self.provider_user)
        response = self.client.get('/api/providers/me/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertTrue(data['has_data'])
        self.assertEqual(data['total_earnings'], 850.0) # 450 + 400
        self.assertEqual(data['completed_jobs'], 2) # 1 booking + 1 order
        self.assertEqual(data['pending_requests'], 1)

    def test_opportunity_radar_matching_and_explainability(self):
        """Test Opportunity Radar matches provider skill and generates explainability reasons."""
        self.client.force_authenticate(user=self.provider_user)
        response = self.client.get('/api/providers/me/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        opps = data['recommended_opportunities']
        self.assertGreaterEqual(len(opps), 1)
        top_opp = opps[0]
        self.assertEqual(top_opp['title'], "Family Feast Cook Needed")
        self.assertIn("Traditional Cooking", str(top_opp['match_reasons']))
        self.assertIn("Recommended because", top_opp['recommendation_explanation'])

    def test_respond_to_opportunity(self):
        """Test provider responding/expressing interest in an opportunity gig."""
        self.client.force_authenticate(user=self.provider_user)
        payload = {
            "message": "I have 30 years experience cooking traditional feasts in Mylapore.",
            "proposed_price": 1500
        }
        response = self.client.post(f'/api/opportunities/{self.opp_cooking.id}/respond/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify in database
        self.assertTrue(OpportunityResponse.objects.filter(opportunity=self.opp_cooking, provider=self.provider_user).exists())
