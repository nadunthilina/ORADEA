'use client';

import { ArrowLeft, Package, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          window.location.href = '/auth';
          return;
        }
        
        const user = JSON.parse(userStr);
        const res = await fetch(`/api/orders/user/${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe">
      <div className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-40">
        <Link href="/profile" className="p-2 -ml-2 mr-2 active:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Order History</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders.</p>
            <Link 
              href="/"
              className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-sm hover:bg-green-700 transition-colors inline-block"
            >
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{order.orderId}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar size={12} className="mr-1" />
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {order.orderStatus}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.quantity}x {item.title}</span>
                      <span className="text-gray-500">Lei {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Total Amount</span>
                  <span className="font-black text-gray-900">Lei {order.totalDue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
