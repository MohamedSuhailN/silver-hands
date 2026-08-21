from decimal import Decimal
from django.core.management.base import BaseCommand
from accounts.models import User, CustomerProfile
from marketplace.models import Category, ProviderProfile, Service, Product
from platform_ops.models import Opportunity, Notification, Report
from bookings.models import Booking, Order
from reviews.models import Review

CATEGORIES = [
    ('cooking', 'Cooking & Snacks', 'cook', 'Traditional homemade delicacies, pickles, and feast preparations.'),
    ('tailoring', 'Tailoring & Alteration', 'tailor', 'Custom blouse stitching, Aari embroidery, and alterations.'),
    ('tutoring', 'Home Tutoring & Mentoring', 'tutor', 'Language lessons, mathematics, science, and conceptual coaching.'),
    ('gardening', 'Gardening & Plants', 'garden', 'Terrace gardening setup, plant nursery, and organic composting.'),
    ('childcare', 'Childcare & Companion', 'child', 'Loving, experienced caregiving and companion support.'),
    ('language', 'Language Teaching', 'language', 'Spoken and written Tamil, Hindi, Sanskrit, and English tutoring.'),
    ('music', 'Music & Traditional Arts', 'music', 'Carnatic vocal, harmonium, slokas, and traditional painting.'),
    ('handicrafts', 'Handicrafts & Decor', 'craft', 'Knitting, rangoli decor, pottery, and festival essentials.'),
    ('mentoring', 'Career & Life Mentoring', 'mentor', 'Wisdom from experienced professionals and retirees.'),
    ('consulting', 'Home & Business Advice', 'consult', 'Tax, family legal advice, and artisanal craft guidance.'),
]

class Command(BaseCommand):
    help = 'Seed comprehensive unified demo data for SilverHands Platform'

    def handle(self, *args, **options):
        self.stdout.write('Seeding SilverHands Unified Database...')

        # 1. Categories
        cat_map = {}
        for slug, name, icon, desc in CATEGORIES:
            cat, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={'name': name, 'icon': icon, 'description': desc}
            )
            cat_map[slug] = cat
        self.stdout.write('[OK] 10 Skill Categories seeded.')

        # 2. Admin User
        admin_u, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@silverhands.org',
                'first_name': 'SilverHands',
                'last_name': 'Admin',
                'role': User.Role.ADMIN,
                'phone': '+91 98400 00001',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_u.set_password('admin123')
        admin_u.save()

        # 3. Demo Customer
        cust_u, _ = User.objects.get_or_create(
            username='demo_customer',
            defaults={
                'email': 'customer@silverhands.org',
                'first_name': 'Ravi',
                'last_name': 'Kumar',
                'role': User.Role.CUSTOMER,
                'phone': '+91 98401 99999',
                'address': 'Adyar, Chennai, TN',
                'latitude': 13.0067,
                'longitude': 80.2574,
                'preferred_language': 'en'
            }
        )
        cust_u.set_password('demo1234')
        cust_u.save()
        CustomerProfile.objects.update_or_create(
            user=cust_u,
            defaults={
                'bio': 'Looking for authentic home-cooked South Indian food and language tutoring for my family.',
                'location': 'Adyar, Chennai',
                'latitude': 13.0067,
                'longitude': 80.2574,
                'languages': ['Tamil', 'English']
            }
        )

        # 4. Providers & Passports
        providers_data = [
            {
                'username': 'lakshmi',
                'first_name': 'Lakshmi',
                'last_name': 'Venkatesan',
                'phone': '+91 98401 12345',
                'bio': 'Retired school teacher with 27 years of authentic Chettinad and traditional South Indian culinary mastery.',
                'skills': ['Traditional Cooking', 'Chettinad Cuisine', 'Pickle Making', 'Festival Sweets'],
                'experience_years': 27,
                'languages': ['Tamil', 'English'],
                'location': 'Adyar, Chennai',
                'latitude': 13.0067,
                'longitude': 80.2574,
                'rating': Decimal('4.9'),
                'review_count': 42,
                'trust_score': 98,
                'skill_passport_id': 'SP-LAK-001',
                'skill_passport': {
                    'title': 'Grandmaster of Traditional South Indian Cuisine',
                    'highlights': ['27+ Years Family Recipes', '100% Hygienic Home Kitchen', 'Chemical-Free Pickles'],
                    'badges': ['Phone Verified', 'Identity Verified', 'Location Verified', 'Top Rated Elder']
                },
                'services': [
                    ('Traditional Tamil Cooking Classes', 'cooking', 800, '2 hours', ['Tamil', 'English']),
                    ('Chettinad Feast Preparation & Catering', 'cooking', 1500, '4 hours', ['Tamil']),
                ],
                'products': [
                    ('Homemade Mango Thokku Pickle (500g)', 'cooking', 250, 25),
                    ('Traditional Coconut Murukku (250g)', 'cooking', 180, 20),
                ]
            },
            {
                'username': 'meena',
                'first_name': 'Meena',
                'last_name': 'Rajaram',
                'phone': '+91 98402 54321',
                'bio': 'Master seamstress with 20 years of bespoke saree blouse stitching, Aari embroidery, and precision alterations.',
                'skills': ['Custom Tailoring', 'Saree Blouse Fitting', 'Aari Hand Embroidery', 'Dress Alterations'],
                'experience_years': 20,
                'languages': ['Tamil', 'Hindi', 'English'],
                'location': 'T. Nagar, Chennai',
                'latitude': 13.0418,
                'longitude': 80.2341,
                'rating': Decimal('4.8'),
                'review_count': 35,
                'trust_score': 95,
                'skill_passport_id': 'SP-MEE-002',
                'skill_passport': {
                    'title': 'Master Artisan Tailor & Embroiderer',
                    'highlights': ['20+ Years Fitting Precision', 'Authentic Hand Embroidery', 'Guaranteed On-time Delivery'],
                    'badges': ['Phone Verified', 'Identity Verified', 'Quality Guaranteed']
                },
                'services': [
                    ('Custom Saree Blouse Stitching & Alterations', 'tailoring', 600, '3 days', ['Tamil', 'Hindi']),
                    ('Intricate Aari Work Bridal Embroidery', 'tailoring', 1800, '5 days', ['Tamil']),
                ],
                'products': [
                    ('Handmade Eco Cotton Shopping Bags (Set of 3)', 'handicrafts', 350, 15),
                ]
            },
            {
                'username': 'saraswathi',
                'first_name': 'Saraswathi',
                'last_name': 'Krishnan',
                'phone': '+91 98403 67890',
                'bio': 'Retired High School Headmistress with 35 years of teaching experience. Passionate about patient language mentoring.',
                'skills': ['Tamil Language Teaching', 'English Grammar', 'School Mentorship', 'Sloka Chanting'],
                'experience_years': 35,
                'languages': ['Tamil', 'English'],
                'location': 'Mylapore, Chennai',
                'latitude': 13.0368,
                'longitude': 80.2676,
                'rating': Decimal('5.0'),
                'review_count': 58,
                'trust_score': 99,
                'skill_passport_id': 'SP-SAR-003',
                'skill_passport': {
                    'title': 'Senior Educator & Language Mentor',
                    'highlights': ['35+ Years Teaching Career', 'Patient Conceptual Guidance', 'State Awardee Educator'],
                    'badges': ['Phone Verified', 'Identity Verified', 'Educational Mentor']
                },
                'services': [
                    ('Spoken & Written Tamil Coaching', 'language', 500, '1 hour', ['Tamil', 'English']),
                    ('Middle School Math & Science Tutoring', 'tutoring', 450, '1 hour', ['Tamil', 'English']),
                ],
                'products': []
            },
            {
                'username': 'kamala',
                'first_name': 'Kamala',
                'last_name': 'Subramanian',
                'phone': '+91 98404 11223',
                'bio': 'Passionate terrace gardener for 15 years. Specializes in organic pest control, compost setup, and rare native herbs.',
                'skills': ['Terrace Gardening', 'Organic Composting', 'Native Herb Cultivation', 'Bonsai & Floral Care'],
                'experience_years': 15,
                'languages': ['Tamil', 'English'],
                'location': 'Velachery, Chennai',
                'latitude': 12.9815,
                'longitude': 80.2180,
                'rating': Decimal('4.7'),
                'review_count': 22,
                'trust_score': 92,
                'skill_passport_id': 'SP-KAM-004',
                'skill_passport': {
                    'title': 'Certified Urban Organic Gardening Specialist',
                    'highlights': ['15+ Years Native Gardening', 'Zero-Chemical Methods', 'Medicinal Herb Expert'],
                    'badges': ['Phone Verified', 'Location Verified']
                },
                'services': [
                    ('Balcony & Terrace Garden Setup Consultation', 'gardening', 700, '2 hours', ['Tamil', 'English']),
                    ('Organic Vegetable Garden Maintenance', 'gardening', 500, '1.5 hours', ['Tamil']),
                ],
                'products': [
                    ('Pure Organic Vermicompost Bag (5kg)', 'gardening', 200, 30),
                    ('Potted Tulsi & Karpooravalli Herbal Duo', 'gardening', 150, 15),
                ]
            }
        ]

        for pdata in providers_data:
            user, _ = User.objects.get_or_create(
                username=pdata['username'],
                defaults={
                    'email': f"{pdata['username']}@silverhands.org",
                    'first_name': pdata['first_name'],
                    'last_name': pdata['last_name'],
                    'role': User.Role.PROVIDER,
                    'phone': pdata['phone'],
                    'address': pdata['location'],
                    'latitude': pdata['latitude'],
                    'longitude': pdata['longitude'],
                    'is_senior': True
                }
            )
            user.set_password('demo1234')
            user.save()

            prof, _ = ProviderProfile.objects.update_or_create(
                user=user,
                defaults={
                    'bio': pdata['bio'],
                    'skills': pdata['skills'],
                    'experience_years': pdata['experience_years'],
                    'languages': pdata['languages'],
                    'location': pdata['location'],
                    'latitude': pdata['latitude'],
                    'longitude': pdata['longitude'],
                    'rating': pdata['rating'],
                    'review_count': pdata['review_count'],
                    'trust_score': pdata['trust_score'],
                    'skill_passport_id': pdata['skill_passport_id'],
                    'skill_passport': pdata['skill_passport'],
                    'availability': {'weekdays': True, 'weekends': True, 'mornings': True}
                }
            )

            for title, cat_slug, price, dur, langs in pdata['services']:
                Service.objects.update_or_create(
                    provider=prof,
                    title=title,
                    defaults={
                        'category': cat_map[cat_slug],
                        'description': f"{title} provided with authentic care and verified experience by {prof.display_name}.",
                        'price': Decimal(str(price)),
                        'duration': dur,
                        'languages': langs,
                        'rating': pdata['rating'],
                        'image_url': f"https://picsum.photos/seed/{pdata['username']}-{cat_slug}/400/300"
                    }
                )

            for title, cat_slug, price, qty in pdata['products']:
                Product.objects.update_or_create(
                    provider=prof,
                    title=title,
                    defaults={
                        'category': cat_map[cat_slug],
                        'description': f"Handcrafted, high quality {title} made fresh by {prof.display_name}.",
                        'price': Decimal(str(price)),
                        'quantity': qty,
                        'image_url': f"https://picsum.photos/seed/{pdata['username']}-prod/400/300"
                    }
                )

        self.stdout.write('[OK] 4 Verified Elder Providers, Services & Products seeded.')

        # 5. Opportunity Radar Gigs
        opps = [
            {
                'title': 'Need Traditional Chettinad Meal for 10 Guests',
                'category': 'Cooking & Snacks',
                'description': 'Hosting family lunch this Sunday in Adyar. Need authentic vegetarian Chettinad feast.',
                'budget': Decimal('2500.00'),
                'customer_name': 'Kavitha R.',
                'location_name': 'Adyar, Chennai (1.2 km)',
                'latitude': 13.0080,
                'longitude': 80.2590,
            },
            {
                'title': 'Silk Saree Blouse Urgent Stitching with Aari Handwork',
                'category': 'Tailoring & Alteration',
                'description': 'Need precision blouse fitting and border embroidery for daughter wedding next Friday.',
                'budget': Decimal('1800.00'),
                'customer_name': 'Ananthi S.',
                'location_name': 'T. Nagar, Chennai (2.1 km)',
                'latitude': 13.0450,
                'longitude': 80.2360,
            },
            {
                'title': 'Weekly Tamil Reading & Spoken Practice for Class 5 Student',
                'category': 'Home Tutoring & Mentoring',
                'description': 'Looking for a kind, patient retired teacher to guide child in Tamil grammar 2 days a week.',
                'budget': Decimal('1200.00'),
                'customer_name': 'Ganesh M.',
                'location_name': 'Mylapore, Chennai (1.5 km)',
                'latitude': 13.0380,
                'longitude': 80.2690,
            },
            {
                'title': 'Terrace Kitchen Garden Composting & Soil Setup',
                'category': 'Gardening & Plants',
                'description': 'Setting up 12 vegetable grow bags on terrace. Need advice on potting mix and compost.',
                'budget': Decimal('900.00'),
                'customer_name': 'Suresh Babu',
                'location_name': 'Velachery, Chennai (2.8 km)',
                'latitude': 12.9850,
                'longitude': 80.2210,
            }
        ]

        for opp_data in opps:
            Opportunity.objects.update_or_create(
                title=opp_data['title'],
                defaults=opp_data
            )
        self.stdout.write('[OK] 4 Opportunity Radar gig postings seeded.')

        # 6. Notifications & Safety Reports
        Notification.objects.get_or_create(
            user=cust_u,
            title="Welcome to SilverHands!",
            message="Discover verified elder artisans in your neighborhood or post your request.",
            type="opportunity"
        )

        Report.objects.get_or_create(
            reporter=cust_u,
            category='SUSPICIOUS_USER',
            description='Demo report: User asking for advance cash via Telegram link.',
            status='PENDING'
        )

        self.stdout.write(self.style.SUCCESS('[SUCCESS] All SilverHands Unified demo data seeded successfully!'))
        self.stdout.write('Credentials:')
        self.stdout.write('  - Admin:    admin / admin123')
        self.stdout.write('  - Customer: demo_customer / demo1234')
        self.stdout.write('  - Provider: lakshmi / demo1234')
        self.stdout.write('  - Provider: meena / demo1234')
