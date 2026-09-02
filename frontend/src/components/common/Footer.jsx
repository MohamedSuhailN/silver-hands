import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#155A8A] text-white mt-20 pt-12 pb-8 border-t border-[#1F6FB2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <BrandLogo size="md" />
              <span className="font-heading text-2xl font-black text-white">
                Silver<span className="text-[#3F9BE8]">Hands</span>
              </span>
            </div>
            <p className="text-sm text-white/80 max-w-md leading-relaxed mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3 text-xs font-bold text-[#EAF5FC]">
              <ShieldCheck className="w-4 h-4 text-[#3F9BE8]" />
              <span>{t('ui.Verified Skill Passports & Trust Protection')}</span>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider mb-4">
              {t('ui.Marketplace')}
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-white/80">
              <li><Link to="/services" className="hover:text-[#3F9BE8] transition-colors">{t('ui.Traditional Services')}</Link></li>
              <li><Link to="/products" className="hover:text-[#3F9BE8] transition-colors">{t('ui.Handmade Goods')}</Link></li>
              <li><Link to="/providers" className="hover:text-[#3F9BE8] transition-colors">{t('ui.Verified Elders')}</Link></li>
              <li><Link to="/radar" className="hover:text-[#3F9BE8] transition-colors">{t('nav.radar')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider mb-4">
              {t('ui.AI Intelligence')}
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-white/80">
              <li><Link to="/ai-match" className="hover:text-[#3F9BE8] flex items-center gap-1.5 transition-colors"><Sparkles className="w-3.5 h-3.5 text-[#3F9BE8]" /> {t('ui.AI Matcher')}</Link></li>
              <li><Link to="/register-voice" className="hover:text-[#3F9BE8] transition-colors">{t('ui.Voice Onboarding')}</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-[#3F9BE8] transition-colors">{t('ui.Business Advisor')}</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/20 pt-6 text-center text-xs font-semibold text-white/70">
          <p>{t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};
