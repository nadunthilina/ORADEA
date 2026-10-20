'use client';

import { Heart, Plus, Minus, Ban } from 'lucide-react';
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

  const isAvailable = product.isAvailable !== false;
  const isFav = isFavorite(product.id);

  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    if (!isAvailable) return;
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
      className={`rounded-2xl border transition-all duration-200 p-4 relative overflow-hidden flex flex-col group ${
        isAvailable 
          ? 'bg-white shadow-sm border-gray-100 hover:shadow-md' 
          : 'bg-gray-100/80 border-gray-200 shadow-none'
      }`}
    >
      {/* Blurred / Unavailable Badge Overlay */}
      {!isAvailable && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-md text-white text-[11px] font-black tracking-wider uppercase shadow-xs">
          <Ban size={12} className="stroke-[2.5]" />
          <span>Unavailable Today</span>
        </div>
      )}

      {/* Heart / Favorite Button */}
      <button
        onClick={() => isFav ? removeFavorite(product.id) : addFavorite(product)}
        className={`absolute top-3 right-3 p-2 rounded-full shadow-sm z-20 transition-colors ${
          isAvailable ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/80 hover:bg-white'
        }`}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          size={18}
          className={`${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
        />
      </button>

      {/* Card Body - visually blurred and subdued when unavailable */}
      <div className={`flex flex-col flex-1 pr-8 transition-all ${
        !isAvailable ? 'filter blur-[1px] opacity-60 select-none pt-7' : ''
      }`}>
        <div className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">{product.category}</div>
        <h3 className="font-black text-lg text-gray-900 leading-tight mb-2">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className={`text-lg font-bold ${isAvailable ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
              Lei {product.price.toFixed(2)}
            </span>
          </div>

          {isAvailable ? (
            quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 transition-colors active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px] cursor-pointer shadow-xs"
                title="Add to Cart"
              >
                <Plus size={20} />
              </button>
            ) : (
              <div className="flex items-center bg-gray-100 rounded-xl">
                <button
                  onClick={handleRemove}
                  className="p-2 text-gray-700 hover:text-green-600 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus size={18} />
                </button>
                <span className="w-6 text-center font-medium text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={handleAdd}
                  className="p-2 text-gray-700 hover:text-green-600 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus size={18} />
                </button>
              </div>
            )
          ) : (
            <button
              disabled
              aria-disabled="true"
              className="bg-gray-200 text-gray-500 font-bold text-xs px-3 py-2 rounded-xl cursor-not-allowed select-none flex items-center gap-1.5 border border-gray-300"
              title="This item is currently unavailable to order"
            >
              <Ban size={13} />
              <span>Out of Stock</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
