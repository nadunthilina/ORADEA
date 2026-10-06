import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Sri Lankan foods ORADEA",
  description: "Authentic Taste of Sri Lanka",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased bg-gray-100">
      <body className="min-h-full flex flex-col bg-gray-100 text-gray-900">
        <div className="max-w-md mx-auto w-full bg-white min-h-screen relative shadow-2xl flex flex-col">
          <div className="flex-1 pb-20">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
