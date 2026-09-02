import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getBookings, getOrders, getProfile, getServices, getProducts, 
  getProviderMe, updateBookingStatus, updateOrderStatus, getProviderReviewIntelligence,
  getProviderAnalytics, respondOpportunity 
} from '../../api/client';
import { CreateServiceModal } from './CreateServiceModal';
import { CreateProductModal } from './CreateProductModal';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Plus, ShoppingBag, Calendar, CheckCircle2, Clock, 
  Sparkles, Wand2, ArrowRight, Check, X, RefreshCw, UserCheck, Package, Award, Settings, User,
  Star, MessageSquare, TrendingUp, Lightbulb, ThumbsUp, AlertCircle, DollarSign, Target, Radar,
  MapPin, Scissors, Truck
} from 'lucide-react';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState('incoming_bookings');
  
  const [profile, setProfile] = useState(null);
  const [providerMe, setProviderMe] = useState(null);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [myPurchasesBookings, setMyPurchasesBookings] = useState([]);
  const [myPurchasesOrders, setMyPurchasesOrders] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [reviewIntelligence, setReviewIntelligence] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [respondingOppId, setRespondingOppId] = useState(null);
  const [proposalMsg, setProposalMsg] = useState('');
  
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profRes, meRes, inBkRes, inOrdRes, myBkRes, myOrdRes, srvRes, prdRes, revIntRes, anaRes] = await Promise.all([
        getProfile(),
        getProviderMe().catch(() => ({ data: null })),
        getBookings({ view: 'incoming' }),
        getOrders({ view: 'incoming' }),
        getBookings({ view: 'my_requests' }),
        getOrders({ view: 'my_purchases' }),
        getServices({ provider: user.id }),
        getProducts({ provider: user.id }),
        getProviderReviewIntelligence().catch(() => ({ data: null })),
        getProviderAnalytics().catch(() => ({ data: null }))
      ]);

      setProfile(profRes.data);
      setProviderMe(meRes.data);
      setIncomingBookings(inBkRes.data || []);
      setIncomingOrders(inOrdRes.data || []);
      setMyPurchasesBookings(myBkRes.data || []);
      setMyPurchasesOrders(myOrdRes.data || []);
      setMyServices(srvRes.data || []);
      setMyProducts(prdRes.data || []);
      setReviewIntelligence(revIntRes?.data || null);
      setAnalytics(anaRes?.data || null);
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUpdateBooking = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      showToast(`Booking marked as ${newStatus}`, 'success');
      loadData();
    } catch {
      showToast('Failed to update booking status', 'error');
    }
  };

  const handleUpdateOrder = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order marked as ${newStatus}`, 'success');
      loadData();
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Clean Operations Header */}
      <div className="card-surface p-8 bg-gradient-to-r from-cream-100 via-white to-sage-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-saffron-100 text-saffron-700 flex items-center justify-center font-bold text-3xl shadow-warm">
              {user?.first_name?.[0] || <User className="w-8 h-8 text-saffron-700" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-tag bg-sage text-white font-bold">Provider & Homemaker Operations</span>
                <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold">Dual Role Active</span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-warmgray-900 mt-1">
                {user?.get_full_name || user?.first_name || user?.username}'s Business Hub
              </h1>
              <p className="text-xs text-warmgray-600 mt-0.5">
                Manage your service appointments, customer product sales, and live catalog.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/profile"
              className="px-4 py-2.5 rounded-xl bg-white text-warmgray-800 border border-warmgray-300 hover:bg-cream-100 text-xs font-bold flex items-center gap-1.5 shadow-warm-sm"
            >
              <Settings className="w-4 h-4 text-warmgray-600" />
              Profile, Passport & Timings →
            </Link>
            <button
              onClick={() => setIsCreateServiceOpen(true)}
              className="btn-primary text-xs sm:text-sm flex items-center gap-2 shadow-warm"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
            <button
              onClick={() => setIsCreateProductOpen(true)}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-2 shadow-warm"
            >
              <Package className="w-4 h-4" />
              Sell Product
            </button>
          </div>
        </div>

        {/* 4 Operations KPI Cards with Real Data */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-warmgray-200">
          <div className="p-4 bg-white rounded-2xl border border-warmgray-200/80 shadow-warm-sm">
            <span className="text-xs text-warmgray-500 font-semibold block flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Total Earnings
            </span>
            <span className="font-heading text-2xl font-black text-emerald-700">
              ₹{Math.round(analytics?.total_earnings || 0)}
            </span>
            <span className="text-[10px] text-warmgray-400 block mt-0.5">from completed bookings & goods</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-warmgray-200/80 shadow-warm-sm">
            <span className="text-xs text-warmgray-500 font-semibold block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage-dark" /> Completed Jobs
            </span>
            <span className="font-heading text-2xl font-black text-sage-dark">
              {analytics?.completed_jobs ?? (incomingBookings.filter(b => b.status === 'COMPLETED').length + incomingOrders.filter(o => o.status === 'COMPLETED').length)}
            </span>
            <span className="text-[10px] text-warmgray-400 block mt-0.5">verified livelihoods delivered</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-warmgray-200/80 shadow-warm-sm">
            <span className="text-xs text-warmgray-500 font-semibold block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-saffron-dark" /> Pending Requests
            </span>
            <span className="font-heading text-2xl font-black text-saffron-dark">
              {incomingBookings.filter(b => b.status === 'PENDING').length + incomingOrders.filter(o => o.status === 'PENDING').length}
            </span>
            <span className="text-[10px] text-warmgray-400 block mt-0.5">awaiting your response</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-warmgray-200/80 shadow-warm-sm">
            <span className="text-xs text-warmgray-500 font-semibold block flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Trust & Rating
            </span>
            <span className="font-heading text-2xl font-black text-amber-600">
              {profile?.rating || '5.0'}★
            </span>
            <span className="text-[10px] text-warmgray-400 block mt-0.5">({profile?.review_count || 0} reviews • Trust {profile?.trust_score || 95}%)</span>
          </div>
        </div>
      </div>

      {/* Operations Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-warmgray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('opportunity_radar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'opportunity_radar'
              ? 'bg-saffron text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Radar className="w-3.5 h-3.5" /> Opportunity Radar ({analytics?.recommended_opportunities?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('incoming_bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'incoming_bookings'
              ? 'bg-saffron text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" /> Incoming Requests ({incomingBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('incoming_orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'incoming_orders'
              ? 'bg-sage text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Product Orders ({incomingOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('my_listings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'my_listings'
              ? 'bg-warmgray-900 text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> My Listings ({myServices.length} Srv / {myProducts.length} Prd)
        </button>

        <button
          onClick={() => setActiveTab('review_intelligence')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'review_intelligence'
              ? 'bg-amber-600 text-white shadow-warm'
              : 'bg-cream-100 text-warmgray-700 hover:bg-cream-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Review Intelligence
        </button>
      </div>

      {/* Tab: Opportunity Radar */}
      {activeTab === 'opportunity_radar' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-gradient-to-r from-saffron/15 via-cream-100 to-sage/15 p-6 rounded-3xl border border-saffron/20">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-800 flex items-center gap-1.5 mb-1">
                <Radar className="w-4 h-4 text-saffron" /> Live Neighborhood Opportunities
              </span>
              <h2 className="font-heading text-xl font-bold text-warmgray-900">
                Opportunity Radar
              </h2>
              <p className="text-xs text-warmgray-600 mt-1">
                Real customer requests and local gig inquiries matching your verified skills & location.
              </p>
            </div>
            <button onClick={loadData} className="btn-ghost text-xs flex items-center gap-1 bg-white/70">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Radar
            </button>
          </div>

          {(!analytics?.recommended_opportunities || analytics.recommended_opportunities.length === 0) ? (
            <div className="card-surface p-10 text-center space-y-3 border border-dashed border-warmgray-300 rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-saffron/10 text-saffron flex items-center justify-center mx-auto">
                <Radar className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-warmgray-900">Scanning Your Area...</h3>
              <p className="text-xs text-warmgray-600 max-w-md mx-auto">
                No active neighborhood gig requests right now. New customer requirements in your radius will be matched automatically!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.recommended_opportunities.map((opp) => (
                <div key={opp.id} className="card-surface p-5 rounded-3xl border border-warmgray-200 hover:border-saffron/50 transition-all flex flex-col justify-between space-y-3 shadow-warm-sm bg-white">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold text-xs">
                        {opp.category_name || opp.category || 'Local Gig'}
                      </span>
                      <span className="font-heading font-black text-emerald-700 text-sm">
                        ₹{Math.round(opp.budget || 0)}
                      </span>
                    </div>
                    <h4 className="font-heading font-bold text-base text-warmgray-900">{opp.title}</h4>
                    <p className="text-xs text-warmgray-600 mt-1 line-clamp-2">{opp.description}</p>
                    
                    {/* Explainable match reason banner */}
                    <div className="mt-3 p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] font-medium text-amber-900">
                        {opp.recommendation_explanation || "Matched to your verified profile skills."}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {opp.match_reasons?.map((r, rIdx) => (
                        <span key={rIdx} className="text-[10px] bg-warmgray-100 text-warmgray-700 font-medium px-2 py-0.5 rounded-full">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-warmgray-100 flex items-center justify-between">
                    <span className="text-xs text-warmgray-500 font-medium">
                      <MapPin className="w-3 h-3" /> {opp.location_area || opp.location || 'Nearby'}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await respondOpportunity(opp.id, {
                            message: `Hello! I am a verified elder artisan interested in assisting you with '${opp.title}'.`,
                            proposed_price: opp.budget
                          });
                          showToast('Response sent to customer successfully!', 'success');
                          loadData();
                        } catch (err) {
                          showToast('Failed to respond to opportunity', 'error');
                        }
                      }}
                      className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1 shadow-warm"
                    >
                      <span>Accept / Express Interest</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Incoming Service Bookings */}
      {activeTab === 'incoming_bookings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-xl font-bold text-warmgray-900">
              Customer Appointments & Service Bookings
            </h2>
            <button onClick={loadData} className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {incomingBookings.length === 0 ? (
            <div className="card-surface p-10 text-center text-xs text-warmgray-500">
              No service booking requests at the moment. When customers request your services, they will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingBookings.map((b) => (
                <div key={b.id} className="card-surface p-6 border-l-4 border-l-saffron space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge-tag bg-amber-50 text-amber-800 font-bold border border-amber-200 mb-1">
                        {b.status}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-warmgray-900">{b.service_title}</h3>
                      <p className="text-xs text-warmgray-600">Client: {b.customer_name || b.customer_username}</p>
                    </div>
                    <span className="font-heading text-xl font-black text-saffron-dark">₹{Math.round(b.total_price)}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-warmgray-500 border-t border-warmgray-100 pt-3">
                    <span>📅 {b.preferred_date}</span>
                    <span>⏰ {b.preferred_time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.location}</span>
                  </div>

                  {b.message && (
                    <p className="text-xs text-warmgray-700 bg-cream-50 p-2.5 rounded-xl italic">"{b.message}"</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-warmgray-100">
                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'CONFIRMED')}
                        className="btn-primary text-xs !py-1.5 !px-3"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept Request
                      </button>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
                      >
                        Start Service
                      </button>
                    )}
                    {b.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'COMPLETED')}
                        className="btn-secondary text-xs !py-1.5 !px-3"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}
                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, 'CANCELLED')}
                        className="btn-outline text-xs !py-1.5 !px-3 text-red-600 hover:bg-red-50"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Product Orders */}
      {activeTab === 'incoming_orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-xl font-bold text-warmgray-900">
              Customer Product Orders (Handmade Marketplace)
            </h2>
            <button onClick={loadData} className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {incomingOrders.length === 0 ? (
            <div className="card-surface p-10 text-center text-xs text-warmgray-500">
              No product orders received yet. Once customers order your handmade crafts or food items, they will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingOrders.map((o) => (
                <div key={o.id} className="card-surface p-6 border-l-4 border-l-sage space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge-tag bg-sage-50 text-sage-dark font-bold border border-sage-200 mb-1">
                        {o.status}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-warmgray-900">{o.product_title}</h3>
                      <p className="text-xs text-warmgray-600">Buyer: {o.customer_name || o.customer_username} • Qty: {o.quantity}</p>
                    </div>
                    <span className="font-heading text-xl font-black text-sage-dark">₹{Math.round(o.total_price)}</span>
                  </div>

                  {o.message && (
                    <p className="text-xs text-warmgray-700 bg-cream-50 p-2.5 rounded-xl italic">"{o.message}"</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-warmgray-100">
                    {o.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateOrder(o.id, 'SHIPPED')}
                        className="btn-primary text-xs !py-1.5 !px-3"
                      >
                        Mark as Shipped
                      </button>
                    )}
                    {o.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleUpdateOrder(o.id, 'DELIVERED')}
                        className="btn-secondary text-xs !py-1.5 !px-3"
                      >
                        <Truck className="w-3.5 h-3.5" /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Provided Services & Products */}
      {activeTab === 'my_listings' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-warmgray-900">
                My Services ({myServices.length})
              </h3>
              <button
                onClick={() => setIsCreateServiceOpen(true)}
                className="btn-primary text-xs !py-1.5 !px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service
              </button>
            </div>

            {myServices.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic card-surface p-6 text-center">No services listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myServices.map((s) => (
                  <div key={s.id} className="card-surface p-4 space-y-2 border-l-4 border-l-saffron">
                    <span className="badge-tag bg-saffron-50 text-saffron-dark font-bold">{s.category_name}</span>
                    <h4 className="font-heading font-bold text-base text-warmgray-900">{s.title}</h4>
                    <p className="text-xs text-warmgray-600 line-clamp-2">{s.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                      <span className="font-bold text-saffron-dark text-sm">₹{Math.round(s.price)}</span>
                      <span className="text-xs text-warmgray-500">⏳ {s.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-warmgray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-lg font-bold text-warmgray-900">
                My Handmade Products ({myProducts.length})
              </h3>
              <button
                onClick={() => setIsCreateProductOpen(true)}
                className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Sell Product
              </button>
            </div>

            {myProducts.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic card-surface p-6 text-center">No products listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProducts.map((p) => (
                  <div key={p.id} className="card-surface p-4 space-y-2 border-l-4 border-l-sage">
                    <div className="flex justify-between items-start">
                      <span className="badge-tag bg-sage-50 text-sage-dark font-bold">{p.category_name}</span>
                      {p.quantity === 0 ? (
                        <span className="badge-tag bg-red-100 text-red-700 font-bold border border-red-200">
                          SOLD OUT
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-sage-dark bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
                          {p.quantity} in stock
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-base text-warmgray-900">{p.title}</h4>
                    <p className="text-xs text-warmgray-600 line-clamp-2">{p.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-warmgray-100">
                      <span className="font-bold text-sage-dark text-sm">₹{Math.round(p.price)}</span>
                      <span className="text-xs text-warmgray-500">🌿 Handmade</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: My Purchases as Customer */}
      {activeTab === 'my_purchases' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">Services I Booked as Customer ({myPurchasesBookings.length})</h3>
            {myPurchasesBookings.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic">No bookings placed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myPurchasesBookings.map((b) => (
                  <div key={b.id} className="card-surface p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-warmgray-900">{b.service_title}</span>
                      <span className="badge-tag bg-saffron-50 text-saffron-dark">{b.status}</span>
                    </div>
                    <p className="text-xs text-warmgray-500">Provider: {b.provider_name} • ₹{Math.round(b.total_price)}</p>
                    <p className="text-xs text-warmgray-600">📅 {b.preferred_date} ({b.preferred_time})</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-warmgray-200">
            <h3 className="font-heading text-lg font-bold text-warmgray-900">Handmade Products I Ordered ({myPurchasesOrders.length})</h3>
            {myPurchasesOrders.length === 0 ? (
              <p className="text-xs text-warmgray-500 italic">No product purchases yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myPurchasesOrders.map((o) => (
                  <div key={o.id} className="card-surface p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-warmgray-900">{o.product_title}</span>
                      <span className="badge-tag bg-sage-50 text-sage-dark">{o.status}</span>
                    </div>
                    <p className="text-xs text-warmgray-500">Artisan: {o.provider_name} • Qty: {o.quantity} • ₹{Math.round(o.total_price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: AI Review Intelligence */}
      {activeTab === 'review_intelligence' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-[#EAF5FC] p-6 rounded-3xl border border-[#3F9BE8]/30">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F6FB2] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-[#3F9BE8]" /> Elder Artisan Feedback Analytics
              </span>
              <h2 className="font-heading text-xl font-bold text-warmgray-900">
                AI Review Intelligence & Customer Insights
              </h2>
              <p className="text-xs text-warmgray-600 mt-1">
                Synthesized directly from verified customer reviews on your completed bookings.
              </p>
            </div>
            {reviewIntelligence && (
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end font-heading font-black text-2xl text-amber-600">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                  <span>{reviewIntelligence.average_rating || '5.0'}</span>
                </div>
                <span className="text-xs text-warmgray-500">{reviewIntelligence.total_reviews || 0} verified reviews</span>
              </div>
            )}
          </div>

          {!reviewIntelligence || !reviewIntelligence.has_sufficient_data ? (
            <div className="card-surface p-8 text-center space-y-3 border border-dashed border-warmgray-300 rounded-3xl">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-warmgray-900">Building Your Reputation</h3>
              <p className="text-xs text-warmgray-600 max-w-md mx-auto">
                {reviewIntelligence?.message || "Not enough customer feedback yet to generate reliable insights. Complete bookings and encourage customers to leave reviews!"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="card-surface p-6 rounded-3xl border border-warmgray-200 shadow-warm-sm bg-white space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-warmgray-500 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-saffron" /> Overall Reputation Summary
                </h3>
                <p className="text-sm font-medium text-warmgray-800 leading-relaxed">
                  "{reviewIntelligence.summary}"
                </p>
              </div>

              {/* 2-Column Grid: Strengths & Growth Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="card-surface p-6 rounded-3xl border border-emerald-100 bg-emerald-50/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" /> Verified Strengths
                  </h3>
                  <div className="space-y-2">
                    {reviewIntelligence.strengths?.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white/80 p-3 rounded-2xl border border-emerald-100 text-xs font-medium text-warmgray-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvement Areas */}
                <div className="card-surface p-6 rounded-3xl border border-amber-100 bg-amber-50/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" /> Opportunities for Growth
                  </h3>
                  <div className="space-y-2">
                    {reviewIntelligence.improvement_areas?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white/80 p-3 rounded-2xl border border-amber-100 text-xs font-medium text-warmgray-800">
                        <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Preferences & Demand Signals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviewIntelligence.customer_preferences?.length > 0 && (
                  <div className="card-surface p-6 rounded-3xl border border-blue-100 bg-blue-50/30 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      ❤️ What Customers Value Most
                    </h3>
                    <ul className="space-y-1.5 text-xs text-warmgray-700">
                      {reviewIntelligence.customer_preferences.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewIntelligence.demand_signals?.length > 0 && (
                  <div className="card-surface p-6 rounded-3xl border border-purple-100 bg-purple-50/30 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800">
                      📈 Emerging Demand Signals
                    </h3>
                    <ul className="space-y-1.5 text-xs text-warmgray-700">
                      {reviewIntelligence.demand_signals.map((d, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creation Modals */}
      <CreateServiceModal
        isOpen={isCreateServiceOpen}
        onClose={() => setIsCreateServiceOpen(false)}
        onCreated={loadData}
      />
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onCreated={loadData}
      />
    </div>
  );
};
