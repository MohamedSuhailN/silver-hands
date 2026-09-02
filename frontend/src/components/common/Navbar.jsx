import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSeniorMode } from '../../context/SeniorModeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { BrandLogo } from './BrandLogo';
import { 
  Sparkles, Mic, Eye, Globe, Bell, User, ShoppingBag, 
  Wand2, Compass, Menu, X, ShieldAlert, LogOut, LayoutDashboard, 
  Utensils, Calendar, MessageSquare, Award, Scissors, Package, UserCircle, BookOpen
} from 'lucide-react';

export const Navbar = ({ onOpenVoice }) => {
  const { user, isAuthenticated, isCustomer, isProvider, isAdmin, logout } = useAuth();
  const { isSeniorMode, toggleSeniorMode } = useSeniorMode();
  const { language, changeLanguage, t } = useLanguage();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warmgray-200 shadow-warm-sm">
      
      {/* 1. Main Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <BrandLogo size="md" />
              <div>
                <span className="font-heading text-xl sm:text-2xl font-black text-[#333333] tracking-tight flex items-center gap-1">
                  Silver<span className="text-[#3F9BE8]">Hands</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#1F6FB2] block tracking-widest uppercase -mt-1">
                  Elder Livelihoods
                </span>
              </div>
            </Link>
          </div>

          {/* Core Categories Links (Clean Center) */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/services"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isActive('/services')
                  ? 'bg-[#3F9BE8] text-white shadow-warm'
                  : 'text-[#1F2937] hover:text-[#3F9BE8] hover:bg-[#EAF5FC]'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>{t('nav.services')}</span>
            </Link>

            <Link
              to="/products"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isActive('/products')
                  ? 'bg-[#3F9BE8] text-white shadow-warm'
                  : 'text-[#1F2937] hover:text-[#3F9BE8] hover:bg-[#EAF5FC]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('ui.Marketplace')}</span>
            </Link>

            <Link
              to="/providers"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/providers')
                  ? 'bg-[#1F6FB2] text-white shadow-warm'
                  : 'text-[#1F2937] hover:text-[#3F9BE8] hover:bg-[#EAF5FC]'
              }`}
            >
              Artisans & Homemakers
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Voice Assistant Button */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#1F6FB2] border border-[#DCEAF4] hover:bg-[#3F9BE8] hover:text-white hover:border-[#3F9BE8] font-bold text-xs shadow-sm transition-all"
              title={t('ui.Voice Assistant')}
            >
              <Mic className="w-4 h-4 text-[#3F9BE8]" />
              <span className="hidden sm:inline">{t('ui.Voice')}</span>
            </button>

            {/* Senior / Accessibility Mode Toggle */}
            <button
              onClick={toggleSeniorMode}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                isSeniorMode
                  ? 'bg-[#1F6FB2] text-white border-[#1F6FB2]'
                  : 'bg-white text-[#1F6FB2] border-[#DCEAF4] hover:bg-[#3F9BE8] hover:text-white hover:border-[#3F9BE8]'
              }`}
              title={t('ui.Toggle Senior Mode')}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">{t('ui.Senior')}</span>
            </button>

            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-white border border-[#DCEAF4] rounded-xl px-3 py-2 text-xs font-bold text-[#1F6FB2] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3F9BE8] shadow-sm hover:border-[#3F9BE8] transition-all"
            >
              <option value="en">EN</option>
              <option value="ta">தமிழ்</option>
              <option value="hi">हिंदी</option>
            </select>

            {/* Auth Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl border border-warmgray-200 hover:bg-cream-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-saffron text-white flex items-center justify-center font-bold text-sm">
                    {user?.first_name ? user.first_name[0] : user?.username?.[0]?.toUpperCase()}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-warm-xl border border-warmgray-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-warmgray-100">
                      <p className="text-xs text-warmgray-500 font-semibold">{t('ui.Signed in as')}</p>
                      <p className="text-sm font-bold text-warmgray-900 truncate">
                        {user?.get_full_name || user?.username}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-saffron/10 text-saffron">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link to="/admin-panel" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border-b border-red-100 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                          <span>{t('ui.Admin Control Panel')}</span>
                        </Link>
                      )}
                      {isProvider && (
                        <Link to="/provider/dashboard" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-bold text-warmgray-900 bg-cream-100 hover:bg-cream-200 flex items-center gap-1.5">
                          <LayoutDashboard className="w-3.5 h-3.5 text-saffron" />
                          {t('nav.dashboard')} (Operations)
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100 flex items-center gap-1.5">
                        <UserCircle className="w-3.5 h-3.5 text-warmgray-500" />
                        {t('ui.Profile & Statistics')}
                      </Link>
                      {isProvider && (
                        <Link to="/skill-passport" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-warmgray-500" />
                          {t('ui.Skill Passport')}
                        </Link>
                      )}
                      <Link to="/bookings" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-warmgray-500" />
                        {t('nav.myBookings')}
                      </Link>
                      <Link to="/orders" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-warmgray-500" />
                        {t('nav.myOrders')}
                      </Link>
                      <Link to="/messages" onClick={() => setUserDropdownOpen(false)} className="block px-4 py-2 text-xs font-medium text-warmgray-700 hover:bg-cream-100 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-warmgray-500" />
                        {t('nav.messages')}
                      </Link>
                    </div>

                    <div className="border-t border-warmgray-100 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('ui.Sign Out')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-xs !py-1.5 !px-3">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary text-xs !py-1.5 !px-3">
                  {t('ui.Join')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-warmgray-600 hover:bg-cream-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* 2. Secondary Sub-Navbar Row (Clean feature bar below main navbar) */}
      <div className="bg-[#EAF5FC] border-t border-[#DCEAF4] py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 text-xs">
          
          {/* Left Feature Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            <Link
              to="/radar"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isActive('/radar')
                  ? 'bg-sage text-white shadow-warm-sm'
                  : 'bg-white text-sage-dark hover:bg-sage/10 border border-warmgray-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sage shrink-0" />
              <span>{t('ui.Radar Gigs')}</span>
            </Link>

            <Link
              to="/ai-match"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isActive('/ai-match')
                  ? 'bg-[#3F9BE8] text-white shadow-warm-sm'
                  : 'bg-white text-[#1F6FB2] hover:bg-[#EAF5FC] border border-[#E5E5E5]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3F9BE8] shrink-0" />
              <span>{t('nav.aiMatch')}</span>
            </Link>

            <Link
              to="/ai-wizard"
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isActive('/ai-wizard')
                  ? 'bg-purple-600 text-white shadow-warm-sm'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-warmgray-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{t('ui.AI Wizard')}</span>
            </Link>

            {isProvider && (
              <Link
                to="/provider/dashboard"
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/provider/dashboard')
                    ? 'bg-[#1F6FB2] text-white shadow-warm-sm'
                    : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#D5EBF9] border border-[#3F9BE8]/30'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#1F6FB2] shrink-0" />
                <span>{t('nav.dashboard')}</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin-panel"
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isActive('/admin-panel')
                    ? 'bg-red-600 text-white shadow-warm-sm'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{t('ui.Admin Panel')}</span>
              </Link>
            )}
          </div>

          {/* Right Activity Pills (When Logged in) */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <Link
                to="/bookings"
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  isActive('/bookings') ? 'bg-warmgray-900 text-white' : 'text-warmgray-700 hover:bg-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t('nav.myBookings')}</span>
              </Link>

              <Link
                to="/orders"
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  isActive('/orders') ? 'bg-warmgray-900 text-white' : 'text-warmgray-700 hover:bg-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('nav.myOrders')}</span>
              </Link>

              <Link
                to="/profile"
                className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  isActive('/profile') ? 'bg-warmgray-900 text-white' : 'text-warmgray-700 hover:bg-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('ui.Profile & Stats')}</span>
              </Link>
            </div>
          )}

        </div>
      </div>

    </header>
  );
};
