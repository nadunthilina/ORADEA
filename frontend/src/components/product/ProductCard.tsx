'use client';

import { Heart, Plus, Minus } from 'lucide-react';
import { Product } from '@/data/mockData';
import { useCartStore } from '@/store/cartStore';
import { useUserFavorites } from '@/store/favoriteStore';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { isFavorite, addFavorite, removeFavorite } = useUserFavorites();

  const isFav = isFavorite(product.id);

  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    if (quantity === 0) {
      addItem(product);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleRemove = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200 p-4 relative"
    >
      <button
        onClick={() => isFav ? removeFavorite(product.id) : addFavorite(product)}
        className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full shadow-sm z-10"
      >
        <Heart
          size={18}
          className={`${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
        />
      </button>

      <div className="flex flex-col flex-1 pr-8">
        <div className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">{product.category}</div>
        <h3 className="font-black text-lg text-gray-900 leading-tight mb-2">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-lg font-bold text-gray-900">
              Lei {product.price.toFixed(2)}
            </span>
          </div>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 transition-colors active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <Plus size={20} />
            </button>
          ) : (
            <div className="flex items-center bg-gray-100 rounded-xl">
              <button
                onClick={handleRemove}
                className="p-2 text-gray-700 hover:text-green-600 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Minus size={18} />
              </button>
              <span className="w-6 text-center font-medium text-gray-900">
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="p-2 text-gray-700 hover:text-green-600 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
