import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ServiceCard = ({ service, onBook }) => {
  const { t } = useLanguage();
  return (
    <div className="card-surface flex flex-col h-full overflow-hidden group">
      <div className="relative h-48 overflow-hidden bg-cream-200">
        <img
          src={service.image_url || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80'}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80'; }}
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-warmgray-800 shadow-sm">
          {service.category_name || t('ui.Home Service')}
        </div>
        {service.provider_rating >= 4.5 && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            <span>{service.provider_rating}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/services/${service.id}`} className="block group-hover:text-saffron transition-colors">
            <h3 className="font-heading text-lg font-bold text-warmgray-900 line-clamp-1">
              {service.title}
            </h3>
          </Link>
          
          <Link to={`/providers/${service.provider}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-warmgray-600 mt-1 hover:text-saffron">
            <span>{t('ui.By')} {service.provider_name}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
          </Link>

          <p className="text-xs text-warmgray-500 mt-2.5 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-warmgray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-warmgray-400 font-medium block">{t('ui.Price')}</span>
            <span className="font-heading text-xl font-bold text-saffron-dark">
              ₹{Math.round(service.price)}
            </span>
            <span className="text-[11px] text-warmgray-500 font-medium ml-1">/{service.pricing_unit || t('ui.service')}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/services/${service.id}`} className="btn-ghost text-xs !px-3 !py-2">
              {t('ui.Details')}
            </Link>
            <button
              onClick={() => onBook(service)}
              className="btn-primary text-xs !px-3.5 !py-2 shadow-sm"
            >
              {t('ui.Book Now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
