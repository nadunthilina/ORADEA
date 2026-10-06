'use client';

import { TopBar } from '@/components/layout/TopBar';
import { ProductCard } from '@/components/product/ProductCard';
import { CATEGORIES, MOCK_PRODUCTS } from '@/data/mockData';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuth');
    if (!isAuth) {
      router.push('/auth');
    } else {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.fullName) {
        setUserName(user.fullName.split(' ')[0]);
      }
    }
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting('Good morning');
    } else if (currentHour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, [router]);

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

  const popularProducts = products.slice(0, 5); // Just take the first 5 for now

  // Dynamically compute categories from available products
  const dynamicCategories = Array.from(new Set(products.map(p => p.category))).map((catName: any, index) => {
    const existing = CATEGORIES.find(c => c.name === catName);
    return existing || {
      id: `dyn-cat-${index}`,
      name: catName,
      icon: 'Utensils',
      color: 'bg-green-100 text-green-700'
    };
  });

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="bg-white px-4 pt-2 pb-5 shadow-sm rounded-b-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {greeting}{userName ? `, ${userName}` : ''}! 👋
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            What would you like to order today?
          </p>
          
          <Link href="/browse" className="block w-full">
            <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-200">
              <Search className="text-gray-400 mr-2" size={20} />
              <span className="text-gray-500">Search for kottu, rice...</span>
            </div>
          </Link>
        </div>

        <div className="mt-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Categories</h2>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 snap-x">
            {dynamicCategories.map((cat) => (
              <div 
                key={cat.id}
                className={`snap-center shrink-0 w-24 h-24 rounded-2xl ${cat.color} flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform`}
              >
                <div className="bg-white/30 p-2 rounded-full mb-2 backdrop-blur-sm">
                  <span className="font-bold text-lg">{cat.name.charAt(0)}</span>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight px-1">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Popular Now</h2>
          </div>
          <div className="flex flex-col gap-3">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
