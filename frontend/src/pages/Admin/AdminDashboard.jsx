import React, { useState, useEffect } from 'react';
import { getAdminStats, getAdminUsers, toggleUserSuspend, getReports } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { ShieldAlert, Users, BookOpen, AlertTriangle, CheckCircle, Ban } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotifications();

  const loadData = async () => {
    try {
      const [stRes, usRes, rpRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getReports()
      ]);
      setStats(stRes.data);
      setUsers(usRes.data || []);
      setReports(rpRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspend = async (userId) => {
    try {
      await toggleUserSuspend(userId);
      showToast('User status updated', 'success');
      loadData();
    } catch {
      showToast('Action failed', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="badge-tag bg-red-100 text-red-700 font-bold">Platform Safety & Moderation</span>
        <h1 className="page-title text-3xl sm:text-4xl text-warmgray-900 mt-1">SilverHands Admin Portal</h1>
        <p className="text-xs sm:text-sm text-warmgray-500">
          Live statistics, user safety enforcement, and reported content management
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-surface p-5 border-l-4 border-l-saffron">
          <span className="text-xs font-bold text-warmgray-500">Total Users</span>
          <span className="font-heading text-3xl font-black text-warmgray-900 block mt-1">{stats?.total_users || 6}</span>
        </div>
        <div className="card-surface p-5 border-l-4 border-l-sage">
          <span className="text-xs font-bold text-warmgray-500">Verified Providers</span>
          <span className="font-heading text-3xl font-black text-sage-dark block mt-1">{stats?.total_providers || 4}</span>
        </div>
        <div className="card-surface p-5 border-l-4 border-l-blue-500">
          <span className="text-xs font-bold text-warmgray-500">Total Services</span>
          <span className="font-heading text-3xl font-black text-blue-600 block mt-1">{stats?.total_services || 8}</span>
        </div>
        <div className="card-surface p-5 border-l-4 border-l-red-500">
          <span className="text-xs font-bold text-warmgray-500">Safety Reports</span>
          <span className="font-heading text-3xl font-black text-red-600 block mt-1">{stats?.pending_reports || reports.length}</span>
        </div>
      </div>

      {/* Reported Safety Incidents */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-warmgray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Community Safety Reports
        </h2>
        {reports.length === 0 ? (
          <div className="card-surface p-6 text-center text-xs text-warmgray-500">
            No pending safety reports. Community is healthy.
          </div>
        ) : (
          <div className="card-surface overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 font-bold text-warmgray-700 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgray-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-cream-50">
                    <td className="p-4 font-bold text-red-600">{r.category}</td>
                    <td className="p-4 max-w-md">{r.description}</td>
                    <td className="p-4 font-semibold">{r.reporter_name || 'User'}</td>
                    <td className="p-4"><span className="badge-tag bg-amber-50 text-amber-800">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* User Moderation List */}
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-bold text-warmgray-900">User Moderation</h2>
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 font-bold text-warmgray-700 uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-cream-50">
                  <td className="p-4 font-bold text-warmgray-900">
                    {u.get_full_name || u.username}
                    <span className="block text-[10px] text-warmgray-400 font-normal">{u.email}</span>
                  </td>
                  <td className="p-4"><span className="badge-tag bg-cream-200 text-warmgray-800">{u.role}</span></td>
                  <td className="p-4">
                    {u.is_suspended ? (
                      <span className="badge-tag bg-red-100 text-red-700 font-bold">Suspended</span>
                    ) : (
                      <span className="badge-tag bg-sage-50 text-sage-dark font-bold">Active</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleSuspend(u.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                        u.is_suspended
                          ? 'bg-sage text-white hover:bg-sage-dark'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {u.is_suspended ? 'Reactivate User' : 'Suspend User'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
