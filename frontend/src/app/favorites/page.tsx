'use client';

import { useUserFavorites } from '@/store/favoriteStore';
import { ProductCard } from '@/components/product/ProductCard';
import { ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const { favorites } = useUserFavorites();

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-40">
          <Link href="/" className="p-2 -ml-2 mr-2 active:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Favorites</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Heart size={32} className="text-red-400 fill-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-8">You haven't added any items to your favorites. Start exploring our menu!</p>
          <Link 
            href="/browse"
            className="bg-gray-900 text-white font-bold py-3 px-8 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center">
          <Link href="/" className="p-2 -ml-2 mr-2 active:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Favorites</h1>
        </div>
        <span className="text-sm font-semibold text-gray-500">{favorites.length} items</span>
      </div>

      <div className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
