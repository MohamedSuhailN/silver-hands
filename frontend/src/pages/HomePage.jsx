import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getCategories, getServices, getProducts, getOpportunities } from '../api/client';
import { ServiceCard } from '../components/marketplace/ServiceCard';
import { ProductCard } from '../components/marketplace/ProductCard';
import { BookingModal } from '../components/marketplace/BookingModal';
import { OrderModal } from '../components/marketplace/OrderModal';
import { OpportunityRadarCard } from '../components/radar/OpportunityRadarCard';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { 
  Sparkles, Search, ArrowRight,
  Compass, ShoppingBag, Scissors, BookOpen, Leaf, Shirt, Utensils
} from 'lucide-react';
import heroHandshakeImg from '../assets/hero_handshake.jpg';

export const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [radarOpps, setRadarOpps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Section scroll reveal refs
  const heroRef     = useScrollReveal();
  const catsRef     = useScrollReveal();
  const servicesRef = useScrollReveal();
  const radarRef    = useScrollReveal();
  const productsRef = useScrollReveal();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, srvRes, prdRes, oppRes] = await Promise.all([
          getCategories(),
          getServices(),
          getProducts(),
          getOpportunities()
        ]);
        setCategories(catRes.data || []);
        setFeaturedServices((srvRes.data || []).slice(0, 4));
        setFeaturedProducts((prdRes.data || []).slice(0, 4));
        setRadarOpps((oppRes.data || []).slice(0, 2));
      } catch (err) {
        console.error('Home data load error:', err);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-16">
      
      {/* 1. Hero Section */}
      <section
        ref={heroRef}
        className="scroll-reveal relative rounded-3xl p-8 sm:p-14 border border-[#DCEAF4] shadow-warm overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(21, 90, 138, 0.88), rgba(63, 155, 232, 0.72)), url(${heroHandshakeImg})` }}
      >
        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 text-[#1F6FB2] text-xs font-bold shadow-warm-sm border border-white/40 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#3F9BE8]" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            {t('hero.title')}
          </h1>

          <p className="text-base sm:text-lg text-white/95 leading-relaxed max-w-2xl font-medium">
            {t('hero.subtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-2xl">
            <div className="flex items-center bg-white rounded-2xl shadow-warm-lg p-2 border-2 border-warmgray-200 focus-within:border-saffron transition-all">
              <Search className="w-5 h-5 text-warmgray-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full px-3 py-2 bg-transparent text-sm sm:text-base font-medium focus:outline-none text-warmgray-800"
              />
              <button type="submit" className="btn-primary text-xs sm:text-sm !py-2.5 !px-5 shrink-0">
                {t('ui.Search')}
              </button>
            </div>
          </form>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/ai-match" className="btn-primary text-xs sm:text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              {t('hero.aiMatchBtn')}
            </Link>
            <Link to="/services" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#1F6FB2] border-2 border-white hover:bg-[#EAF5FC] hover:border-[#EAF5FC] transition-all shadow-warm-sm">
              {t('hero.browseBtn')}
            </Link>
            <Link to="/radar" className="btn-ghost text-xs sm:text-sm flex items-center gap-1 !text-white hover:!bg-white/20">
              <Compass className="w-4 h-4 text-white" />
              {t('ui.View Opportunity Radar')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Top Skill Categories — staggered grid with scale entrance */}
      <section ref={catsRef} className="scroll-reveal-scale">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="page-title text-2xl sm:text-3xl">{t('ui.Popular Skill Categories')}</h2>
            <p className="text-xs sm:text-sm text-warmgray-500">{t('ui.Discover verified elder wisdom by category')}</p>
          </div>
          <Link to="/services" className="text-xs font-bold text-[#3F9BE8] hover:text-[#1F6FB2] hover:underline flex items-center gap-1 transition-colors">
            {t('ui.View All Categories')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="scroll-reveal-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              to={`/services?category=${cat.slug}`}
              className="card-surface p-5 text-center group hover:border-[#3F9BE8] hover:bg-[#EAF5FC]/40 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5FC] text-[#3F9BE8] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-[#3F9BE8] group-hover:text-white transition-all">
                {cat.slug === 'cooking' ? <Utensils className="w-6 h-6" /> : cat.slug === 'tailoring' ? <Shirt className="w-6 h-6" /> : cat.slug === 'tutoring' ? <BookOpen className="w-6 h-6" /> : cat.slug === 'gardening' ? <Leaf className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
              </div>
              <h3 className="font-heading font-bold text-sm text-[#163A5F] group-hover:text-[#3F9BE8] transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-[#64748B] line-clamp-1 mt-1">{cat.description || 'Verified local service'}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Traditional Services */}
      <section ref={servicesRef} className="scroll-reveal">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="page-title text-2xl sm:text-3xl">{t('ui.Traditional Home Services')}</h2>
            <p className="text-xs sm:text-sm text-warmgray-500">{t('ui.Cooks, tailors, tutors and plant experts ready to serve')}</p>
          </div>
          <Link to="/services" className="btn-ghost text-xs">
            {t('ui.Browse All Services')}
          </Link>
        </div>

        <div className="scroll-reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={(s) => setSelectedService(s)}
            />
          ))}
        </div>
      </section>

      {/* 4. Opportunity Radar Highlight — slide-in from side */}
      <section ref={radarRef} className="scroll-reveal-left bg-sage-50/70 border border-sage-200 rounded-3xl p-8 shadow-warm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <span className="badge-tag bg-sage text-white font-bold mb-2">{t('ui.Live Reverse Marketplace')}</span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-warmgray-900">
              {t('ui.Opportunity Radar in Your Area')}
            </h2>
            <p className="text-xs sm:text-sm text-warmgray-600 mt-1">
              Customers posting direct home service and catering requests for local elders to claim.
            </p>
          </div>
          <Link to="/radar" className="btn-secondary text-xs sm:text-sm shrink-0">
            {t('ui.Open Full Opportunity Radar')}
          </Link>
        </div>

        <div className="scroll-reveal-stagger grid grid-cols-1 md:grid-cols-2 gap-6">
          {radarOpps.map((opp) => (
            <OpportunityRadarCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* 5. Handmade Products Store — scale entrance */}
      <section ref={productsRef} className="scroll-reveal-scale">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="page-title text-2xl sm:text-3xl">{t('ui.Artisanal Handmade Goods')}</h2>
            <p className="text-xs sm:text-sm text-warmgray-500">{t('ui.Pure homemade pickles, traditional snacks, and eco crafts')}</p>
          </div>
          <Link to="/products" className="btn-ghost text-xs">
            {t('ui.Shop All Products')}
          </Link>
        </div>

        <div className="scroll-reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOrder={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* Booking & Order Modals */}
      <BookingModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />
      <OrderModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

    </div>
  );
};
