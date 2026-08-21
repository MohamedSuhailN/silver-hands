import React, { useState, useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { createProduct, getCategories } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';

export const CreateProductModal = ({ isOpen, onClose, onCreated }) => {
  const { showToast } = useNotifications();
  const [categories, setCategories] = useState([]);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCategories().then((res) => {
        setCategories(res.data || []);
        if (res.data?.[0]) setCategory(res.data[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProduct({
        title,
        category,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        description,
      });
      showToast('Handmade product listed in marketplace successfully!', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to list product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-warm-xl p-6 border border-warmgray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="badge-tag bg-sage text-white font-bold">Sell in Marketplace</span>
            <h3 className="font-heading text-xl font-bold text-warmgray-900 mt-1">List Handmade Product</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Product Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Homemade Mango Thokku Pickle (500g)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
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
                placeholder="e.g. 250"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Stock Quantity Available</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Description & Ingredients</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh homemade ingredients, shelf life, packing details..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-secondary text-sm !px-6 flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              {loading ? 'Listing...' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
