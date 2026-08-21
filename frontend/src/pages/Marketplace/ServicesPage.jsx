import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getServices, getCategories } from '../../api/client';
import { ServiceCard } from '../../components/marketplace/ServiceCard';
import { BookingModal } from '../../components/marketplace/BookingModal';
import { ServiceFilterPanel } from '../../components/marketplace/ServiceFilterPanel';
import { Sparkles, SlidersHorizontal } from 'lucide-react';

export const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    min_price: '',
    max_price: ''
  });

  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;

      const [srvRes, catRes] = await Promise.all([
        getServices(params),
        getCategories()
      ]);
      setServices(srvRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      category: '',
      search: '',
      min_price: '',
      max_price: ''
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="page-title text-3xl sm:text-4xl">Traditional Home Services</h1>
        <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
          Book verified Indian homemakers, senior cooks, tailors, tutors, gardeners, and artisans
        </p>
      </div>

      {/* Main Grid: Lekhs-Style Filter Sidebar + Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <ServiceFilterPanel
            filters={filters}
            onChange={setFilters}
            categories={categories}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Services Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-16 font-bold text-saffron">Loading traditional services...</div>
          ) : services.length === 0 ? (
            <div className="card-surface p-12 text-center border border-warmgray-200">
              <span className="text-4xl">🔍</span>
              <h3 className="font-heading font-bold text-lg text-warmgray-900 mt-2">No Services Found</h3>
              <p className="text-xs text-warmgray-500 mt-1">Try resetting your filters or searching for another craft.</p>
              <button onClick={handleResetFilters} className="btn-primary text-xs !py-2 !px-4 mt-4">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={(s) => setSelectedService(s)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Booking Modal */}
      <BookingModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />

    </div>
  );
};
