import React, { useState, useEffect } from 'react';
import { getProviders, getCategories } from '../../api/client';
import { ProviderCard } from '../../components/marketplace/ProviderCard';
import { ProviderFilterPanel } from '../../components/marketplace/ProviderFilterPanel';
import { Award, ShieldCheck } from 'lucide-react';

export const ProvidersPage = () => {
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    skill: '',
    category: '',
    language: '',
    verified: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.skill) params.skill = filters.skill;
      if (filters.category) params.category = filters.category;
      if (filters.language) params.language = filters.language;
      if (filters.verified) params.verified = filters.verified;

      const [provRes, catRes] = await Promise.all([
        getProviders(params),
        getCategories()
      ]);
      setProviders(provRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      skill: '',
      category: '',
      language: '',
      verified: ''
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DCEAF4] shadow-sm space-y-2">
        <span className="badge-tag bg-[#EAF5FC] text-[#1F6FB2] font-bold">
          Decades of Practical Mastery
        </span>
        <h1 className="page-title text-3xl sm:text-4xl font-extrabold text-[#163A5F] tracking-tight">
          Verified Homemakers & Elder Artisans
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed font-medium">
          Discover certified homemakers and elders in Chennai carrying decades of authentic Indian home cooking, tailoring, tutoring, and handcrafted skills.
        </p>
      </div>

      {/* Main Grid: Lekhs-Style Filter Sidebar + Providers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <ProviderFilterPanel
            filters={filters}
            onChange={setFilters}
            categories={categories}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Providers Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-16 font-bold text-saffron">Loading verified profiles...</div>
          ) : providers.length === 0 ? (
            <div className="card-surface p-12 text-center border border-warmgray-200">
              <span className="text-4xl">👵🏽</span>
              <h3 className="font-heading font-bold text-lg text-warmgray-900 mt-2">No Artisans Found</h3>
              <p className="text-xs text-warmgray-500 mt-1">Try clearing your filters or choosing another craft.</p>
              <button onClick={handleResetFilters} className="btn-primary text-xs !py-2 !px-4 mt-4">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
