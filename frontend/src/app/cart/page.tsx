'use client';

import { useCartStore } from '@/store/cartStore';
import { ArrowLeft, Trash2, Plus, Minus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotals } = useCartStore();
  const { subtotal, deliveryFee, platformFee, total } = getTotals();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-4 py-4 flex items-center shadow-sm">
          <Link href="/" className="p-2 -ml-2 mr-2 active:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">My Cart</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link 
            href="/"
            className="bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-200 active:scale-95 transition-transform"
          >
            Start Shopping
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
          <h1 className="text-xl font-bold">My Cart</h1>
        </div>
        <span className="text-sm font-semibold text-gray-500">{items.length} items</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -100 }}
                className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4"
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                
                <div className="flex-1 flex flex-col py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight pr-2">
                      {item.title}
                    </h3>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1 -mr-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mb-auto">{item.unit}</div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900">
                      Lei {(item.price * item.quantity).toFixed(2)}
                    </span>
                    
                    <div className="flex items-center bg-gray-100 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-gray-600 hover:text-gray-900"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-gray-600 hover:text-gray-900"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">Lei {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee (Oradea)</span>
              <span className="font-medium">Lei {deliveryFee.toFixed(2)}</span>
            </div>
            {platformFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee</span>
                <span className="font-medium">Lei {platformFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
              <span className="font-bold text-gray-900 text-base">Total Due</span>
              <span className="font-bold text-green-600 text-lg">Lei {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sticky bottom-0">
        <Link 
          href="/checkout"
          className="w-full bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-between px-6 shadow-lg shadow-green-200 active:scale-[0.98] transition-transform"
        >
          <span>Checkout</span>
          <div className="flex items-center">
            <span className="mr-2">Lei {total.toFixed(2)}</span>
            <ChevronRight size={20} />
          </div>
        </Link>
      </div>
    </div>
  );
}
