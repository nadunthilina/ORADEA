'use client';

import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCartStore();
  
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Browse', path: '/browse', icon: Search },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'Cart', path: '/cart', icon: ShoppingBag, badge: cartItemCount },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50">
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
