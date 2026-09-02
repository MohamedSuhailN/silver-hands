from rest_framework import generics, permissions, status, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, ProviderProfile, Service, Product, haversine_km
from .serializers import (
    CategorySerializer, ProviderProfileSerializer, ServiceSerializer, ProductSerializer
)

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

def calculate_profile_completion(profile):
    score = 0
    missing_items = []
    
    if profile.user.first_name or profile.user.last_name:
        score += 10
    else:
        missing_items.append("Add your full name (+10%)")
        
    if getattr(profile.user, 'phone', None):
        score += 10
    else:
        missing_items.append("Add your phone number (+10%)")
        
    if profile.location and len(profile.location) > 3:
        score += 15
    else:
        missing_items.append("Set your service location area (+15%)")
        
    if profile.experience_years > 0:
        score += 10
    else:
        missing_items.append("Add your experience years (+10%)")
        
    if profile.bio and len(profile.bio.strip()) > 10:
        score += 15
    else:
        missing_items.append("Write a brief bio about your craft (+15%)")
        
    if profile.skills and len(profile.skills) > 0:
        score += 10
    else:
        missing_items.append("Add or discover your skills with AI (+10%)")
        
    if profile.languages and len(profile.languages) > 0:
        score += 10
    else:
        missing_items.append("Add spoken languages (+10%)")
        
    if profile.availability and (profile.availability.get('days') or profile.availability.get('available_days')):
        score += 10
    else:
        missing_items.append("Set your weekly availability schedule (+10%)")
        
    if profile.services.filter(is_available=True).exists() or profile.products.filter(is_available=True).exists():
        score += 10
    else:
        missing_items.append("Publish at least one service or handmade product (+10%)")
        
    return min(100, score), missing_items


def calculate_trust_indicator(profile):
    """
    Computes a transparent, factual trust indicator based strictly on real profile data and activity.
    """
    score = 40
    factors = []

    if profile.is_verified or getattr(profile.user, 'email', None):
        score += 15
        factors.append("Verified email / login account")

    comp_score, _ = calculate_profile_completion(profile)
    if comp_score >= 80:
        score += 20
        factors.append("Comprehensive profile & craft description")
    elif comp_score >= 50:
        score += 10
        factors.append("Profile details provided")

    if profile.skills and len(profile.skills) > 0:
        score += 10
        factors.append(f"{len(profile.skills)} declared livelihood skills")

    if profile.experience_years >= 10:
        score += 10
        factors.append(f"{profile.experience_years}+ years of craft experience")

    completed_count = profile.received_bookings.filter(status='COMPLETED').count() + profile.received_orders.filter(status='COMPLETED').count()
    if completed_count >= 5:
        score += 15
        factors.append("5+ completed livelihood bookings")
    elif completed_count >= 1:
        score += 8
        factors.append("Completed customer bookings on record")

    if profile.review_count >= 3 and profile.rating and float(profile.rating) >= 4.5:
        score += 10
        factors.append("Top-rated verified customer feedback")

    final_score = min(99, max(50, score))
    return {
        "trust_score": final_score,
        "trust_level": "VERIFIED_ARTISAN" if final_score >= 85 else "COMMUNITY_PROVIDER",
        "factors": factors,
        "explanation": "Calculated transparently from account verification, profile completeness, experience, completed bookings, and genuine reviews."
    }


class ProviderMeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan.',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Traditional Craft']
            }
        )
        serializer = ProviderProfileSerializer(profile)
        data = serializer.data
        score, missing = calculate_profile_completion(profile)
        trust_data = calculate_trust_indicator(profile)
        data['profile_completion_score'] = score
        data['missing_checklist'] = missing
        data['trust_breakdown'] = trust_data
        data['trust_score'] = trust_data['trust_score']
        return Response(data)

    def patch(self, request):
        user = request.user
        profile, _ = ProviderProfile.objects.get_or_create(user=user)
        
        bio = request.data.get('bio')
        skills = request.data.get('skills')
        experience_years = request.data.get('experience_years')
        languages = request.data.get('languages')
        location = request.data.get('location')
        availability = request.data.get('availability')
        skill_passport = request.data.get('skill_passport')
        first_name = request.data.get('first_name') or request.data.get('name')
        last_name = request.data.get('last_name')
        age = request.data.get('age')

        user_dirty = False
        if first_name is not None:
            parts = str(first_name).strip().split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1 and not last_name:
                user.last_name = parts[1]
            user_dirty = True
            
        if last_name is not None:
            user.last_name = last_name
            user_dirty = True

        if age is not None:
            try:
                age_val = int(age)
                if age_val >= 60:
                    user.is_senior = True
                    user_dirty = True
                if not isinstance(profile.skill_passport, dict):
                    profile.skill_passport = {}
                profile.skill_passport['age'] = age_val
            except (ValueError, TypeError):
                pass

        if user_dirty:
            user.save()
        
        if bio is not None: profile.bio = bio
        if skills is not None: 
            if isinstance(skills, str):
                profile.skills = [s.strip() for s in skills.split(',') if s.strip()]
            else:
                profile.skills = list(skills)
        if experience_years is not None:
            try:
                profile.experience_years = int(experience_years)
            except (ValueError, TypeError):
                pass
        if languages is not None: 
            if isinstance(languages, str):
                profile.languages = [l.strip() for l in languages.split(',') if l.strip()]
            else:
                profile.languages = list(languages)
        if location is not None: profile.location = location
        if availability is not None: profile.availability = availability
        if skill_passport is not None and isinstance(skill_passport, dict): 
            if not isinstance(profile.skill_passport, dict):
                profile.skill_passport = {}
            profile.skill_passport.update(skill_passport)
        
        profile.save()
        
        serializer = ProviderProfileSerializer(profile)
        data = serializer.data
        score, missing = calculate_profile_completion(profile)
        data['profile_completion_score'] = score
        data['missing_checklist'] = missing
        return Response(data)


class ProviderAnalyticsView(APIView):
    """
    Returns real livelihood analytics, KPIs, trends, and Opportunity Radar recommendations for the authenticated provider.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            profile = user.provider_profile
        except Exception:
            return Response(
                {"error": "Only registered providers can view analytics."},
                status=status.HTTP_403_FORBIDDEN
            )

        from bookings.models import Booking, Order
        from platform_ops.models import Opportunity
        from platform_ops.serializers import OpportunitySerializer
        from django.db.models import Sum
        from decimal import Decimal

        # Real Earnings & Completed Counts
        completed_bookings = Booking.objects.filter(service__provider=profile, status='COMPLETED')
        completed_orders = Order.objects.filter(product__provider=profile, status='COMPLETED')

        booking_earnings = completed_bookings.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')
        order_earnings = completed_orders.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')
        total_earnings = booking_earnings + order_earnings

        completed_jobs_count = completed_bookings.count() + completed_orders.count()
        upcoming_bookings_count = Booking.objects.filter(service__provider=profile, status__in=['ACCEPTED', 'UPCOMING']).count()
        pending_requests_count = Booking.objects.filter(service__provider=profile, status='PENDING').count() + Order.objects.filter(product__provider=profile, status='PENDING').count()

        # Service Demand Breakdown
        services = profile.services.all()
        service_stats = []
        for s in services:
            b_count = s.bookings.count()
            service_stats.append({
                "service_id": s.id,
                "title": s.title,
                "price": float(s.price),
                "total_bookings": b_count,
                "rating": float(s.rating) if s.rating else 5.0
            })

        # Opportunity Radar Match Recommendations
        p_skills = [str(s).lower() for s in (profile.skills or [])]
        opps = Opportunity.objects.filter(is_active=True).order_by('-created_at')[:10]
        recommended_opps = []
        for opp in opps:
            opp_text = f"{opp.title} {opp.description} {opp.category}".lower()
            matched = [s for s in p_skills if s in opp_text]
            dist = haversine_km(profile.latitude, profile.longitude, opp.latitude, opp.longitude) or 3.2
            
            reasons = []
            if matched:
                reasons.append(f"Matches your '{matched[0].title()}' skill")
            if dist <= 10.0:
                reasons.append(f"Located ~{dist} km from your area")
            if opp.budget and float(opp.budget) >= 500:
                reasons.append(f"Fair pay: ₹{int(opp.budget)}")
                
            opp_data = OpportunitySerializer(opp).data
            opp_data['distance_km'] = dist
            opp_data['match_reasons'] = reasons if reasons else ["General livelihood opportunity in your city"]
            opp_data['recommendation_explanation'] = f"Recommended because {reasons[0].lower() if reasons else 'it matches your profile'}."
            recommended_opps.append(opp_data)

        has_real_activity = (completed_jobs_count > 0 or upcoming_bookings_count > 0 or pending_requests_count > 0)

        return Response({
            "has_data": has_real_activity,
            "total_earnings": float(total_earnings),
            "completed_jobs": completed_jobs_count,
            "upcoming_bookings": upcoming_bookings_count,
            "pending_requests": pending_requests_count,
            "rating": float(profile.rating) if profile.rating else 5.0,
            "review_count": profile.review_count,
            "trust_score": profile.trust_score,
            "service_stats": service_stats,
            "recommended_opportunities": recommended_opps[:4]
        })


class ProviderListView(generics.ListAPIView):
    serializer_class = ProviderProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = ProviderProfile.objects.select_related('user').prefetch_related('services', 'products')
        cat = self.request.query_params.get('category')
        skill = self.request.query_params.get('skill')
        lang = self.request.query_params.get('language')
        verified = self.request.query_params.get('verified')

        if cat:
            qs = qs.filter(services__category__slug=cat).distinct()
        if skill:
            qs = qs.filter(skills__icontains=skill)
        if lang:
            qs = qs.filter(languages__icontains=lang)
        if verified == 'true':
            qs = qs.filter(is_verified=True)
        return qs

class ProviderDetailView(generics.RetrieveAPIView):
    queryset = ProviderProfile.objects.select_related('user').prefetch_related('services', 'products')
    serializer_class = ProviderProfileSerializer
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        score, missing = calculate_profile_completion(instance)
        trust_data = calculate_trust_indicator(instance)
        data['profile_completion_score'] = score
        data['trust_breakdown'] = trust_data
        data['trust_score'] = trust_data['trust_score']
        return Response(data)

class ServiceListView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            qs = Service.objects.select_related('provider__user', 'category').filter(
                Q(provider__id=provider_id) | Q(provider__user__id=provider_id)
            )
        else:
            qs = Service.objects.select_related('provider__user', 'category').filter(is_available=True)

        cat = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if cat:
            qs = qs.filter(category__slug=cat)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search) | Q(provider__user__first_name__icontains=search))
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'CUSTOMER':
            raise exceptions.PermissionDenied("Customers are not permitted to publish services. Please register as a Provider or Homemaker Artisan.")

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan.',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Traditional Craft']
            }
        )
        serializer.save(provider=provider_prof)

class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.select_related('provider__user', 'category')
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            # For the provider dashboard: return all products (available & sold out)
            qs = Product.objects.select_related('provider__user', 'category').filter(
                Q(provider__id=provider_id) | Q(provider__user__id=provider_id)
            )
        else:
            # For general marketplace: strictly available items with stock > 0
            qs = Product.objects.select_related('provider__user', 'category').filter(
                is_available=True, quantity__gt=0
            )

        cat = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        ordering = self.request.query_params.get('ordering')

        if cat:
            qs = qs.filter(category__slug=cat)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search) | Q(provider__user__first_name__icontains=search))
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if ordering:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'CUSTOMER':
            raise exceptions.PermissionDenied("Customers are not permitted to sell products. Please register as a Provider or Homemaker Artisan.")

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan.',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Traditional Craft']
            }
        )
        serializer.save(provider=provider_prof)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('provider__user', 'category')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class UnifiedSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'services': [], 'products': [], 'providers': []})

        services = Service.objects.filter(is_available=True).filter(
            Q(title__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q)
        )[:10]

        products = Product.objects.filter(is_available=True, quantity__gt=0).filter(
            Q(title__icontains=q) | Q(description__icontains=q) | Q(category__name__icontains=q)
        )[:10]

        providers = ProviderProfile.objects.filter(
            Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q) | Q(bio__icontains=q) | Q(skills__icontains=q)
        )[:10]

        return Response({
            'services': ServiceSerializer(services, many=True).data,
            'products': ProductSerializer(products, many=True).data,
            'providers': ProviderProfileSerializer(providers, many=True).data
        })
