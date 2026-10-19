'use client';

import { Home, Search, Heart, ShoppingBag, User, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';

export function BottomNav() {
  const pathname = usePathname();
  const { items, updateQuantity, getTotals } = useCartStore();
  const { total } = getTotals();
  
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isCart = pathname === '/cart';

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Browse', path: '/browse', icon: Search },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'Cart', path: '/cart', icon: ShoppingBag, badge: cartItemCount },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      {/* On Cart page, show the Image 2 style Action Bar right above the navigation tabs */}
      {isCart && items.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 max-w-md mx-auto flex items-center gap-3 bg-white">
          {/* Stepper on left */}
          {items.length === 1 ? (
            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1.5 border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => updateQuantity(items[0].id, items[0].quantity - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 active:scale-90 transition-transform"
                aria-label="Decrease quantity"
              >
                <Minus size={18} />
              </button>
              <span className="w-8 text-center font-bold text-gray-900 text-base select-none">
                {items[0].quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(items[0].id, items[0].quantity + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 active:scale-90 transition-transform"
                aria-label="Increase quantity"
              >
                <Plus size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2.5 text-xs font-bold text-gray-800 border border-gray-200 shadow-sm shrink-0">
              <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</span>
            </div>
          )}

          {/* Checkout Button on right */}
          <Link 
            href="/checkout"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full py-2.5 px-6 flex flex-col items-center justify-center font-bold shadow-lg shadow-green-200 active:scale-[0.98] transition-all"
          >
            <span className="text-base font-bold leading-tight">Checkout</span>
            <span className="text-xs font-medium text-green-100 leading-tight">Lei {total.toFixed(2)}</span>
          </Link>
        </div>
      )}

      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={(e) => {
                if (item.path !== '/') {
                  const isAuth = localStorage.getItem('isAuth') === 'true';
                  if (!isAuth) {
                    e.preventDefault();
                    window.location.href = '/auth'; // using window.location to ensure fresh load to auth page
                  }
                }
              }}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] relative p-1 transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 min-w-[16px] flex items-center justify-center rounded-full px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
