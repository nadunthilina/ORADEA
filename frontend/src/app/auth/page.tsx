'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ fullName: '', email: '', mobile: '', address: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Admin login intercept
    if (isLogin && formData.email === 'admin@kottu.com' && formData.password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      router.push('/admin');
      return;
    }
    
    if (!isLogin) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError('Password must be at least 6 characters and include uppercase, lowercase, numbers, and symbols.');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('isAuth', 'true');
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="flex-1 px-6 py-12 flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="mb-10 mt-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full shadow-lg border-4 border-white/50 bg-orange-100 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.jpeg" 
                alt="Sri Lankan foods ORADEA" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'text-orange-600', 'font-bold', 'text-center', 'p-2');
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = '<span class="text-xs">Logo Here<br/>(Please add logo.jpeg)</span>';
                  }
                }}
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#b58c49] mb-4 font-serif tracking-wide drop-shadow-sm">
            Sri Lankan foods ORADEA
          </h2>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isLogin 
              ? 'Enter your details to access your account' 
              : 'Sign up to start ordering your favorite food'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1 max-w-sm mx-auto w-full">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-medium">📱</span>
                  </div>
                  <input 
                    type="tel" 
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
                    placeholder="+40 74 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-medium">📍</span>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
                    placeholder="Str. Republicii Nr. 12, Ap 4"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={20} className="text-gray-400" />
              </div>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={20} className="text-gray-400" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white transition-colors"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-8 shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ChevronRight size={20} className="ml-2" />}
          </button>
        </form>

        <div className="mt-8 text-center pb-safe">
          <p className="text-gray-500 text-sm font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-green-600 ml-1 hover:text-green-700 hover:underline transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
