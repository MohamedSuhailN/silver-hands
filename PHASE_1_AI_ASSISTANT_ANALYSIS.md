# SilverHands Phase 1 — AI Assistant Foundation
## Pre-Implementation Audit & Design

**Date**: September 1, 2026  
**Scope**: Central AI Assistant for both Providers and Customers  
**Status**: Analysis Complete → Ready for Implementation

---

## 1. EXISTING ARCHITECTURE DISCOVERED

### 1.1 AI Infrastructure
✅ **AIClient** (Singleton Pattern)
- Location: `backend/ai_engine/services/ai_client.py`
- Supports: Gemini, OpenAI
- Features: JSON generation, timeout handling, retry logic
- API Key: Reads from `.env` (AI_PROVIDER, AI_API_KEY, AI_MODEL)
- Status: **HEALTHY** — No changes needed

✅ **Existing AI Services** (8 microservices)
- `skill_extraction.py` — Extract skills from text
- `matching.py` — Match providers to requirements
- `pricing.py` — Suggest fair prices
- `description.py` — Generate service descriptions
- `scam_detection.py` — Detect unsafe messages
- `business_assistant.py` — Business advice
- `service_suggestion.py` — Suggest services
- `skill_suggestion.py` — Suggest skills/livelihoods

### 1.2 API Layer
✅ **Existing AI Views**
- `AIHealthCheckView` — GET /api/ai/health/
- `AIMatchView` — POST /api/ai/match/
- `AIProfileWizardView` — POST /api/ai/wizard/
- `BusinessAssistantView` — POST /api/ai/business-assistant/
- `FairPriceCheckerView`, `SmartRecommendationsView`, etc.

✅ **Existing Core APIs**
- Auth: `/api/auth/register/`, `/api/auth/login/`, `/api/auth/profile/`
- Marketplace: `/api/services/`, `/api/products/`, `/api/providers/`
- Bookings: `/api/bookings/`, `/api/orders/`
- Platform: `/api/opportunities/`

### 1.3 Models (NO CHANGES NEEDED)
✅ **User Model** (`backend/accounts/models.py`)
- Fields: username, email, role (CUSTOMER/PROVIDER/ADMIN), phone, address, latitude, longitude, preferred_language, is_senior
- Relations: OneToOne with ProviderProfile/CustomerProfile

✅ **ProviderProfile Model** (`backend/marketplace/models.py`)
- Fields: bio, skills (JSON), experience_years, languages, location, availability, rating, trust_score
- Relations: OneToOne with User, OneToMany with Service/Product

✅ **Service Model** (`backend/marketplace/models.py`)
- Fields: title, description, price, pricing_unit, duration, languages, is_available, rating

✅ **CustomerProfile Model** (`backend/accounts/models.py`)
- Fields: location, latitude, longitude, languages, preferences

### 1.4 Frontend Architecture
✅ **Routing** (`frontend/src/App.jsx`)
- `/login`, `/register`, `/register-voice`
- `/services`, `/services/:id`
- `/products`, `/products/:id`
- `/providers`, `/providers/:id`
- `/radar`, `/bookings`, `/orders`, `/messages`
- `/ai-match`, `/ai-assistant`, `/ai-wizard`
- `/provider/dashboard`, `/skill-passport`
- Admin portal

✅ **Existing Voice** (`frontend/src/components/voice/`)
- `VoiceInputModal.jsx` — Voice search (fixed in Phase 0)
- `VoiceListeningModal.jsx` — Persistent voice listener (fixed in Phase 0)
- Language support: en-IN, ta-IN, hi-IN
- Browser SpeechRecognition API

✅ **Existing Context**
- `AuthContext` — Login, register, user state
- `LanguageContext` — Language selection (en, ta, hi)
- `SeniorModeContext` — Accessible UI mode
- `NotificationContext` — Toast messages

✅ **Existing Pages**
- `AIAssistantPage.jsx` — Business advisor chat (basic, can be enhanced)
- `AIMatchPage.jsx` — Semantic search
- `AIProfileWizard.jsx` — Provider onboarding

### 1.5 Navbar Integration
✅ **Navbar** (`frontend/src/components/common/Navbar.jsx`)
- Props: `onOpenVoice` callback
- Voice button visible and functional
- Authenticated state known
- Role available (isCustomer, isProvider, isAdmin)

---

## 2. EXISTING AI IMPLEMENTATION

### 2.1 Current State
- **AIAssistantPage**: Business advisor (one-way chat style)
- **AIMatchPage**: Semantic search with AI
- **AIProfileWizardView**: Provider profile extraction
- **No unified intent detection**: Each feature is standalone
- **No persistent chat**: Messages don't flow between pages
- **No action-based routing**: No feedback loop to backend APIs

### 2.2 What's Missing
- ❌ Intent detection system (CREATE_PROFILE, UPDATE_PROFILE, etc.)
- ❌ Unified assistant endpoint
- ❌ Confirmation prompts for data persistence
- ❌ Step-by-step guidance system
- ❌ Persistent modal access from all pages
- ❌ Text-to-Speech integration
- ❌ Context-aware responses based on user profile
- ❌ Validation of extracted data before saving

---

## 3. EXISTING APIS THAT CAN BE REUSED

### Authentication & User Management
| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/auth/login/` | POST | Login user | Login flow |
| `/api/auth/register/` | POST | Register user | Registration |
| `/api/auth/profile/` | GET/PATCH | Get/update profile | Profile page |
| `/api/auth/admin/users/` | GET/POST | Admin user management | Admin portal |

### Provider Management
| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/providers/me/` | GET/PATCH | Provider profile (self) | Provider dashboard |
| `/api/providers/` | GET | List providers | Marketplace |
| `/api/providers/{id}/` | GET | Provider detail | Provider detail page |

### Service Management
| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/services/` | GET/POST | Service CRUD | Services page |
| `/api/services/{id}/` | GET/PATCH/DELETE | Service detail | Service detail |
| `/api/categories/` | GET | Categories | Marketplace filters |

### Bookings & Orders
| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/bookings/` | GET/POST | Booking management | Bookings page |
| `/api/bookings/{id}/update-status/` | PATCH | Update booking status | Booking flow |
| `/api/orders/` | GET/POST | Order management | Orders page |

### AI Features
| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/ai/match/` | POST | Semantic search | AIMatchPage |
| `/api/ai/wizard/` | POST | Profile extraction | AIProfileWizard |
| `/api/ai/business-assistant/` | POST | Business advice | AIAssistantPage |
| `/api/ai/extract-skills/` | POST | Skill extraction | Service creation |
| `/api/ai/suggest-price/` | POST | Price suggestion | Service creation |
| `/api/ai/detect-scam/` | POST | Scam detection | Booking/messaging |

### Platform Features
| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/api/opportunities/` | GET/POST | Opportunities | Radar page |
| `/api/opportunities/{id}/respond/` | POST | Provider response | Radar |
| `/api/reviews/` | GET/POST | Reviews | Booking flow |

---

## 4. FILES THAT NEED MODIFICATION

### Backend Files (Minor Changes)

1. **`backend/ai_engine/services/assistant.py`** (NEW)
   - Intent detection logic
   - Context extraction
   - Confirmation workflows
   - Error handling

2. **`backend/ai_engine/views.py`**
   - Add new `AIAssistantView` endpoint
   - POST `/api/ai/assistant/` for unified chat

3. **`backend/ai_engine/urls.py`**
   - Register new endpoint

4. **No database model changes needed** ✅
   - Use existing User, ProviderProfile, Service, etc.

### Frontend Files (New + Modifications)

1. **`frontend/src/pages/AI/AIAssistantPage.jsx`** (MODIFIED)
   - Enhance to persistent modal
   - Add intent detection UI
   - Add confirmation prompts
   - Prettier chat interface

2. **`frontend/src/components/voice/AssistantModal.jsx`** (NEW)
   - Persistent modal component
   - Works globally from any page
   - Voice input integration
   - Text-to-Speech (optional)

3. **`frontend/src/api/client.js`** (MODIFIED)
   - Add `aiAssistant()` function
   - Call `/api/ai/assistant/`

4. **`frontend/src/context/AuthContext.jsx`** (MODIFIED)
   - Pass assistant modal state
   - Or create new AssistantContext

5. **`frontend/src/components/common/Navbar.jsx`** (MODIFIED)
   - Update onOpenVoice to open AssistantModal
   - Already has the callback ready

---

## 5. CORE INTENTS SYSTEM

### Intent Detection (Automatic)
The assistant will detect these intents from user input:

| Intent | Examples | Actions |
|--------|----------|---------|
| `CREATE_PROFILE` | "Register me", "I'm a new provider" | Collect details, confirm, call `/api/auth/register/` |
| `UPDATE_PROFILE` | "Update my location", "Change my skills" | Extract info, confirm, call `/api/auth/profile/` PATCH |
| `CREATE_SERVICE` | "List a cooking service", "Add handmade product" | Collect details, AI suggestion, confirm, call `/api/services/` POST |
| `UPDATE_SERVICE` | "Change my service price", "Edit description" | Collect details, confirm, call `/api/services/{id}/` PATCH |
| `SEARCH_SERVICE` | "Find a tailor", "I need Tamil tutoring" | Parse requirement, call `/api/ai/match/` |
| `FIND_PROVIDER` | "Show me providers near Adyar", "Vegetarian cooks" | Geo-filter, call `/api/providers/` GET |
| `VIEW_BOOKINGS` | "Show my bookings", "What's pending?" | Call `/api/bookings/` GET |
| `VIEW_EARNINGS` | "How much have I earned?", "Monthly revenue" | Call `/api/providers/me/` GET, aggregate reviews |
| `VIEW_PROFILE` | "Show my profile", "My details" | Call `/api/auth/profile/` GET |
| `UPDATE_AVAILABILITY` | "I'm free Monday", "Mark unavailable" | Update ProviderProfile.availability |
| `NAVIGATE` | "Go to services", "Show dashboard" | Navigate to route in frontend |
| `ASK_HELP` | "How does this work?", "Tell me about SilverHands" | Return help text, links |
| `GENERAL_QUERY` | "What's the weather?", "Random question" | Call `/api/ai/business-assistant/` |

---

## 6. EXAMPLE CONVERSATION FLOWS

### PROVIDER: Voice Registration

```
User (voice): "I am Lakshmi, 65 years old. I live in Adyar Chennai. 
I have 25 years of experience in traditional cooking and tutoring."

AI (extracted):
name = "Lakshmi"
age = 65
location = "Adyar, Chennai"
skills = ["Traditional Cooking", "Tutoring"]
experience = 25

AI (to user):
"I've understood your profile:
- Name: Lakshmi
- Age: 65
- Location: Adyar, Chennai
- Skills: Traditional Cooking, Tutoring
- Experience: 25 years

Is this correct? Say YES to proceed or NO to retry."

User (voice): "Yes"

AI:
"Great! Now, do you have an email address? 
(This is required for registration)"

User (voice): "lakshmi@gmail.com"

AI:
"Perfect. Creating your profile now..."
[Calls /api/auth/register/ with extracted data]

AI:
"Welcome to SilverHands, Lakshmi! Your profile is live. 
Would you like to create your first service, or need help with anything else?"
```

### CUSTOMER: Voice Service Search

```
User (voice): "I need someone to teach Tamil near Adyar."

AI (extracted):
service = "Tamil Tutoring"
location = "Adyar"
intent = "SEARCH_SERVICE"

AI:
"I'm looking for Tamil tutors near Adyar..."
[Calls /api/ai/match/ with extracted data]

AI:
"I found 3 tutors:
1. Meena - 4.8 ⭐ (₹500/hour)
2. Saraswathi - 4.9 ⭐ (₹600/hour)
3. Lakshmi - 5.0 ⭐ (₹550/hour)

Would you like details on any of them? Say 'Show Meena' or 'Book Lakshmi'."

User (voice): "Book Lakshmi"

AI:
"Perfect! Let me help you book Lakshmi's service. 
When would you like to start? (e.g., tomorrow, next Monday)"

User: "Next Monday at 4 PM"

AI:
"Got it! Booking Tamil tutoring from Lakshmi:
- Date: Next Monday
- Time: 4 PM
- Price: ₹550

Shall I confirm this? Say YES to proceed."

User: "Yes"

AI:
[Calls /api/bookings/ POST]
"Your booking is confirmed! Lakshmi will contact you soon. 
Check your bookings page for details."
```

---

## 7. ERROR HANDLING & FALLBACKS

### Voice Recognition Fails
→ Show text input field with same intent detection

### Backend API Fails
→ "I'm having trouble connecting to our system. Please try again in a moment. 
   [Show retry button]"

### Missing Information
→ "I need a bit more info. What's your experience level 
   in [skill name]?"

### Ambiguous Request
→ "I'm not quite sure what you mean. Are you:
   1. Looking for a service provider?
   2. Creating a new service?
   3. Something else?"

### Confirmation Not Given
→ "No problem! What would you like to do instead?"

---

## 8. SECURITY & AUTHORIZATION

✅ **Respect Authentication**
- Only show relevant intents based on role (CUSTOMER vs PROVIDER)
- Don't allow providers to book their own services
- Don't allow customers to view earnings

✅ **Never Fabricate Data**
- Always fetch from `/api/providers/me/` for user's own profile
- Never create fake reviews/ratings
- Always confirm before saving data

✅ **Data Privacy**
- Only show user's own data
- Don't access other users' private information
- Respect booking/message privacy

✅ **No API Key Exposure**
- Keep AI_API_KEY server-side only
- Don't log sensitive data
- Return safe error messages to client

---

## 9. TRANSACTION BOUNDARY

✅ **DO NOT TOUCH**
- Payment processing (`backend/payment/`)
- Order transaction logic
- Invoice generation
- Refund handling

✅ **SAFE TO USE**
- Order status reading
- Order list retrieval
- Order detail display
- Booking status updates (non-payment)

---

## 10. DATABASE CHANGES

### ❌ NO SCHEMA CHANGES NEEDED
All existing models support the use cases:
- User can store profile data
- ProviderProfile stores skills, experience, availability
- Service stores all service details
- Booking stores all booking details
- No new tables needed

---

## 11. IMPLEMENTATION PLAN

### Phase 1A: Backend (Day 1)
1. Create `backend/ai_engine/services/assistant.py`
   - Intent detection logic
   - Context extraction
   - Action routing
   
2. Update `backend/ai_engine/views.py`
   - Add `AIAssistantView` class
   - POST endpoint at `/api/ai/assistant/`
   - Request: `{user_input: string, session_id?: string, context?: object}`
   - Response: `{intent: string, action: string, message: string, data?: object, confirmation_needed?: boolean}`

3. Update `backend/ai_engine/urls.py`
   - Register new endpoint

4. Test with cURL/Postman

### Phase 1B: Frontend (Day 1)
1. Create `frontend/src/components/voice/AssistantModal.jsx`
   - Persistent modal with voice input
   - Text input fallback
   - Chat history display
   - Confirmation buttons

2. Update `frontend/src/api/client.js`
   - Add `aiAssistant(userInput, context)` function

3. Update `frontend/src/components/common/Navbar.jsx`
   - Connect onOpenVoice to AssistantModal

4. Update `frontend/src/App.jsx`
   - Add AssistantModal as global component

5. Test voice input, intent detection, confirm buttons

### Phase 1C: Integration Testing (Day 2)
1. Test all intents end-to-end
2. Test voice → text flow
3. Test confirmation prompts
4. Test error handling
5. Test fallbacks

---

## 12. POTENTIAL CONFLICTS

✅ **No Conflicts Identified**
- All changes are additive
- No existing code is replaced
- Existing APIs continue to work
- Existing pages remain unchanged

---

## 13. KNOWN LIMITATIONS (Phase 1)

⚠️ **Out of Scope**
- Text-to-Speech (can be added in Phase 2)
- Multi-turn conversation memory (use session_id)
- Provider earnings calculations (requires review aggregation)
- Advanced availability scheduling (basic JSON support exists)
- Payment integration
- SMS notifications

✅ **In Scope**
- Voice/text input
- Intent detection
- Step-by-step guidance
- Data extraction
- Confirmation prompts
- API routing
- Error handling

---

## NEXT STEP: IMPLEMENTATION

All analysis complete. Ready to begin coding the Assistant Service and API integration.

**Critical Success Criteria**:
1. Provider can register completely via voice
2. Customer can search and book via voice
3. All intents are actionable (not just chat)
4. Confirmations prevent accidental data changes
5. Fallback to text input works smoothly
6. No existing functionality broken
7. All existing tests still pass

---

**Analysis Completed By**: AI Assistant  
**Status**: ✅ Ready for Implementation  
**Estimated Time**: 4-6 hours development + 2 hours testing
