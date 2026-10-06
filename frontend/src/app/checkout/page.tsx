'use client';

import { ArrowLeft, MapPin, CreditCard, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useState } from 'react';

export default function CheckoutPage() {
  const { getTotals, clearCart } = useCartStore();
  const { total } = getTotals();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedOrderData, setConfirmedOrderData] = useState<any>(null);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const orderData = {
        customerId: user?.id || 'guest',
        customerName: user?.fullName || 'Guest User', 
        customerPhone: user?.mobile || '+94 000 000 000',
        deliveryAddress: user?.address || 'Pickup from Store',
        items: useCartStore.getState().items,
        subtotal: getTotals().subtotal,
        deliveryFee: getTotals().deliveryFee,
        totalDue: getTotals().total,
        paymentMethod: 'Cash on Delivery'
      };

      const res = await fetch('http://localhost:5000/api/orders', {
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
              Delivery Address
            </h2>
            <Link href="/profile" className="text-sm font-semibold text-green-600">Change</Link>
          </div>
          <div className="text-gray-600 text-sm pl-6 border-l-2 border-transparent">
            <p className="font-medium text-gray-900">{user?.fullName || 'Guest User'}</p>
            <p>{user?.address || 'Pickup from Store'}</p>
            <p className="mt-1 font-medium">{user?.mobile || ''}</p>
          </div>
        </div>


      </div>

      <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sticky bottom-0">
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center shadow-lg shadow-green-200 active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {isPlacingOrder ? (
            <span className="flex items-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </span>
          ) : (
            `Place Order • Lei ${total.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}
