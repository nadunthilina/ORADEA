import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Sri Lankan foods ORADEA",
  description: "Authentic Taste of Sri Lanka",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased bg-gray-100">
      <body className="min-h-full flex flex-col bg-gray-100 text-gray-900">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
