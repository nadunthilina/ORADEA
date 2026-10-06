import { useEffect, useState } from 'react';

export default function App() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@kottu.com' && password === 'admin123') { 
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid email or password');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    // Poll for new orders every 5 seconds
    const fetchOrders = () => {
      fetch('http://localhost:5000/api/orders')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrders(data.orders);
          }
        })
        .catch(err => console.error(err));
    };
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const printKOT = (order: any) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: monospace; width: 80mm; margin: 0; padding: 10px; font-size: 14px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold">*** KITCHEN ORDER TICKET ***</div>
          <div>ORDER ID: ${order.orderId}</div>
          <div>DATE: ${new Date(order.createdAt).toLocaleString()}</div>
          <div class="divider"></div>
          <div>QTY   ITEM DESCRIPTION</div>
          <div class="divider"></div>
          ${order.items.map((i: any) => `
            <div> ${i.quantity}x   ${i.title}</div>
          `).join('')}
          <div class="divider"></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const printReceipt = (order: any) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: monospace; width: 80mm; margin: 0; padding: 10px; font-size: 14px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .flex-between { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold">KOTTU EXPRESS / ORADEA</div>
          <div class="text-center">Hot, Spicy & Freshly Made</div>
          <div class="text-center">WhatsApp: +40 72 301 7320</div>
          <div class="divider"></div>
          <div>ORDER ID : ${order.orderId}</div>
          <div>DATE     : ${new Date(order.createdAt).toLocaleString()}</div>
          <div>CUSTOMER : ${order.customerName}</div>
          <div>PHONE    : ${order.customerPhone || 'N/A'}</div>
          <div>ADDRESS  : ${order.deliveryAddress}</div>
          <div class="divider"></div>
          <div class="flex-between"><span>ITEM</span><span>QTY</span><span>PRICE</span></div>
          <div class="divider"></div>
          ${order.items.map((i: any) => `
            <div class="flex-between"><span>${i.title}</span><span>${i.quantity}</span><span>Lei ${i.price}</span></div>
          `).join('')}
          <div class="divider"></div>
          <div class="flex-between"><span>SUBTOTAL</span><span>Lei ${order.subtotal}</span></div>
          <div class="flex-between"><span>DELIVERY FEE</span><span>Lei ${order.deliveryFee}</span></div>
          <div class="divider"></div>
          <div class="flex-between font-bold"><span>TOTAL DUE</span><span>Lei ${order.totalDue}</span></div>
          <div>PAYMENT  : ${order.paymentMethod}</div>
          <div class="divider"></div>
          <div class="text-center">Thank you for your order!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full">
          <h1 className="text-2xl font-black mb-1 text-center text-gray-900 tracking-tight">Kottu Express</h1>
          <p className="text-sm text-gray-500 mb-8 text-center font-medium">Admin / POS Login</p>
          
          <form onSubmit={handleLogin}>
            {error && <div className="mb-4 text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl">{error}</div>}
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                placeholder="admin@kottu.com"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Admin Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
              Access POS Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1 text-gray-900 tracking-tight">Kottu Express POS</h1>
            <p className="text-gray-500 font-medium">Real-time Kitchen Dashboard & Receipt Printing</p>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('adminAuth'); setIsAuthenticated(false); }}
            className="text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 px-4 py-2 rounded-xl"
          >
            Log Out
          </button>
        </div>
        
        <div className="grid gap-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-xl tracking-tight text-gray-900">{order.orderId}</h3>
                  <p className="text-sm text-gray-500 font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="text-sm mt-3 font-medium"><span className="font-bold text-gray-900">Customer:</span> {order.customerName}</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">{order.orderStatus}</span>
                  <p className="font-black text-3xl mt-4 text-green-600">Lei {order.totalDue}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => printKOT(order)}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl text-sm font-bold flex-1 transition-colors cursor-pointer"
                >
                  🖨️ Print KOT (Kitchen)
                </button>
                <button 
                  onClick={() => printReceipt(order)}
                  className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 px-6 py-3 rounded-xl text-sm font-bold flex-1 transition-colors cursor-pointer"
                >
                  🧾 Print Receipt (Customer)
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">No orders received yet today. Waiting for customers to place orders...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
