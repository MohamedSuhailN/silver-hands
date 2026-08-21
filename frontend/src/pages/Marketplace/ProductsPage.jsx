import React, { useState, useEffect } from 'react';
import { getProducts, getCategories } from '../../api/client';
import { ProductCard } from '../../components/marketplace/ProductCard';
import { OrderModal } from '../../components/marketplace/OrderModal';
import { FilterPanel } from '../../components/marketplace/FilterPanel';
import { ShoppingBag, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    min_price: '',
    max_price: '',
    ordering: '-created_at'
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [prdRes, catRes] = await Promise.all([
        getProducts(filters),
        getCategories()
      ]);
      setProducts(prdRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      min_price: '',
      max_price: '',
      ordering: '-created_at'
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge-tag bg-sage text-white font-bold mb-1">Handmade Marketplace</span>
          <h1 className="page-title text-3xl sm:text-4xl">Handmade Goods & Homemade Delicacies</h1>
          <p className="text-xs sm:text-sm text-warmgray-500 mt-1">
            Fresh homemade pickles, snacks, pure vermicompost, and eco crafts prepared with traditional care by homemakers and elders
          </p>
        </div>
      </div>

      {/* Main Content Layout with Lekhs-style Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <FilterPanel
              filters={filters}
              onChange={(newFilters) => setFilters(newFilters)}
              categories={categories}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* Right Column: Product Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex items-center justify-between text-xs font-bold text-warmgray-600 bg-cream-100 px-4 py-2.5 rounded-2xl border border-warmgray-200">
            <span>Showing {products.length} Handmade Products</span>
            {filters.category && <span>Filtered by Category: {filters.category}</span>}
          </div>

          {loading ? (
            <div className="text-center py-16 font-bold text-sage">Loading marketplace products...</div>
          ) : products.length === 0 ? (
            <div className="card-surface p-12 text-center max-w-md mx-auto my-8">
              <span className="text-4xl">🛍️</span>
              <h3 className="font-heading font-bold text-lg text-warmgray-900 mt-2">No Products Match Your Filters</h3>
              <p className="text-xs text-warmgray-500 mt-1">Try resetting the filters to see all available goods.</p>
              <button
                onClick={handleResetFilters}
                className="btn-outline text-xs mt-4"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOrder={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          )}

        </div>

      </div>

      <OrderModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
