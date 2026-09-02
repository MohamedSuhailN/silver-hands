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
        <span className="badge-tag bg-[#3F9BE8] text-white font-bold">
          <Sparkles className="w-3.5 h-3.5" /> AI Artisan & Marketplace Wizard
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#163A5F]">
          Smart AI Toolkit for Artisans, Homemakers & Customers
        </h1>
        <p className="text-sm text-[#64748B] max-w-2xl mx-auto">
          Generate live service & product cards, consult the Growth Advisor, extract verified skills, and verify fair market pricing.
        </p>
      </div>

      {isCustomer && (
        <div className="p-4 bg-[#EAF5FC] border border-[#DCEAF4] rounded-2xl flex items-center justify-between text-xs text-[#1F6FB2]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#1F6FB2] shrink-0" />
            <span>You are logged in as a <strong>Customer</strong>. You can use the <strong>Fair Price Checker</strong> and <strong>Smart Recommendations</strong> below. Service/Product card creation is reserved for verified Providers.</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-[#DCEAF4] pb-2 overflow-x-auto">
        {!isCustomer && (
          <>
            <button
              onClick={() => setActiveTab('service_card')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'service_card' ? 'bg-[#3F9BE8] text-white shadow-warm' : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#D5EBF9]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Generate Service Card
            </button>

            <button
              onClick={() => setActiveTab('product_card')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'product_card' ? 'bg-[#1F6FB2] text-white shadow-warm' : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#D5EBF9]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Generate Product Card
            </button>

            <button
              onClick={() => setActiveTab('growth_advisor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'growth_advisor' ? 'bg-[#155A8A] text-white shadow-warm' : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#D5EBF9]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Growth Advisor
            </button>

            <button
              onClick={() => setActiveTab('skill_extractor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'skill_extractor' ? 'bg-[#3F9BE8] text-white shadow-warm' : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#D5EBF9]'
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
            activeTab === 'fair_price' ? 'bg-[#163A5F] text-white shadow-warm' : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#D5EBF9]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Fair Price Checker (Common)
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'recommendations' ? 'bg-[#163A5F] text-white shadow-warm' : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#D5EBF9]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Smart Recommendations
        </button>
      </div>

      {/* 1. SERVICE CARD TAB */}
      {activeTab === 'service_card' && !isCustomer && (
        <div className="space-y-6">
          <div className="card-surface p-6 sm:p-8 space-y-4 border border-[#3F9BE8]/30 bg-white">
            <h3 className="font-heading text-lg font-bold text-[#163A5F]">
              Describe Your Traditional Craft or Experience
            </h3>
            <div className="flex justify-between items-center pb-1">
              <span className="text-xs font-bold text-[#64748B]">Your craft story or background:</span>
              <button
                type="button"
                onClick={() => openVoicePopup('service', 'Speak Your Craft Experience & Background')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#EAF5FC] text-[#1F6FB2] border border-[#3F9BE8]/30 hover:bg-[#3F9BE8] hover:text-white shadow-sm transition-all"
              >
                <Mic className="w-3.5 h-3.5 text-[#3F9BE8]" />
                <span>Voice Input</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={inputStory}
              onChange={(e) => setInputStory(e.target.value)}
              placeholder="e.g. My name is Kamala. I have 25 years of experience cooking authentic Chettinad feasts, vegetarian lunches, and homemade spice powders in Chennai..."
              className="w-full p-4 rounded-2xl border border-[#DCEAF4] bg-white text-sm font-medium focus:ring-2 focus:ring-[#3F9BE8]"
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
                      selectedServiceIndex === idx ? 'border-[#3F9BE8] bg-[#EAF5FC]/30' : 'border-[#DCEAF4]'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-[#3F9BE8] uppercase block mb-1">{pkg.tier || `Option ${idx+1}`}</span>
                    <h4 className="font-heading font-bold text-sm text-[#163A5F] line-clamp-2">{pkg.title}</h4>
                    <p className="font-heading text-xl font-black text-[#1F6FB2] mt-2">₹{Math.round(pkg.price)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F5F9FC] p-4 rounded-2xl border border-[#DCEAF4]">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Title</label>
                  <input
                    type="text"
                    value={serviceData.title}
                    onChange={(e) => setServiceData({ ...serviceData, title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DCEAF4] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Confirmed Price (₹)</label>
                  <input
                    type="number"
                    value={serviceData.price}
                    onChange={(e) => setServiceData({ ...serviceData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DCEAF4] text-xs font-bold text-[#1F6FB2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Duration</label>
                  <input
                    type="text"
                    value={serviceData.duration}
                    onChange={(e) => setServiceData({ ...serviceData, duration: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DCEAF4] text-xs font-bold"
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
          <div className="card-surface p-6 sm:p-8 space-y-4 border border-[#DCEAF4] bg-white">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-[#163A5F]">
                Describe Your Handmade Delicacy (Speak or Type)
              </h3>
              <button
                type="button"
                onClick={() => openVoicePopup('product', 'Speak Your Handmade Product / Recipe Idea')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#EAF5FC] text-[#1F6FB2] border border-[#3F9BE8]/30 hover:bg-[#3F9BE8] hover:text-white shadow-sm transition-all"
              >
                <Mic className="w-3.5 h-3.5 text-[#3F9BE8]" />
                <span>Voice Input</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={productIdea}
              onChange={(e) => setProductIdea(e.target.value)}
              placeholder="e.g. Traditional Sun-Dried Mango Pickle with gingelly oil and fenugreek, 500g glass jar..."
              className="w-full p-4 rounded-2xl border border-[#DCEAF4] bg-white text-sm font-medium"
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
            <div className="card-surface p-6 space-y-4 border-2 border-[#1F6FB2] animate-fade-in bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="badge-tag bg-[#EAF5FC] text-[#1F6FB2] font-bold">{productData.category_slug}</span>
                  <h3 className="font-heading text-xl font-bold text-[#163A5F] mt-1">{productData.title}</h3>
                  <p className="text-xs text-[#64748B] mt-1">{productData.description}</p>
                </div>
                <span className="font-heading text-3xl font-black text-[#1F6FB2]">₹{Math.round(productData.price)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#F5F9FC] p-3 rounded-xl border border-[#DCEAF4]">
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
        <div className="card-surface p-6 space-y-4 border border-[#DCEAF4] bg-white">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E8F1F7]">
            <TrendingUp className="w-5 h-5 text-[#1F6FB2]" />
            <h3 className="font-heading text-lg font-bold text-[#163A5F]">
              Artisan & Homemaker Growth Advisor
            </h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-[#F5F9FC] rounded-2xl border border-[#DCEAF4]">
            {advisorHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-[#1F6FB2] text-white font-medium'
                    : 'mr-auto bg-white text-[#1F2937] border border-[#DCEAF4] shadow-sm'
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
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#DCEAF4] text-xs bg-white font-medium"
              />
              <button
                type="button"
                onClick={() => openVoicePopup('advisor', 'Speak Your Growth & Business Question')}
                className="absolute right-2 top-2 p-1 rounded-lg text-[#64748B] hover:text-[#3F9BE8]"
                title="Speak question"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={askingAdvisor}
              className="btn-secondary !px-5 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              Ask
            </button>
          </form>
        </div>
      )}

      {/* 4. SKILL EXTRACTOR TAB */}
      {activeTab === 'skill_extractor' && !isCustomer && (
        <div className="card-surface p-6 space-y-4 border border-[#DCEAF4] bg-white">
          <div className="flex justify-between items-center">
            <h3 className="font-heading text-lg font-bold text-[#163A5F]">
              AI Skill Extraction & Skill Passport Formulator
            </h3>
            <button
              type="button"
              onClick={() => openVoicePopup('skill', 'Speak Your Skills & Experience')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#EAF5FC] text-[#1F6FB2] border border-[#3F9BE8]/30 hover:bg-[#3F9BE8] hover:text-white shadow-sm transition-all"
            >
              <Mic className="w-3.5 h-3.5 text-[#3F9BE8]" />
              <span>Voice Input</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={skillInputText}
            onChange={(e) => setSkillInputText(e.target.value)}
            placeholder="Paste your past experience, recipes, or vocational background..."
            className="w-full p-4 rounded-2xl border border-[#DCEAF4] bg-white text-xs font-medium"
          />
          <button
            onClick={handleExtractSkills}
            disabled={extractingSkills}
            className="btn-primary text-xs !py-2.5"
          >
            {extractingSkills ? 'Analyzing...' : 'Extract Verified Skills'}
          </button>

          {extractedSkillResult && (
            <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#DCEAF4] space-y-3">
              <h4 className="font-bold text-xs text-[#163A5F]">Detected Practical Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {(extractedSkillResult.skills || extractedSkillResult.primary_skills || ['Culinary Arts', 'Traditional Craft']).map((s, i) => (
                  <span key={i} className="badge-tag bg-white text-[#1F6FB2] border border-[#DCEAF4] font-bold">
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
        <div className="card-surface p-6 sm:p-8 space-y-6 border border-[#DCEAF4] bg-white">
          <div>
            <span className="badge-tag bg-[#EAF5FC] text-[#1F6FB2] font-bold mb-1">Marketplace Transparency</span>
            <h3 className="font-heading text-2xl font-bold text-[#163A5F]">
              Fair Price & Authenticity Evaluator
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Enter any service or handmade product quote to check if it meets verified artisan fair pricing standards.
            </p>
          </div>

          {(myHistoryBookings.length > 0 || myHistoryOrders.length > 0) && (
            <div className="p-4 bg-[#F5F9FC] rounded-2xl border border-[#DCEAF4] space-y-3">
              <span className="text-xs font-bold text-[#163A5F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3F9BE8]" />
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
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-[#1F2937] border border-[#DCEAF4] hover:border-[#3F9BE8] flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Calendar className="w-3 h-3 text-[#3F9BE8]" />
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
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-[#1F2937] border border-[#DCEAF4] hover:border-[#1F6FB2] flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3 text-[#1F6FB2]" />
                    <span>{o.product_title} (₹{Math.round(o.total_price)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleCheckFairPrice} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-[#1F2937]">Item / Service Name</label>
                <button
                  type="button"
                  onClick={() => openVoicePopup('fair_item', 'Speak Item or Service Name')}
                  className="text-[10px] font-bold flex items-center gap-0.5 text-[#1F6FB2] hover:underline"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">Quoted Price (₹)</label>
              <input
                type="number"
                value={fairCheckPrice}
                onChange={(e) => setFairCheckPrice(e.target.value)}
                placeholder="e.g. 800"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">City / Area</label>
              <input
                type="text"
                value={fairCheckLocation}
                onChange={(e) => setFairCheckLocation(e.target.value)}
                placeholder="Chennai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-xs font-medium"
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
            <div className="p-5 bg-[#F5F9FC] rounded-2xl border border-[#DCEAF4] space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="badge-tag bg-[#3F9BE8] text-white font-bold">{fairPriceResult.badge}</span>
                <span className="text-xs font-bold text-[#1F6FB2]">{fairPriceResult.authenticity_rating}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl border border-[#DCEAF4]">
                  <span className="text-[10px] text-[#64748B] font-bold block">Min Market Fair Price</span>
                  <span className="font-heading text-base font-bold text-[#1F2937]">₹{fairPriceResult.fair_range?.min}</span>
                </div>
                <div className="p-3 bg-[#EAF5FC] rounded-xl border-2 border-[#3F9BE8]">
                  <span className="text-[10px] text-[#1F6FB2] font-bold block">Recommended Honest Wage</span>
                  <span className="font-heading text-lg font-black text-[#1F6FB2]">₹{fairPriceResult.fair_range?.recommended}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DCEAF4]">
                  <span className="text-[10px] text-[#64748B] font-bold block">Maximum Fair Price</span>
                  <span className="font-heading text-base font-bold text-[#1F2937]">₹{fairPriceResult.fair_range?.max}</span>
                </div>
              </div>

              <p className="text-xs text-[#1F2937] leading-relaxed bg-white p-3 rounded-xl border border-[#DCEAF4]">
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
            <h3 className="font-heading text-2xl font-bold text-[#163A5F]">Curated Verified Recommendations</h3>
            <p className="text-xs text-[#64748B]">Handpicked top-rated traditional services and homemade goods.</p>
          </div>

          {loadingRecs ? (
            <div className="text-center py-10 font-bold text-[#3F9BE8]">Loading curated recommendations...</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-heading text-base font-bold text-[#163A5F] mb-3">Top Verified Services</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(recommendations?.recommended_services || []).map((s) => (
                    <div key={s.id} className="card-surface p-4 space-y-2 bg-white">
                      <span className="badge-tag bg-[#EAF5FC] text-[#1F6FB2]">{s.category_name}</span>
                      <h5 className="font-bold text-sm text-[#163A5F]">{s.title}</h5>
                      <p className="text-xs text-[#64748B]">By {s.provider_name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-[#E8F1F7]">
                        <span className="font-bold text-sm text-[#1F6FB2]">₹{Math.round(s.price)}</span>
                        <Link to={`/services/${s.id}`} className="text-xs font-bold text-[#1F6FB2] hover:text-[#3F9BE8]">
                          Book →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#DCEAF4]">
                <h4 className="font-heading text-base font-bold text-[#163A5F] mb-3">Handmade Marketplace Delicacies</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(recommendations?.recommended_products || []).map((p) => (
                    <div key={p.id} className="card-surface p-4 space-y-2 bg-white">
                      <span className="badge-tag bg-[#EAF5FC] text-[#1F6FB2]">{p.category_name}</span>
                      <h5 className="font-bold text-sm text-[#163A5F]">{p.title}</h5>
                      <p className="text-xs text-[#64748B]">By {p.provider_name}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-[#E8F1F7]">
                        <span className="font-bold text-sm text-[#1F6FB2]">₹{Math.round(p.price)}</span>
                        <Link to={`/products/${p.id}`} className="text-xs font-bold text-[#1F6FB2] hover:text-[#3F9BE8]">
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
