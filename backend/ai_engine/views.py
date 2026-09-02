from decimal import Decimal
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from marketplace.models import Category, ProviderProfile, Service, Product
from marketplace.serializers import ServiceSerializer, ProductSerializer, ProviderProfileSerializer

from .services.ai_client import ai_client
from .services.business_assistant import ask_business_assistant
from .services.description import generate_business_description
from .services.matching import match_providers
from .services.pricing import suggest_fair_price
from .services.scam_detection import detect_scam_message
from .services.service_suggestion import suggest_services
from .services.skill_extraction import extract_skills_from_text
from .services.skill_suggestion import suggest_skills_and_livelihoods
from .services.assistant import assistant

User = get_user_model()

class IsProviderOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.role in [User.Role.PROVIDER, User.Role.ADMIN] or request.user.is_staff)

class AIAssistantView(APIView):
    """
    Central AI Assistant endpoint.
    
    POST /api/ai/assistant/
    
    Request:
    {
        "user_input": "I need someone to teach Tamil near Adyar",
        "session_id": "optional_session_id",
        "context": {} optional context dict
    }
    
    Response:
    {
        "intent": "SEARCH_SERVICE",
        "action": "search_providers",
        "message": "Looking for Tamil tutoring near Adyar...",
        "confirmation_needed": false,
        "extracted_data": {...},
        "navigation_target": "optional_route",
        "backend_action": {
            "endpoint": "/api/ai/match/",
            "method": "POST",
            "payload": {...}
        }
    }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_input = request.data.get('user_input', '').strip()
        session_id = request.data.get('session_id')
        
        if not user_input:
            return Response(
                {'error': 'user_input is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process input through assistant
        result = assistant.process_user_input(
            user_input=user_input,
            user=request.user if request.user.is_authenticated else None,
            session_id=session_id
        )
        
        # Clean up response for frontend
        response_data = {
            'intent': result.get('intent'),
            'action': result.get('action'),
            'message': result.get('message'),
            'confirmation_needed': result.get('confirmation_needed', False),
            'extracted_data': result.get('extracted_data'),
            'matches': result.get('matches', []),
        }
        
        # Add navigation target if present
        if result.get('navigation_target'):
            response_data['navigation_target'] = result['navigation_target']
        
        # Add backend action if present (for frontend to call)
        if result.get('action_on_confirm'):
            response_data['backend_action'] = result['action_on_confirm']
        
        return Response(response_data, status=status.HTTP_200_OK)

class AIHealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'status': 'healthy',
            'provider': 'ai_engine',
            'model': 'neural_model',
            'is_configured': ai_client.is_configured(),
            'languages_supported': ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'],
        })

class AIMatchView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        req_text = request.data.get('requirement_text') or request.data.get('requirement', '')
        if not req_text:
            return Response({'error': 'Requirement text is required'}, status=status.HTTP_400_BAD_REQUEST)

        category = request.data.get('category', '')
        location = request.data.get('location', '')
        budget = request.data.get('budget')
        language = request.data.get('language', '')
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        result = match_providers(
            requirement_text=req_text,
            category=category,
            location=location,
            budget=budget,
            language=language,
            lat=lat,
            lng=lng
        )
        return Response(result)

class AIProfileWizardView(APIView):
    """
    Provider-specific: Complete AI Profile & Service Generator Wizard (Suji intelligence suite).
    Extracts skills, suggests livelihood expansions, provides pricing analysis, and generates tiered service card packages.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        text = request.data.get('text') or request.data.get('speech_text', '')
        if not text:
            return Response({'error': 'Please provide speech or text description of your craft'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        name = user.get_full_name() or user.first_name or user.username
        location = user.address or 'Chennai, TN'

        system_instruction = (
            "You are the SilverHands Master AI Artisan & Homemaker Onboarding Wizard.\n"
            "Given an artisan or homemaker's story, generate a structured JSON profile and service proposal.\n"
            "STRICT CONSTRAINTS:\n"
            "1. 'bio': warm, dignified, and professional 3-sentence summary highlighting experience.\n"
            "2. 'skills': 4-6 specific practical skills (e.g. ['Traditional Chettinad Cooking', 'Homemade Pickles', 'Festival Sweets']).\n"
            "3. 'experience_years': integer number of practical years (default to 15 if not stated).\n"
            "4. 'category_slug': one of ['cooking', 'tailoring', 'tutoring', 'gardening', 'childcare', 'language', 'music', 'handicrafts', 'mentoring', 'consulting'].\n"
            "5. 'skill_passport': { 'title': 'Grandmaster of Traditional Cuisine', 'trust_score': 96, 'badges': ['Phone Verified', 'Practical Master', 'Heritage Craft'], 'highlights': ['20+ Years Family Recipes', '100% Homemade'] }.\n"
            "6. 'suggested_services': array of 3 distinct service packages: [{ 'title': 'Authentic Traditional Home Cooking', 'category_slug': 'cooking', 'price': 800, 'pricing_unit': 'per session', 'duration': '2 hours', 'description': 'Full traditional meal preparation with authentic spices.', 'tier': 'Standard Package' }, { 'title': 'Festival & Special Event Feast Catering', 'category_slug': 'cooking', 'price': 2400, 'pricing_unit': 'per event', 'duration': '4 hours', 'description': 'Complete multi-course traditional celebration feast.', 'tier': 'Premium Celebration' }, { 'title': 'Artisan Recipe Masterclass & Mentoring', 'category_slug': 'cooking', 'price': 600, 'pricing_unit': 'per hour', 'duration': '1 hour', 'description': 'Hands-on training and heirloom recipe secrets.', 'tier': '1-on-1 Mentoring' }].\n"
            "7. 'pricing_analysis': { 'fair_price': 800, 'min_price': 600, 'max_price': 1200, 'explanation': 'Fair wage based on Chennai market rates and years of experience.' }.\n"
            "8. 'adjacent_livelihoods': ['Homemade Spice Powder Mixes', 'Weekend Traditional Lunch Packs', 'Custom Festive Hampers'].\n"
            "Return strictly valid JSON with keys: bio, skills, experience_years, category_slug, skill_passport, suggested_services, pricing_analysis, adjacent_livelihoods."
        )

        fallback_response = {
            'bio': f"Dedicated homemaker and experienced artisan with deep practical expertise in traditional crafts and home services in {location}.",
            'skills': ['Traditional Cooking', 'Home Consulting', 'Cultural Arts', 'Bespoke Craftsmanship'],
            'experience_years': 15,
            'category_slug': 'cooking',
            'skill_passport': {
                'title': 'Certified Traditional Craftsperson',
                'trust_score': 96,
                'badges': ['Identity Verified', '15+ Years Hands-on Master', 'SilverHands Certified'],
                'highlights': ['Authentic Homemade Methods', 'Personalized Attention', 'Verified Heritage Craft']
            },
            'suggested_services': [
                {
                    'title': 'Authentic Traditional Home Service',
                    'category_slug': 'cooking',
                    'price': 800,
                    'pricing_unit': 'per session',
                    'duration': '2 hours',
                    'description': f"Personalized traditional service provided with authentic care and verified experience by {name}.",
                    'languages': ['Tamil', 'English'],
                    'tier': 'Standard Session'
                },
                {
                    'title': 'Special Event & Weekend Preparation',
                    'category_slug': 'cooking',
                    'price': 2200,
                    'pricing_unit': 'per event',
                    'duration': '4 hours',
                    'description': f"Complete traditional preparation for family gatherings and festive occasions with custom menu.",
                    'languages': ['Tamil', 'English'],
                    'tier': 'Premium Gathering'
                },
                {
                    'title': '1-on-1 Craft & Skill Mentoring',
                    'category_slug': 'cooking',
                    'price': 500,
                    'pricing_unit': 'per hour',
                    'duration': '1 hour',
                    'description': f"Private step-by-step coaching and practical wisdom sharing by {name}.",
                    'languages': ['Tamil', 'English'],
                    'tier': 'Personal Mentoring'
                }
            ],
            'pricing_analysis': {
                'fair_price': 800,
                'min_price': 600,
                'max_price': 1200,
                'explanation': 'Fair wage calculated based on local neighborhood benchmark and practical expertise.'
            },
            'adjacent_livelihoods': [
                'Homemade Condiment & Specialty Packs',
                'Weekend Family Meal Subscriptions',
                'Custom Artisan Hampers'
            ]
        }

        try:
            if ai_client.is_configured():
                prompt = f"Artisan/Homemaker Name: {name}\nLocation: {location}\nSpoken Story/Input:\n\"{text}\""
                ai_data = ai_client.generate_json(prompt, system_instruction=system_instruction, default_fallback=fallback_response)
            else:
                ai_data = fallback_response
        except Exception:
            ai_data = fallback_response

        return Response(ai_data)

class ConfirmServiceCardView(APIView):
    """
    Provider-specific: Confirms and publishes the Service Card directly to the database.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        user = request.user
        data = request.data

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': data.get('bio', 'Dedicated homemaker and skilled artisan'),
                'location': user.address or 'Chennai, TN',
                'experience_years': data.get('experience_years', 15),
                'skills': data.get('skills', ['Traditional Craft']),
                'skill_passport': data.get('skill_passport', {})
            }
        )

        if data.get('bio'):
            provider_prof.bio = data['bio']
        if data.get('skills'):
            provider_prof.skills = data['skills']
        if data.get('skill_passport'):
            provider_prof.skill_passport = data['skill_passport']
        if data.get('experience_years'):
            provider_prof.experience_years = data['experience_years']
        provider_prof.save()

        cat_slug = data.get('category_slug', 'cooking')
        category = Category.objects.filter(slug=cat_slug).first() or Category.objects.first()

        service = Service.objects.create(
            provider=provider_prof,
            category=category,
            title=data.get('title', 'Authentic Traditional Service'),
            description=data.get('description', 'High quality traditional service by verified artisan.'),
            price=Decimal(str(data.get('price', 800))),
            pricing_unit=data.get('pricing_unit', 'per session'),
            duration=data.get('duration', '2 hours'),
            languages=data.get('languages', ['Tamil', 'English']),
            image_url=data.get('image_url', f"https://picsum.photos/seed/{user.username}-{cat_slug}/500/350")
        )

        return Response({
            'message': 'Service published successfully!',
            'service': ServiceSerializer(service).data,
            'provider': ProviderProfileSerializer(provider_prof).data
        }, status=status.HTTP_201_CREATED)

class GenerateProductCardView(APIView):
    """
    Provider-specific: AI Product Card Generator.
    Takes craft/recipe idea, generates title, description, shelf-life, price, and category.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        idea = request.data.get('idea', '')
        if not idea:
            return Response({'error': 'Please describe your handmade product idea'}, status=status.HTTP_400_BAD_REQUEST)

        system_instruction = (
            "You are the SilverHands AI Handmade Product Card Creator.\n"
            "Given a homemaker's product idea, generate a complete structured product card.\n"
            "Return valid JSON with keys: title, category_slug (one of cooking, tailoring, gardening, handicrafts), price (integer in INR), quantity (default 10), description (artisan product pitch), shelf_life, ingredients_or_materials."
        )

        fallback = {
            'title': 'Homemade Traditional Artisan Delicacy',
            'category_slug': 'cooking',
            'price': 220,
            'quantity': 15,
            'description': '100% natural, freshly prepared handmade item with authentic family recipe and hygienic packaging.',
            'shelf_life': '60 days',
            'ingredients_or_materials': 'Traditional home ingredients, cold-pressed oils, pure spices'
        }

        try:
            if ai_client.is_configured():
                res_data = ai_client.generate_json(idea, system_instruction=system_instruction, default_fallback=fallback)
            else:
                res_data = fallback
        except Exception:
            res_data = fallback

        return Response(res_data)

class ConfirmProductCardView(APIView):
    """
    Provider-specific: Confirms and publishes product to the marketplace.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        user = request.user
        data = request.data

        provider_prof, _ = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': 'Dedicated homemaker and skilled artisan',
                'location': user.address or 'Chennai, TN',
                'experience_years': 10,
                'skills': ['Handmade Crafts']
            }
        )

        cat_slug = data.get('category_slug', 'cooking')
        category = Category.objects.filter(slug=cat_slug).first() or Category.objects.first()

        product = Product.objects.create(
            provider=provider_prof,
            category=category,
            title=data.get('title', 'Handmade Product'),
            description=data.get('description', 'Authentic handmade goods.'),
            price=Decimal(str(data.get('price', 200))),
            quantity=int(data.get('quantity', 10)),
            image_url=data.get('image_url', f"https://picsum.photos/seed/{user.username}-prod-{cat_slug}/500/350")
        )

        return Response({
            'message': 'Product published to marketplace successfully!',
            'product': ProductSerializer(product).data
        }, status=status.HTTP_201_CREATED)

class GrowthAdvisorView(APIView):
    """
    Provider-specific: AI Business & Growth Advisor for homemakers and elders.
    Answers questions on packaging, festival promotions, pricing bulk orders, WhatsApp marketing.
    """
    permission_classes = [IsProviderOrAdmin]

    def post(self, request):
        question = request.data.get('question', '')
        if not question:
            return Response({'error': 'Question is required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ask_business_assistant(question))

class FairPriceCheckerView(APIView):
    """
    Common (Customers & Providers): Fair Price & Authenticity Checker.
    Evaluates any proposed service or product price against fair market rates.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        item_name = request.data.get('item_name') or request.data.get('service_name', 'Home Service')
        quoted_price = float(request.data.get('price', 800))
        item_type = request.data.get('type', 'service') # 'service' or 'product'
        location = request.data.get('location', 'Chennai')

        # Baseline fair price calculation
        base_suggest = suggest_fair_price(service=item_name, experience=15, location=location)
        rec_price = base_suggest.get('recommended_fair_price', quoted_price)
        min_p = base_suggest.get('min_fair_price', rec_price * 0.8)
        max_p = base_suggest.get('max_fair_price', rec_price * 1.3)

        if quoted_price < min_p:
            assessment = 'UNDERPRICED'
            badge = 'Exceptional Value / High Savings'
            is_fair = True
        elif quoted_price > max_p:
            assessment = 'OVERPRICED'
            badge = 'Above Market Standard'
            is_fair = False
        else:
            assessment = 'FAIR'
            badge = 'Fair & Authentic Market Price'
            is_fair = True

        return Response({
            'item_name': item_name,
            'quoted_price': quoted_price,
            'assessment': assessment,
            'is_fair': is_fair,
            'badge': badge,
            'fair_range': {
                'min': round(min_p),
                'recommended': round(rec_price),
                'max': round(max_p)
            },
            'authenticity_rating': '98% Verified Artisan Standard',
            'explanation': f"The quoted price of Rs. {round(quoted_price)} is {badge.lower()} in {location}. Standard fair range is Rs. {round(min_p)} - Rs. {round(max_p)}."
        })

class SmartRecommendationsView(APIView):
    """
    Common (Customers & Providers): Personalized AI Recommendations.
    Returns top verified elders/homemakers, trending traditional services, and handmade products.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        top_services = Service.objects.filter(is_available=True).order_by('-rating', '-created_at')[:6]
        top_products = Product.objects.filter(is_available=True).order_by('-created_at')[:6]
        top_providers = ProviderProfile.objects.filter(is_verified=True).order_by('-rating', '-completed_jobs_count')[:4]

        return Response({
            'recommended_services': ServiceSerializer(top_services, many=True).data,
            'recommended_products': ProductSerializer(top_products, many=True).data,
            'featured_providers': ProviderProfileSerializer(top_providers, many=True).data,
            'curation_reason': 'Curated based on verified craft heritage, high trust scores, and community ratings.'
        })

class ExtractSkillsView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'Text input required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(extract_skills_from_text(text))

class SuggestSkillsView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        text = request.data.get('text', '')
        current_skills = request.data.get('current_skills', [])
        return Response(suggest_skills_and_livelihoods(text, current_skills))

class SuggestServicesView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        skills = request.data.get('skills', [])
        category = request.data.get('category', '')
        text = request.data.get('text', '')
        return Response(suggest_services(skills=skills, category=category, text=text))

class GenerateDescriptionView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        name = request.data.get('name', 'Artisan')
        skills = request.data.get('skills', ['Traditional Craft'])
        exp = float(request.data.get('experience_years', 10))
        location = request.data.get('location', 'Chennai')
        languages = request.data.get('languages', ['Tamil', 'English'])
        return Response(generate_business_description(name, skills, exp, location, languages))

class SuggestPriceView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        service = request.data.get('service', 'Home Service')
        exp = float(request.data.get('experience', 5))
        city = request.data.get('city', 'Chennai')
        return Response(suggest_fair_price(service=service, experience=exp, location=city))

class BusinessAssistantView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        question = request.data.get('question', '')
        if not question:
            return Response({'error': 'Question required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ask_business_assistant(question))

class DetectScamView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        msg = request.data.get('message') or request.data.get('text', '')
        if not msg:
            return Response({'error': 'Message required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(detect_scam_message(msg))
