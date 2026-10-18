'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import OradeaMapModal from '@/components/map/OradeaMapModal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <main className="min-h-screen w-full bg-[#f8fafc] text-slate-900">
        {children}
      </main>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full bg-white min-h-screen relative shadow-2xl flex flex-col">
      <div className="flex-1 pb-20">
        {children}
      </div>
      <BottomNav />
      <OradeaMapModal />
    </div>
  );
}
