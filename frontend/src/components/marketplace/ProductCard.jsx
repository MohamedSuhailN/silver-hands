import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ProductCard = ({ product, onOrder }) => {
  const { t } = useLanguage();
  return (
    <div className="card-surface flex flex-col h-full overflow-hidden group">
      <div className="relative h-48 overflow-hidden bg-cream-200">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80'; }}
        />
        <div className="absolute top-3 left-3 bg-sage text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
          {t('ui.Handmade')}
        </div>
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-bold text-warmgray-700">
          {t('ui.Qty')}: {product.quantity} {t('ui.left')}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product.id}`} className="block group-hover:text-saffron transition-colors">
            <h3 className="font-heading text-lg font-bold text-warmgray-900 line-clamp-1">
              {product.title}
            </h3>
          </Link>

          <Link to={`/providers/${product.provider}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-warmgray-600 mt-1 hover:text-saffron">
            <span>{t('ui.By')} {product.provider_name}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
          </Link>

          <p className="text-xs text-warmgray-500 mt-2.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-warmgray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-warmgray-400 font-medium block">{t('ui.Price')}</span>
            <span className="font-heading text-xl font-bold text-warmgray-900">
              ₹{Math.round(product.price)}
            </span>
          </div>

          <button
            onClick={() => onOrder(product)}
            className="btn-secondary text-xs !px-4 !py-2 flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {t('ui.Buy Item')}
          </button>
        </div>
      </div>
    </div>
  );
};
