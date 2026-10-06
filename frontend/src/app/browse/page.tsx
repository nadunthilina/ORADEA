'use client';

import { ProductCard } from '@/components/product/ProductCard';
import { CATEGORIES, MOCK_PRODUCTS } from '@/data/mockData';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BrowsePage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>(MOCK_PRODUCTS);

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Dynamically compute categories from available products
  const dynamicCategories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.tags && product.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      <div className="bg-white px-4 py-3 sticky top-0 z-40 border-b border-gray-100 pb-safe-top">
        <h1 className="text-xl font-bold mb-3">Browse Menu</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500 bg-gray-100 focus:bg-white transition-colors text-sm"
            placeholder="Search for Kottu, Rice, Drinks..."
          />
        </div>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 py-3 px-4 bg-white border-b border-gray-100 snap-x">
        <button
          onClick={() => setActiveCategory('All')}
          className={`snap-center shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
            activeCategory === 'All' 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Items
        </button>
        {dynamicCategories.map((catName: any, index) => (
          <button
            key={index}
            onClick={() => setActiveCategory(catName)}
            className={`snap-center shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeCategory === catName
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {catName}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            No items found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
