import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct } from '../../api/client';
import { OrderModal } from '../../components/marketplace/OrderModal';
import { SkillPassportBadge } from '../../components/trust/SkillPassportBadge';
import { ShoppingBag, MapPin, ShieldCheck, ArrowLeft, Plus, Minus, Heart } from 'lucide-react';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOrderOpen, setIsOrderOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProduct(id);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="text-center py-20 font-bold text-sage">Loading product details...</div>;
  if (!product) return <div className="text-center py-20 font-bold">Product not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-warmgray-600 hover:text-sage">
        <ArrowLeft className="w-4 h-4" /> Back to Handmade Marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 card-surface p-8">
        
        {/* Left Col: Product Image */}
        <div className="relative rounded-3xl overflow-hidden bg-cream-200 h-96 shadow-inner">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-sage text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            Handmade by Elder
          </div>
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl text-xs font-bold text-warmgray-800">
            Stock: {product.quantity} items available
          </div>
        </div>

        {/* Right Col: Product Info & Order Trigger */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <span className="badge-tag bg-sage-50 text-sage-dark font-bold border border-sage-200">
              {product.category_name || 'Handmade Goods'}
            </span>

            <h1 className="font-heading text-3xl font-bold text-warmgray-900 mt-2">
              {product.title}
            </h1>

            <Link to={`/providers/${product.provider}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-warmgray-600 mt-2 hover:text-sage">
              <span>Made with love by <strong>{product.provider_name}</strong></span>
              <ShieldCheck className="w-4 h-4 text-sage" />
            </Link>

            <div className="mt-4 pt-4 border-t border-warmgray-100">
              <span className="text-xs text-warmgray-400 font-semibold block">Price</span>
              <span className="font-heading text-4xl font-black text-warmgray-900">
                ₹{Math.round(product.price)}
              </span>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-heading text-sm font-bold text-warmgray-900">Product Description</h3>
              <p className="text-xs text-warmgray-600 leading-relaxed">
                {product.description || 'Authentic, hygienic, and handcrafted item prepared with traditional family recipes and heritage care.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-warmgray-100">
            <button
              onClick={() => setIsOrderOpen(true)}
              className="w-full btn-secondary text-sm font-bold !py-3.5 flex items-center justify-center gap-2 shadow-warm-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              Order This Handmade Item
            </button>
            <p className="text-[11px] text-center text-warmgray-500 font-medium">
              🛡️ Pay after receipt or delivery confirmation
            </p>
          </div>
        </div>

      </div>

      {/* Provider Credentials */}
      <div className="card-surface p-6">
        <h3 className="font-heading text-lg font-bold text-warmgray-900 mb-4">Artisan Verification & Trust</h3>
        <SkillPassportBadge trustScore={95} />
      </div>

      <OrderModal
        product={product}
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
      />
    </div>
  );
};
