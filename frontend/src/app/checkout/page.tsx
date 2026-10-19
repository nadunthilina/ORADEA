'use client';

import { ArrowLeft, MapPin, CreditCard, Clock, CheckCircle2, ChevronRight, Map, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useState, useEffect } from 'react';

export default function CheckoutPage() {
  const { getTotals, clearCart } = useCartStore();
  const { total } = getTotals();
  const { currentLocation, openMapPicker } = useLocationStore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedOrderData, setConfirmedOrderData] = useState<any>(null);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      
      const selectedAddress = currentLocation?.address || user?.address || 'Piața Unirii, Oradea';
      const orderLocation = currentLocation?.lat && currentLocation?.lng ? {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      } : {
        lat: 47.0561,
        lng: 21.9379
      };

      const orderData = {
        customerId: user?.id || 'guest',
        customerName: user?.fullName || 'Guest User', 
        customerPhone: user?.mobile || '+40 74 000 0000',
        deliveryAddress: selectedAddress,
        deliveryLocation: orderLocation,
        items: useCartStore.getState().items,
        subtotal: getTotals().subtotal,
        deliveryFee: getTotals().deliveryFee,
        totalDue: getTotals().total,
        paymentMethod: 'Cash on Delivery'
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const data = await res.json();
      if (data.success) { 
        setIsPlacingOrder(false);
        setOrderPlaced(true);
        setConfirmedOrderId(data.orderId);
        setConfirmedOrderData(orderData);
        clearCart();
      } else {
        alert(data.error || 'Failed to place order');
        setIsPlacingOrder(false);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center p-6 text-center text-white pb-safe">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-green-100 mb-8 max-w-[280px]">
          Your order has been placed successfully and is being processed.
        </p>
        
        <div className="bg-white/10 rounded-2xl p-4 w-full mb-8 backdrop-blur-sm text-left text-sm space-y-3">
          <div className="flex justify-between items-center border-b border-white/20 pb-2">
            <span className="text-green-100">Order Number</span>
            <span className="font-bold">{confirmedOrderId || '#ORD-PENDING'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-100">Customer Name</span>
            <span className="font-bold">{confirmedOrderData?.customerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-100">Phone Number</span>
            <span className="font-bold">{confirmedOrderData?.customerPhone}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-100">Delivery Address</span>
            <span className="font-bold">{confirmedOrderData?.deliveryAddress}</span>
          </div>
          
          <div className="pt-2 border-t border-white/20 mt-2">
            <span className="text-green-100 block mb-1">Items Ordered:</span>
            {confirmedOrderData?.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-xs opacity-90">
                <span>{item.quantity}x {item.title}</span>
                <span>Lei {item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <Link 
          href="/"
          className="w-full bg-white text-green-600 font-bold py-4 rounded-xl active:scale-[0.98] transition-transform"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-40">
        <Link href="/cart" className="p-2 -ml-2 mr-2 active:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Checkout</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center">
              <MapPin size={18} className="mr-2 text-green-600" />
              Delivery Address (Oradea)
            </h2>
            <button 
              onClick={openMapPicker} 
              type="button"
              className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 active:scale-95 transition-all flex items-center"
            >
              <Map size={13} className="mr-1" />
              Pick on Map
            </button>
          </div>
          <div className="text-gray-600 text-sm pl-6 border-l-2 border-green-500 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">{user?.fullName || 'Guest User'}</p>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center">
                <ShieldCheck size={12} className="mr-1" /> Oradea Zone
              </span>
            </div>
            <p className="text-gray-800 font-medium">{currentLocation?.address || user?.address || 'Piața Unirii, Oradea'}</p>
            {currentLocation?.lat && (
              <p className="text-[11px] text-gray-400">
                GPS: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)} (OpenStreetMap)
              </p>
            )}
            <p className="text-xs font-medium text-gray-500">{user?.mobile || '+40 74 000 0000'}</p>
          </div>

          <button
            onClick={openMapPicker}
            type="button"
            className="w-full mt-3 py-2 px-3 border border-dashed border-green-300 rounded-xl bg-green-50/50 hover:bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center transition-colors"
          >
            <Map size={14} className="mr-1.5" />
            Change location on Oradea map
          </button>
        </div>


      </div>

      {/* Fixed Bottom Action Bar */}
      <div 
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        className="fixed left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md p-3 px-4 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-40"
      >
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full flex flex-col items-center justify-center shadow-lg shadow-green-200 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {isPlacingOrder ? (
            <span className="flex items-center text-sm font-semibold">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing Order...
            </span>
          ) : (
            <>
              <span className="text-base font-bold leading-tight">Place Order</span>
              <span className="text-xs font-medium text-green-100 leading-tight">Lei {total.toFixed(2)} • Cash on Delivery</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
