import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { createReport } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';

export const ReportModal = ({ isOpen, onClose, reportedUserId, reportedServiceId }) => {
  const { showToast } = useNotifications();
  const [category, setCategory] = useState('UNSAFE_MESSAGE');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createReport({
        reported_user: reportedUserId,
        reported_service: reportedServiceId,
        category,
        description,
      });
      showToast('Safety report submitted to admin moderators', 'success');
      onClose();
    } catch {
      showToast('Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-warm-xl p-6 border border-warmgray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold text-red-600 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Report Suspicious Activity
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Reason for Concern</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm font-medium"
            >
              <option value="UNSAFE_MESSAGE">Unsafe Payment / External Scam Request</option>
              <option value="SUSPICIOUS_USER">Suspicious User Profile</option>
              <option value="INAPPROPRIATE_LISTING">Inappropriate Service Listing</option>
              <option value="ABUSIVE_BEHAVIOR">Abusive or Disrespectful Behavior</option>
              <option value="OTHER">Other Platform Concern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 mb-1">Details</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened so moderators can take action..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-warmgray-300 bg-cream-50 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-sm">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
