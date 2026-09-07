import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Mic, ArrowRight, ShoppingBag, HandHeart } from 'lucide-react';

export const RegisterPage = () => {
  const location = useLocation();
  const voiceData = location.state?.voiceData;
  const extractedName = voiceData?.name?.trim().split(/\s+/) || [];
  const [formData, setFormData] = useState({
    username: voiceData?.username || '',
    email: voiceData?.email || '',
    password: '',
    first_name: extractedName[0] || '',
    last_name: extractedName.slice(1).join(' '),
    phone: '',
    role: location.state?.role || 'CUSTOMER',
    address: voiceData?.location || 'Adyar, Chennai, TN',
    preferred_language: location.state?.language || 'en',
    is_senior: false
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.username || !formData.email || !formData.password) {
      showToast("Username, email, and password are required", "error");
      setLoading(false);
      return;
    }

    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      role: formData.role,
      address: formData.address,
      preferred_language: formData.preferred_language,
      is_senior: formData.is_senior,
      skills: voiceData?.skills || [],
      experience_years: voiceData?.experience_years || undefined
    };

    const result = await register(payload);

    if (result.success) {
      showToast("Registration successful! Welcome to SilverHands.", "success");
      navigate("/");
    } else {
      showToast(result.error || "Registration failed", "error");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto my-12 p-8 card-surface shadow-warm-xl border border-[#DCEAF4] bg-white">
      <div className="text-center mb-6">
        <h2 className="page-title text-2xl font-bold text-[#163A5F]">Join SilverHands</h2>
        <p className="text-xs text-[#64748B] mt-1">Connect with verified homemakers & elders or offer your traditional skills</p>
        
        {/* Voice Assisted Onboarding CTA */}
        <Link
          to="/register-voice"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#EAF5FC] border border-[#3F9BE8]/30 text-[#1F6FB2] text-xs font-bold hover:bg-[#3F9BE8] hover:text-white transition-all"
        >
          <Mic className="w-4 h-4 text-[#3F9BE8]" />
          <span>Need help? Try Voice Guided Registration</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1">I want to register as:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
              className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                formData.role === 'CUSTOMER'
                  ? 'border-[#3F9BE8] bg-[#EAF5FC] text-[#1F6FB2] shadow-sm'
                  : 'border-[#DCEAF4] bg-white text-[#64748B] hover:bg-[#F5F9FC]'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />
              <span>Customer / Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'PROVIDER' })}
              className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                formData.role === 'PROVIDER'
                  ? 'border-[#1F6FB2] bg-[#1F6FB2] text-white shadow-sm'
                  : 'border-[#DCEAF4] bg-white text-[#64748B] hover:bg-[#F5F9FC]'
              }`}
            >
              <HandHeart className="w-5 h-5 mx-auto mb-1" aria-hidden="true" />
              <span>Homemaker / Elder Artisan</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98401 00000"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">Location / Area</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Mylapore, Chennai"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1F2937] mb-1">Preferred Language</label>
            <select
              value={formData.preferred_language}
              onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary !py-3 font-bold mt-4 flex items-center justify-center gap-2">
          <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center mt-6 text-xs text-[#64748B]">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-[#3F9BE8] hover:text-[#1F6FB2] hover:underline transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
};
