import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wand2 } from 'lucide-react';
import { createService, getCategories, aiGenerateDescription, aiSuggestPrice } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const CreateServiceModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [categories, setCategories] = useState([]);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [pricingUnit, setPricingUnit] = useState('per service');
  const [duration, setDuration] = useState('2 hours');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCategories().then((res) => {
        setCategories(res.data || []);
        if (res.data?.[0]) setCategory(res.data[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAIFill = async () => {
    if (!title.trim()) {
      showToast('Please enter a service title first (e.g. Chettinad Cooking)', 'error');
      return;
    }
    setGeneratingAI(true);
    try {
      const [descRes, priceRes] = await Promise.all([
        aiGenerateDescription({
          name: user?.first_name || 'Artisan',
          skills: [title],
          experience_years: 20,
          tone: 'warm'
        }),
        aiSuggestPrice({
          service: title,
          experience: 20,
          city: 'Chennai'
        })
      ]);

      if (descRes.data.description) setDescription(descRes.data.description);
      if (priceRes.data.recommended_price && !price) setPrice(priceRes.data.recommended_price);
      showToast('AI drafted your description & fair pricing!', 'success');
    } catch {
      showToast('AI suggestion error', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createService({
        title,
        category,
        price: parseFloat(price),
        pricing_unit: pricingUnit,
        duration,
        description,
      });
      showToast('Service published successfully!', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create service', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-warm-xl p-6 border border-warmgray-200">
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="badge-tag bg-saffron text-white font-bold">AI Powered Listing</span>
            <h3 className="font-heading text-xl font-bold text-warmgray-900 mt-1">Publish New Service</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Service Title</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Traditional Mysore Pak & Snack Making"
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
              <button
                type="button"
                onClick={handleAIFill}
                disabled={generatingAI}
                className="px-3.5 py-2 rounded-xl bg-saffron-100 text-saffron-800 text-xs font-bold hover:bg-saffron-200 flex items-center gap-1 shrink-0"
                title="Auto-fill with AI"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{generatingAI ? 'Writing...' : 'AI Auto-Fill'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 800"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Pricing Unit</label>
              <input
                type="text"
                value={pricingUnit}
                onChange={(e) => setPricingUnit(e.target.value)}
                placeholder="per service / per hour"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2 hours"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your authentic experience and offerings..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm !px-6">
              {loading ? 'Publishing...' : 'Publish Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
