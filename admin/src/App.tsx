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
      fetch('/api/orders')
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
    const printWindow = window.open('', '', 'width=350,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>KOT #${order.orderId}</title>
          <style>
            @page {
              size: 48mm auto;
              margin: 0mm;
            }
            @media print {
              html, body {
                width: 48mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, 'Noto Sans Sinhala', monospace;
              width: 48mm;
              max-width: 48mm;
              margin: 0 auto;
              padding: 4px 1.5mm 15px 1.5mm;
              font-size: 9.5px;
              line-height: 1.25;
              color: #000;
              background: #fff;
              word-break: break-word;
            }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 9.5px;
              margin: 3px 0;
            }
            .items-table th { padding: 2px 0; font-size: 9px; }
            .items-table td { padding: 2px 0; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold" style="font-size: 11.5px;">*** KITCHEN ORDER TICKET ***</div>
          <div class="divider"></div>
          <div><b>ORDER ID :</b> #${order.orderId}</div>
          <div><b>DATE     :</b> ${new Date(order.createdAt).toLocaleString()}</div>
          ${order.customerName ? `<div><b>CUSTOMER :</b> ${order.customerName}</div>` : ''}
          <div class="divider"></div>
          <table class="items-table">
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: center; width: 22%;">QTY</th>
                <th style="text-align: left; width: 78%;">ITEM</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((i: any) => `
                <tr>
                  <td style="text-align: center; font-size: 11px; font-weight: bold; padding-right: 3px;">${i.quantity}x</td>
                  <td style="font-size: 10px; font-weight: bold; word-break: break-word;">${i.title}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="height: 15px;"></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const printReceipt = (order: any) => {
    const printWindow = window.open('', '', 'width=350,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt #${order.orderId}</title>
          <style>
            @page {
              size: 48mm auto;
              margin: 0mm;
            }
            @media print {
              html, body {
                width: 48mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, 'Noto Sans Sinhala', monospace;
              width: 48mm;
              max-width: 48mm;
              margin: 0 auto;
              padding: 4px 1.5mm 15px 1.5mm;
              font-size: 9.5px;
              line-height: 1.25;
              color: #000;
              background: #fff;
              word-break: break-word;
            }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .flex-between { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 9.5px;
              margin: 3px 0;
            }
            .items-table th { padding: 2px 0; font-size: 9px; }
            .items-table td { padding: 2px 0; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold" style="font-size: 11.5px; line-height: 1.2;">SRI LANKAN FOOD ORADEA</div>
          <div class="text-center" style="font-size: 8.5px; margin-top: 2px;">Hot, Spicy & Freshly Made</div>
          <div class="text-center" style="font-size: 8.5px;">WhatsApp: +40 72 301 7320</div>
          <div class="divider"></div>
          <div><b>ORDER ID :</b> #${order.orderId}</div>
          <div><b>DATE     :</b> ${new Date(order.createdAt).toLocaleString()}</div>
          <div><b>CUSTOMER :</b> ${order.customerName}</div>
          <div><b>PHONE    :</b> ${order.customerPhone || 'N/A'}</div>
          <div><b>ADDRESS  :</b> ${order.deliveryAddress}</div>
          <div class="divider"></div>
          <table class="items-table">
            <thead>
              <tr style="border-bottom: 1px dashed #000;">
                <th style="text-align: left; width: 54%;">ITEM</th>
                <th style="text-align: center; width: 16%;">QTY</th>
                <th style="text-align: right; width: 30%;">PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((i: any) => `
                <tr>
                  <td style="text-align: left; word-break: break-word; padding-right: 2px;">${i.title}</td>
                  <td style="text-align: center; font-weight: bold;">${i.quantity}</td>
                  <td style="text-align: right; white-space: nowrap;">Lei ${i.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="flex-between"><span>SUBTOTAL</span><span>Lei ${order.subtotal}</span></div>
          <div class="flex-between"><span>DELIVERY FEE</span><span>Lei ${order.deliveryFee}</span></div>
          <div class="divider"></div>
          <div class="flex-between font-bold" style="font-size: 11px;"><span>TOTAL DUE</span><span>Lei ${order.totalDue}</span></div>
          <div style="margin-top: 3px;"><b>PAYMENT  :</b> ${order.paymentMethod}</div>
          <div class="divider"></div>
          <div class="text-center" style="font-size: 9px; margin-top: 4px;">Thank you for your order!</div>
          <div class="text-center" style="font-size: 8.5px; margin-top: 2px;">*** HAVE A NICE DAY ***</div>
          <div style="height: 15px;"></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
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
