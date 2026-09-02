import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Lock, User, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('demo_customer');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login({ username, password });
    if (result.success) {
      showToast(`Welcome back, ${result.user.first_name || result.user.username}!`, 'success');
      if (result.user.role === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else if (result.user.role === 'ADMIN' || result.user.is_staff) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      showToast(result.error || 'Login failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 card-surface shadow-warm-xl border border-[#DCEAF4] bg-white">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#EAF5FC] text-[#3F9BE8] flex items-center justify-center mx-auto"><Lock className="w-7 h-7" /></div>
        <h2 className="page-title text-2xl font-bold mt-3 text-[#163A5F]">Sign in to SilverHands</h2>
        <p className="text-xs text-[#64748B] mt-1">Empowering golden age artisans and customers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1">Username</label>
          <div className="relative">
            <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:ring-2 focus:ring-[#3F9BE8]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCEAF4] bg-white text-sm font-medium focus:ring-2 focus:ring-[#3F9BE8]"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary !py-3 font-bold mt-2 flex items-center justify-center gap-2">
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Demo Credentials Quick-Click Box */}
      <div className="mt-8 p-4 bg-[#F5F9FC] rounded-2xl border border-[#DCEAF4] text-xs">
        <span className="font-bold text-[#163A5F] block mb-2">⚡ Quick Demo Logins:</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setUsername('demo_customer'); setPassword('demo1234'); }}
            className="p-2 rounded-xl bg-white border border-[#DCEAF4] text-left hover:border-[#3F9BE8] transition-colors"
          >
            <span className="font-bold block text-[#163A5F]">Customer</span>
            <span className="text-[10px] text-[#64748B]">demo_customer</span>
          </button>
          <button
            type="button"
            onClick={() => { setUsername('lakshmi'); setPassword('demo1234'); }}
            className="p-2 rounded-xl bg-white border border-[#DCEAF4] text-left hover:border-[#3F9BE8] transition-colors"
          >
            <span className="font-bold block text-[#163A5F]">Provider (Cook)</span>
            <span className="text-[10px] text-[#64748B]">lakshmi</span>
          </button>
          <button
            type="button"
            onClick={() => { setUsername('meena'); setPassword('demo1234'); }}
            className="p-2 rounded-xl bg-white border border-[#DCEAF4] text-left hover:border-[#3F9BE8] transition-colors"
          >
            <span className="font-bold block text-[#163A5F]">Provider (Tailor)</span>
            <span className="text-[10px] text-[#64748B]">meena</span>
          </button>
          <button
            type="button"
            onClick={() => { setUsername('admin'); setPassword('admin123'); }}
            className="p-2 rounded-xl bg-white border border-[#DCEAF4] text-left hover:border-[#3F9BE8] transition-colors"
          >
            <span className="font-bold block text-[#1F6FB2]">Admin</span>
            <span className="text-[10px] text-[#64748B]">admin / admin123</span>
          </button>
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-[#64748B]">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-[#3F9BE8] hover:text-[#1F6FB2] hover:underline transition-colors">
          Join SilverHands
        </Link>
      </div>
    </div>
  );
};
