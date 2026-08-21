import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { createReview } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';

export const ReviewModal = ({ booking, isOpen, onClose, onSuccess }) => {
  const { showToast } = useNotifications();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createReview({
        booking: booking.id,
        provider: booking.provider,
        service: booking.service,
        rating,
        comment,
      });
      showToast('Thank you for reviewing your elder provider!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-warm-xl overflow-hidden border border-warmgray-200">
        <div className="bg-cream-100 p-6 border-b border-warmgray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-saffron">Rate Experience</span>
            <h3 className="font-heading text-lg font-bold text-warmgray-900">{booking.service_title}</h3>
            <p className="text-xs text-warmgray-600">With {booking.provider_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-warmgray-500 hover:bg-cream-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center">
            <label className="block text-xs font-bold text-warmgray-600 mb-2">How was your service?</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-3xl transition-transform hover:scale-125"
                >
                  <Star className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-warmgray-200'}`} />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-warmgray-700 mt-1 block">
              {rating === 5 ? 'Exceptional Work! 🌟' : rating === 4 ? 'Very Good! 👍' : 'Standard Service'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Write your feedback</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your kind words about the artisan or homemaker..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-200 bg-cream-50 text-sm font-medium focus:ring-2 focus:ring-saffron"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm !px-6">
              {loading ? 'Submitting...' : 'Submit 5★ Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
