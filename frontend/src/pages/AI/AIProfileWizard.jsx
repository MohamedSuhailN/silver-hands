import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mic, Sparkles, ShoppingCart, Calendar, CheckCircle2, Wand2, Edit3, ArrowRight, 
  ShieldCheck, Star, DollarSign, TrendingUp, Compass, Layers, 
  Check, Package, HelpCircle, Send, Scale, ThumbsUp, Lock, RefreshCw 
} from 'lucide-react';
import { 
  aiProfileWizard, aiConfirmService, aiGenerateProduct, 
  aiConfirmProduct, aiGrowthAdvisor, aiExtractSkills, 
  aiCheckFairPrice, aiGetRecommendations, getBookings, getOrders 
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { SkillPassportBadge } from '../../components/trust/SkillPassportBadge';
import { VoiceListeningModal } from '../../components/voice/VoiceListeningModal';

export const AIProfileWizard = () => {
  const { user, isAuthenticated, isProvider, isAdmin, isCustomer } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(isCustomer ? 'fair_price' : 'service_card');

  // --- Voice Modal State ---
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceModalTarget, setVoiceModalTarget] = useState(null);
  const [voiceModalTitle, setVoiceModalTitle] = useState('Listening to Your Voice...');

  const [inputStory, setInputStory] = useState('');
  const [generatingService, setGeneratingService] = useState(false);
  const [publishingService, setPublishingService] = useState(false);
  const [aiServiceResult, setAiServiceResult] = useState(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [serviceData, setServiceData] = useState(null);

  const [productIdea, setProductIdea] = useState('');
  const [generatingProduct, setGeneratingProduct] = useState(false);
  const [publishingProduct, setPublishingProduct] = useState(false);
  const [productData, setProductData] = useState(null);

  const [advisorQuestion, setAdvisorQuestion] = useState('');
  const [askingAdvisor, setAskingAdvisor] = useState(false);
  const [advisorHistory, setAdvisorHistory] = useState([
    {
      sender: 'ai',
      text: 'Namaste! I am your Growth & Business Advisor. Ask me anything about pricing festive orders, recipe preservation, WhatsApp marketing, or packaging tips for your handmade goods.'
    }
  ]);

  const [skillInputText, setSkillInputText] = useState('');
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [extractedSkillResult, setExtractedSkillResult] = useState(null);

  const [fairCheckItem, setFairCheckItem] = useState('');
  const [fairCheckPrice, setFairCheckPrice] = useState('');
  const [fairCheckLocation, setFairCheckLocation] = useState(user?.address || 'Chennai');
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [fairPriceResult, setFairPriceResult] = useState(null);
  const [myHistoryBookings, setMyHistoryBookings] = useState([]);
  const [myHistoryOrders, setMyHistoryOrders] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      getBookings({ view: 'my_requests' }).then((res) => setMyHistoryBookings(res.data || [])).catch(() => {});
      getOrders({ view: 'my_purchases' }).then((res) => setMyHistoryOrders(res.data || [])).catch(() => {});
    }
  }, [isAuthenticated]);

  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (activeTab === 'recommendations' && !recommendations) {
      setLoadingRecs(true);
      aiGetRecommendations().then((res) => {
        setRecommendations(res.data);
      }).catch(() => {}).finally(() => setLoadingRecs(false));
    }
  }, [activeTab]);

  const openVoicePopup = (target, title) => {
    setVoiceModalTarget(target);
    setVoiceModalTitle(title);
    setIsVoiceModalOpen(true);
  };

  const handleVoiceDataReceived = (spokenText) => {
    if (!spokenText) return;
    if (voiceModalTarget === 'service') {
      setInputStory((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    } else if (voiceModalTarget === 'product') {
      setProductIdea((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    } else if (voiceModalTarget === 'advisor') {
      setAdvisorQuestion(spokenText);
    } else if (voiceModalTarget === 'skill') {
      setSkillInputText((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
    } else if (voiceModalTarget === 'fair_item') {
      setFairCheckItem(spokenText);
    }
  };

  const handleGenerateService = async () => {
    if (!inputStory.trim()) {
      showToast('Please type or speak your craft story first', 'error');
      return;
    }
    setGeneratingService(true);
    try {
      const res = await aiProfileWizard(inputStory);
      setAiServiceResult(res.data);
      const services = res.data.suggested_services || [];
      const initialService = services[0] || {
        title: 'Authentic Traditional Home Service',
        category_slug: res.data.category_slug || 'cooking',
        price: 800,
        pricing_unit: 'per session',
        duration: '2 hours',
        description: res.data.bio || 'High quality traditional service.',
        languages: ['Tamil', 'English']
      };
      setSelectedServiceIndex(0);
      setServiceData(initialService);
      showToast('Service packages formulated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Generation failed. Please try again.', 'error');
    } finally {
      setGeneratingService(false);
    }
  };

  const handleConfirmPublishService = async () => {
    if (!serviceData) return;
    setPublishingService(true);
    try {
      const payload = {
        title: serviceData.title,
        category_slug: serviceData.category_slug,
        price: serviceData.price,
        pricing_unit: serviceData.pricing_unit,
        duration: serviceData.duration,
        description: serviceData.description,
        languages: serviceData.languages || ['Tamil', 'English'],
        bio: aiServiceResult?.bio,
        skills: aiServiceResult?.skills,
        skill_passport: aiServiceResult?.skill_passport,
        experience_years: aiServiceResult?.experience_years || 15
      };
      const res = await aiConfirmService(payload);
      showToast('Service Card published to live marketplace!', 'success');
      navigate(`/services/${res.data.service.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to publish service', 'error');
    } finally {
      setPublishingService(false);
    }
  };

  const handleGenerateProduct = async () => {
    if (!productIdea.trim()) {
      showToast('Please describe your product idea first', 'error');
      return;
    }
    setGeneratingProduct(true);
    try {
      const res = await aiGenerateProduct(productIdea);
      setProductData(res.data);
      showToast('Product card drafted by AI!', 'success');
    } catch {
      showToast('Failed to generate product card', 'error');
    } finally {
      setGeneratingProduct(false);
    }
  };

  const handleConfirmPublishProduct = async () => {
    if (!productData) return;
    setPublishingProduct(true);
    try {
      const res = await aiConfirmProduct(productData);
      showToast('Product published to marketplace store!', 'success');
      navigate(`/products/${res.data.product.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to publish product', 'error');
    } finally {
      setPublishingProduct(false);
    }
  };

  const handleAskAdvisor = async (e) => {
    e.preventDefault();
    if (!advisorQuestion.trim()) return;
    const q = advisorQuestion;
    setAdvisorQuestion('');
    setAdvisorHistory((prev) => [...prev, { sender: 'user', text: q }]);
    setAskingAdvisor(true);
    try {
      const res = await aiGrowthAdvisor(q);
      setAdvisorHistory((prev) => [...prev, { sender: 'ai', text: res.data.response || res.data.answer || 'Here is my advice on growing your home craft business.' }]);
    } catch {
      setAdvisorHistory((prev) => [...prev, { sender: 'ai', text: 'Consider standardizing your recipes, packing with airtight glass jars, and taking advance bookings 3 days prior for festival orders.' }]);
    } finally {
      setAskingAdvisor(false);
    }
  };

  const handleExtractSkills = async () => {
    if (!skillInputText.trim()) return;
    setExtractingSkills(true);
    try {
      const res = await aiExtractSkills(skillInputText);
      setExtractedSkillResult(res.data);
      showToast('Skills extracted and verified!', 'success');
    } catch {
      showToast('Skill extraction failed', 'error');
    } finally {
      setExtractingSkills(false);
    }
  };

  const handleCheckFairPrice = async (e) => {
    e.preventDefault();
    if (!fairCheckItem || !fairCheckPrice) return;
    setCheckingPrice(true);
    try {
      const res = await aiCheckFairPrice({
        item_name: fairCheckItem,
        price: parseFloat(fairCheckPrice),
        location: fairCheckLocation
      });
      setFairPriceResult(res.data);
      showToast('Fair price evaluation complete!', 'success');
    } catch {
      showToast('Fair price check failed', 'error');
    } finally {
      setCheckingPrice(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <span className="badge-tag bg-saffron text-white font-bold">
          <Sparkles className="w-3.5 h-3.5" /> AI Artisan & Marketplace Wizard
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-warmgray-900">
          Smart AI Toolkit for Artisans, Homemakers & Customers
        </h1>
        <p className="text-sm text-warmgray-600 max-w-2xl mx-auto">
          Generate live service & product cards, consult the Growth Advisor, extract verified skills, and verify fair market pricing.
        </p>
      </div>

      {isCustomer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>You are logged in as a <strong>Customer</strong>. You can use the <strong>Fair Price Checker</strong> and <strong>Smart Recommendations</strong> below. Service/Product card creation is reserved for verified Providers.</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-warmgray-200 pb-2 overflow-x-auto">
        {!isCustomer && (
          <>
            <button
              onClick={() => setActiveTab('service_card')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'service_card' ? 'bg-saffron text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Generate Service Card
            </button>

            <button
              onClick={() => setActiveTab('product_card')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'product_card' ? 'bg-sage text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Generate Product Card
            </button>

            <button
              onClick={() => setActiveTab('growth_advisor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'growth_advisor' ? 'bg-purple-700 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Growth Advisor
            </button>

            <button
              onClick={() => setActiveTab('skill_extractor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'skill_extractor' ? 'bg-blue-600 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Skill Extractor
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('fair_price')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'fair_price' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Fair Price Checker (Common)
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'recommendations' ? 'bg-warmgray-900 text-white shadow-warm' : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Smart Recommendations
        </button>
      </div>

      {/* 1. SERVICE CARD TAB */}
      {activeTab === 'service_card' && !isCustomer && (
        <div className="space-y-6">
          <div className="card-surface p-6 sm:p-8 space-y-4 border border-saffron/30">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">
              Describe Your Traditional Craft or Experience
            </h3>
            <div className="flex justify-between items-center pb-1">
              <span className="text-xs font-bold text-warmgray-600">Your craft story or background:</span>
              <button
                type="button"
                onClick={() => openVoicePopup('service', 'Speak Your Craft Experience & Background')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-saffron-50 text-saffron-700 border border-saffron-200 hover:bg-saffron-100 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-saffron" />
                <span>Voice Input</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={inputStory}
              onChange={(e) => setInputStory(e.target.value)}
              placeholder="e.g. My name is Kamala. I have 25 years of experience cooking authentic Chettinad feasts, vegetarian lunches, and homemade spice powders in Chennai..."
              className="w-full p-4 rounded-2xl border border-warmgray-300 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />

            <button
              onClick={handleGenerateService}
              disabled={generatingService}
              className="w-full btn-primary text-sm font-bold !py-3 flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              <span>{generatingService ? 'Formulating Service Card Packages...' : 'Generate Service Card & Bio'}</span>
            </button>
          </div>

          {aiServiceResult && serviceData && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(aiServiceResult.suggested_services || []).map((pkg, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedServiceIndex(idx);
                      setServiceData(pkg);
                    }}
                    className={`card-surface p-4 cursor-pointer border-2 ${
                      selectedServiceIndex === idx ? 'border-saffron bg-saffron-50/20' : 'border-warmgray-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-saffron uppercase block mb-1">{pkg.tier || `Option ${idx+1}`}</span>
                    <h4 className="font-heading font-bold text-sm text-warmgray-900 line-clamp-2">{pkg.title}</h4>
                    <p className="font-heading text-xl font-black text-saffron-dark mt-2">₹{Math.round(pkg.price)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-cream-100 p-4 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-bold text-warmgray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={serviceData.title}
                    onChange={(e) => setServiceData({ ...serviceData, title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-warmgray-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-warmgray-700 mb-1">Confirmed Price (₹)</label>
                  <input
                    type="number"
                    value={serviceData.price}
                    onChange={(e) => setServiceData({ ...serviceData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-warmgray-300 text-xs font-bold text-saffron-dark"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-warmgray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={serviceData.duration}
                    onChange={(e) => setServiceData({ ...serviceData, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-warmgray-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleConfirmPublishService}
                  disabled={publishingService}
                  className="btn-primary text-sm font-bold !py-3.5 !px-8 shadow-warm-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{publishingService ? 'Publishing...' : '✓ Confirm & Publish Service Card'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRODUCT CARD TAB */}
      {activeTab === 'product_card' && !isCustomer && (
        <div className="space-y-6">
          <div className="card-surface p-6 sm:p-8 space-y-4 border border-sage-200">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-warmgray-900">
                Describe Your Handmade Delicacy (Speak or Type)
              </h3>
              <button
                type="button"
                onClick={() => openVoicePopup('product', 'Speak Your Handmade Product / Recipe Idea')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-sage-50 text-sage-dark border border-sage-200 hover:bg-sage-100 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-sage" />
                <span>Voice Input</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={productIdea}
              onChange={(e) => setProductIdea(e.target.value)}
              placeholder="e.g. Traditional Sun-Dried Mango Pickle with gingelly oil and fenugreek, 500g glass jar..."
              className="w-full p-4 rounded-2xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
            <button
              onClick={handleGenerateProduct}
              disabled={generatingProduct}
              className="w-full btn-secondary text-sm font-bold !py-3 flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>{generatingProduct ? 'Drafting Product Card...' : 'Generate Product Card'}</span>
            </button>
          </div>

          {productData && (
            <div className="card-surface p-6 space-y-4 border-2 border-sage animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <span className="badge-tag bg-sage text-white font-bold">{productData.category_slug}</span>
                  <h3 className="font-heading text-xl font-bold text-warmgray-900 mt-1">{productData.title}</h3>
                  <p className="text-xs text-warmgray-600 mt-1">{productData.description}</p>
                </div>
                <span className="font-heading text-3xl font-black text-sage-dark">₹{Math.round(productData.price)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-cream-50 p-3 rounded-xl">
                <div><strong>Shelf Life:</strong> {productData.shelf_life || '60 days'}</div>
                <div><strong>Stock:</strong> {productData.quantity || 10} units</div>
              </div>

              <button
                onClick={handleConfirmPublishProduct}
                disabled={publishingProduct}
                className="w-full btn-secondary text-sm font-bold !py-3 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{publishingProduct ? 'Publishing...' : '✓ Confirm & Publish Product to Store'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. GROWTH ADVISOR TAB */}
      {activeTab === 'growth_advisor' && !isCustomer && (
        <div className="card-surface p-6 space-y-4 border border-purple-200">
          <div className="flex items-center gap-2 pb-2 border-b border-warmgray-100">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-heading text-lg font-bold text-warmgray-900">
              Artisan & Homemaker Growth Advisor
            </h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-cream-50 rounded-2xl border border-warmgray-200">
            {advisorHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-purple-700 text-white font-medium'
                    : 'mr-auto bg-white text-warmgray-800 border border-warmgray-200 shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleAskAdvisor} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={advisorQuestion}
                onChange={(e) => setAdvisorQuestion(e.target.value)}
                placeholder="Ask about pricing, packaging, festive orders..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-warmgray-300 text-xs bg-cream-50 font-medium"
              />
              <button
                type="button"
                onClick={() => openVoicePopup('advisor', 'Speak Your Growth & Business Question')}
                className="absolute right-2 top-2 p-1 rounded-lg text-warmgray-400 hover:text-purple-600"
                title="Speak question"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={askingAdvisor}
              className="px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              Ask
            </button>
          </form>
        </div>
      )}

      {/* 4. SKILL EXTRACTOR TAB */}
      {activeTab === 'skill_extractor' && !isCustomer && (
        <div className="card-surface p-6 space-y-4 border border-blue-200">
          <div className="flex justify-between items-center">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">
              AI Skill Extraction & Skill Passport Formulator
            </h3>
            <button
              type="button"
              onClick={() => openVoicePopup('skill', 'Speak Your Skills & Experience')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-sm"
            >
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Voice Input</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={skillInputText}
            onChange={(e) => setSkillInputText(e.target.value)}
            placeholder="Paste your past experience, recipes, or vocational background..."
            className="w-full p-4 rounded-2xl border border-warmgray-300 bg-cream-50 text-xs font-medium"
          />
          <button
            onClick={handleExtractSkills}
            disabled={extractingSkills}
            className="btn-primary text-xs !py-2.5"
          >
            {extractingSkills ? 'Analyzing...' : 'Extract Verified Skills'}
          </button>

          {extractedSkillResult && (
            <div className="p-4 bg-cream-50 rounded-2xl border border-warmgray-200 space-y-3">
              <h4 className="font-bold text-xs text-warmgray-900">Detected Practical Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {(extractedSkillResult.skills || extractedSkillResult.primary_skills || ['Culinary Arts', 'Traditional Craft']).map((s, i) => (
                  <span key={i} className="badge-tag bg-white text-blue-800 border border-blue-200 font-bold">
                    ★ {s}
                  </span>
                ))}
              </div>
              <SkillPassportBadge trustScore={96} />
            </div>
          )}
        </div>
      )}

      {/* 5. FAIR PRICE CHECKER TAB (Common) */}
      {activeTab === 'fair_price' && (
        <div className="card-surface p-6 sm:p-8 space-y-6 border border-warmgray-300">
          <div>
            <span className="badge-tag bg-sage-50 text-sage-dark font-bold mb-1">Marketplace Transparency</span>
            <h3 className="font-heading text-2xl font-bold text-warmgray-900">
              Fair Price & Authenticity Evaluator
            </h3>
            <p className="text-xs text-warmgray-500 mt-1">
              Enter any service or handmade product quote to check if it meets verified artisan fair pricing standards.
            </p>
          </div>

          {(myHistoryBookings.length > 0 || myHistoryOrders.length > 0) && (
            <div className="p-4 bg-cream-100 rounded-2xl border border-warmgray-200 space-y-3">
              <span className="text-xs font-bold text-warmgray-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-saffron" />
                Analyze One of Your Recent Placed Bookings or Orders:
              </span>
              <div className="flex flex-wrap gap-2">
                {myHistoryBookings.map((b) => (
                  <button
                    key={`bk-${b.id}`}
                    type="button"
                    onClick={() => {
                      setFairCheckItem(b.service_title);
                      setFairCheckPrice(b.total_price);
                      setFairCheckLocation(b.location || 'Chennai');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-warmgray-800 border border-warmgray-300 hover:border-saffron flex items-center gap-1 shadow-sm"
                  >
                    <Calendar className="w-3 h-3 text-saffron" />
                    <span>{b.service_title} (₹{Math.round(b.total_price)})</span>
                  </button>
                ))}
                {myHistoryOrders.map((o) => (
                  <button
                    key={`ord-${o.id}`}
                    type="button"
                    onClick={() => {
                      setFairCheckItem(o.product_title);
                      setFairCheckPrice(o.total_price);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-warmgray-800 border border-warmgray-300 hover:border-sage flex items-center gap-1 shadow-sm"
                  >
                    <ShoppingCart className="w-3 h-3 text-sage" />
                    <span>{o.product_title} (₹{Math.round(o.total_price)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleCheckFairPrice} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-warmgray-700">Item / Service Name</label>
                <button
                  type="button"
                  onClick={() => openVoicePopup('fair_item', 'Speak Item or Service Name')}
                  className="text-[10px] font-bold flex items-center gap-0.5 text-sage-dark hover:underline"
                >
                  <Mic className="w-3 h-3" /> Voice
                </button>
              </div>
              <input
                type="text"
                value={fairCheckItem}
                onChange={(e) => setFairCheckItem(e.target.value)}
                placeholder="e.g. Traditional Lunch Preparation (2 hours)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Quoted Price (₹)</label>
              <input
                type="number"
                value={fairCheckPrice}
                onChange={(e) => setFairCheckPrice(e.target.value)}
                placeholder="e.g. 800"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">City / Area</label>
              <input
                type="text"
                value={fairCheckLocation}
                onChange={(e) => setFairCheckLocation(e.target.value)}
                placeholder="Chennai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-xs font-medium"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={checkingPrice}
                className="w-full btn-primary text-xs font-bold !py-3 flex items-center justify-center gap-1.5"
              >
                <Scale className="w-4 h-4" />
                {checkingPrice ? 'Evaluating Fair Market Benchmarks...' : 'Evaluate Price Fairness'}
              </button>
            </div>
          </form>

          {fairPriceResult && (
            <div className="p-5 bg-gradient-to-r from-cream-50 via-white to-sage-50 rounded-2xl border border-sage-200 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="badge-tag bg-sage text-white font-bold">{fairPriceResult.badge}</span>
                <span className="text-xs font-bold text-sage-dark">{fairPriceResult.authenticity_rating}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl border border-warmgray-200">
                  <span className="text-[10px] text-warmgray-500 font-bold block">Min Market Fair Price</span>
                  <span className="font-heading text-base font-bold text-warmgray-700">₹{fairPriceResult.fair_range?.min}</span>
                </div>
                <div className="p-3 bg-sage-50 rounded-xl border-2 border-sage">
                  <span className="text-[10px] text-sage-dark font-bold block">Recommended Honest Wage</span>
                  <span className="font-heading text-lg font-black text-sage-dark">₹{fairPriceResult.fair_range?.recommended}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-warmgray-200">
                  <span className="text-[10px] text-warmgray-500 font-bold block">Maximum Fair Price</span>
                  <span className="font-heading text-base font-bold text-warmgray-700">₹{fairPriceResult.fair_range?.max}</span>
                </div>
              </div>

              <p className="text-xs text-warmgray-700 leading-relaxed bg-white p-3 rounded-xl border border-warmgray-100">
                {fairPriceResult.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. SMART RECOMMENDATIONS TAB (Common) */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-heading text-2xl font-bold text-warmgray-900">Curated Verified Recommendations</h3>
            <p className="text-xs text-warmgray-500">Handpicked top-rated traditional services and homemade goods.</p>
          </div>

          {loadingRecs ? (
            <div className="text-center py-10 font-bold text-saffron">Loading curated recommendations...</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-heading text-base font-bold text-warmgray-900 mb-3">Top Verified Services</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(recommendations?.recommended_services || []).map((s) => (
                    <div key={s.id} className="card-surface p-4 space-y-2">
                      <span className="badge-tag bg-saffron-50 text-saffron-dark">{s.category_name}</span>
                      <h5 className="font-bold text-sm text-warmgray-900">{s.title}</h5>
                      <p className="text-xs text-warmgray-500">By {s.provider_name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                        <span className="font-bold text-sm text-saffron-dark">₹{Math.round(s.price)}</span>
                        <Link to={`/services/${s.id}`} className="text-xs font-bold text-warmgray-700 hover:text-saffron">
                          Book →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-warmgray-200">
                <h4 className="font-heading text-base font-bold text-warmgray-900 mb-3">Handmade Marketplace Delicacies</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(recommendations?.recommended_products || []).map((p) => (
                    <div key={p.id} className="card-surface p-4 space-y-2">
                      <span className="badge-tag bg-sage-50 text-sage-dark">{p.category_name}</span>
                      <h5 className="font-bold text-sm text-warmgray-900">{p.title}</h5>
                      <p className="text-xs text-warmgray-500">By {p.provider_name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                        <span className="font-bold text-sm text-sage-dark">₹{Math.round(p.price)}</span>
                        <Link to={`/products/${p.id}`} className="text-xs font-bold text-warmgray-700 hover:text-sage">
                          Order →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Listening Popup Modal with 20s Silence Timeout */}
      <VoiceListeningModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceCaptured={handleVoiceDataReceived}
        title={voiceModalTitle}
      />
    </div>
  );
};
