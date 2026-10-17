import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'printed' | 'users' | 'menu'>('orders');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [printedOrdersSet, setPrintedOrdersSet] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [newUserForm, setNewUserForm] = useState({ fullName: '', email: '', mobile: '', address: '', password: '' });
  const [userFormError, setUserFormError] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated && activeTab === 'users') {
      fetchUsers();
    } else if (isAuthenticated && activeTab === 'menu') {
      fetchProducts();
    }
  }, [isAuthenticated, activeTab]);

  const fetchUsers = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
        }
      })
      .catch(err => console.error(err));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    setIsCreatingUser(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setUserFormError(data.error || 'Failed to create user');
        setIsCreatingUser(false);
        return;
      }

      setShowUserModal(false);
      setNewUserForm({ fullName: '', email: '', mobile: '', address: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      setUserFormError(err.message || 'Error creating user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting user');
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserForm(prev => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.products);
      })
      .catch(err => console.error(err));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const productData = {
      title: formData.get('title'),
      category: formData.get('category'),
      price: Number(formData.get('price')),
      image: formData.get('image') || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      unit: formData.get('unit') || '1 portion',
    };

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const markAsPrinted = async (orderId: string) => {
    setPrintedOrdersSet(prev => new Set(prev).add(orderId));
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: 'PRINTED' })
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: 'PRINTED' } : o));
    } catch (err) {
      console.error(err);
    }
  };

  const printKOT = (order: any) => {
    const printWindow = window.open('', '', 'width=350,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>KOT #${order.orderId}</title>
          <style>
            @page {
              size: 55mm auto;
              margin: 0mm;
            }
            @media print {
              *, *:before, *:after {
                box-sizing: border-box !important;
              }
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .receipt-container {
                width: 38mm !important;
                max-width: 38mm !important;
                margin: 0 auto !important;
                padding: 2px 1mm 12px 1mm !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, 'Noto Sans Sinhala', monospace;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            .receipt-container {
              width: 38mm;
              max-width: 38mm;
              margin: 0 auto;
              padding: 2px 1mm 12px 1mm;
              font-size: 7.5px;
              line-height: 1.25;
              word-break: break-word;
            }
            .divider { border-top: 1px dashed #000; margin: 3px 0; width: 100%; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 7.5px;
              margin: 2px 0;
            }
            .items-table th { padding: 2px 0; font-size: 7.5px; }
            .items-table td { padding: 2px 0; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="text-center font-bold" style="font-size: 9.5px;">*** KITCHEN ORDER TICKET ***</div>
            <div class="divider"></div>
            <div style="font-size: 7.5px; line-height: 1.3;">
              <div><b>ORDER ID :</b> #${order.orderId}</div>
              <div><b>DATE     :</b> ${new Date(order.createdAt).toLocaleString()}</div>
              ${order.customerName ? `<div><b>CUSTOMER :</b> ${order.customerName}</div>` : ''}
            </div>
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
                    <td style="text-align: center; font-size: 8.5px; font-weight: bold; padding-right: 2px;">${i.quantity}x</td>
                    <td style="font-size: 8px; font-weight: bold; word-break: break-word;">${i.title}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="divider"></div>
            <div style="height: 12px;"></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    markAsPrinted(order._id);
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 350);
  };

  const printReceipt = (order: any) => {
    const printWindow = window.open('', '', 'width=350,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Receipt #${order.orderId}</title>
          <style>
            @page {
              size: 55mm auto;
              margin: 0mm;
            }
            @media print {
              *, *:before, *:after {
                box-sizing: border-box !important;
              }
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .receipt-container {
                width: 38mm !important;
                max-width: 38mm !important;
                margin: 0 auto !important;
                padding: 2px 1mm 12px 1mm !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, 'Noto Sans Sinhala', monospace;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            .receipt-container {
              width: 38mm;
              max-width: 38mm;
              margin: 0 auto;
              padding: 2px 1mm 12px 1mm;
              font-size: 7.5px;
              line-height: 1.25;
              word-break: break-word;
            }
            .divider { border-top: 1px dashed #000; margin: 3px 0; width: 100%; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .flex-between { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; font-size: 7.5px; line-height: 1.3; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 7.5px;
              margin: 2px 0;
            }
            .items-table th { padding: 2px 0; font-size: 7.5px; }
            .items-table td { padding: 2px 0; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="text-center font-bold" style="font-size: 9.5px; line-height: 1.2;">SRI LANKAN FOOD ORADEA</div>
            <div class="text-center" style="font-size: 7.5px; margin-top: 1px;">Hot, Spicy & Freshly Made</div>
            <div class="text-center" style="font-size: 7.5px;">WhatsApp: +40 72 301 7320</div>
            <div class="divider"></div>
            <div style="font-size: 7.5px; line-height: 1.3;">
              <div><b>ORDER ID :</b> #${order.orderId}</div>
              <div><b>DATE     :</b> ${new Date(order.createdAt).toLocaleString()}</div>
              <div><b>CUSTOMER :</b> ${order.customerName}</div>
              <div><b>PHONE    :</b> ${order.customerPhone || 'N/A'}</div>
              <div><b>ADDRESS  :</b> ${order.deliveryAddress}</div>
            </div>
            <div class="divider"></div>
            <table class="items-table">
              <thead>
                <tr style="border-bottom: 1px dashed #000;">
                  <th style="text-align: left; width: 48%;">ITEM</th>
                  <th style="text-align: center; width: 16%;">QTY</th>
                  <th style="text-align: right; width: 36%;">PRICE</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((i: any) => `
                  <tr>
                    <td style="text-align: left; word-break: break-word; padding-right: 2px; font-weight: bold;">${i.title}</td>
                    <td style="text-align: center; font-weight: bold; font-size: 8px;">${i.quantity}</td>
                    <td style="text-align: right; white-space: nowrap; font-weight: bold;">Lei ${i.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="flex-between"><span>SUBTOTAL</span><span>Lei ${order.subtotal}</span></div>
            <div class="flex-between"><span>DELIVERY FEE</span><span>Lei ${order.deliveryFee}</span></div>
            <div class="divider"></div>
            <div class="flex-between font-bold" style="font-size: 9px;"><span>TOTAL DUE</span><span>Lei ${order.totalDue}</span></div>
            <div style="margin-top: 2px; font-size: 7.5px;"><b>PAYMENT  :</b> ${order.paymentMethod}</div>
            <div class="divider"></div>
            <div class="text-center" style="font-size: 7.5px; margin-top: 3px;">Thank you for your order!</div>
            <div class="text-center" style="font-size: 7px; margin-top: 1px;">*** HAVE A NICE DAY ***</div>
            <div style="height: 12px;"></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    markAsPrinted(order._id);
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 350);
  };

  const printBoth = (order: any) => {
    const printWindow = window.open('', '', 'width=350,height=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Order #${order.orderId}</title>
          <style>
            @page {
              size: 55mm auto;
              margin: 0mm;
            }
            @media print {
              *, *:before, *:after {
                box-sizing: border-box !important;
              }
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .receipt-container {
                width: 38mm !important;
                max-width: 38mm !important;
                margin: 0 auto !important;
                padding: 2px 1mm 12px 1mm !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, 'Noto Sans Sinhala', monospace;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            .receipt-container {
              width: 38mm;
              max-width: 38mm;
              margin: 0 auto;
              padding: 2px 1mm 12px 1mm;
              font-size: 7.5px;
              line-height: 1.25;
              word-break: break-word;
            }
            .divider { border-top: 1px dashed #000; margin: 3px 0; width: 100%; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .flex-between { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; font-size: 7.5px; line-height: 1.3; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 7.5px;
              margin: 2px 0;
            }
            .items-table th { padding: 2px 0; font-size: 7.5px; }
            .items-table td { padding: 2px 0; vertical-align: top; }
            .spacer { height: 8px; }
            .cut-line {
              border-top: 1px dashed #000;
              margin: 8px 0;
              text-align: center;
              position: relative;
            }
            .cut-line span {
              background: #fff;
              padding: 0 4px;
              position: relative;
              top: -6px;
              font-size: 7.5px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <!-- RECEIPT SECTION -->
            <div class="text-center font-bold" style="font-size: 9.5px; line-height: 1.2;">SRI LANKAN FOOD ORADEA</div>
            <div class="text-center" style="font-size: 7.5px; margin-top: 1px;">Hot, Spicy & Freshly Made</div>
            <div class="text-center" style="font-size: 7.5px;">WhatsApp: +40 72 301 7320</div>
            <div class="divider"></div>
            <div style="font-size: 7.5px; line-height: 1.3;">
              <div><b>ORDER ID :</b> #${order.orderId}</div>
              <div><b>DATE     :</b> ${new Date(order.createdAt).toLocaleString()}</div>
              <div><b>CUSTOMER :</b> ${order.customerName}</div>
              <div><b>PHONE    :</b> ${order.customerPhone || 'N/A'}</div>
              <div><b>ADDRESS  :</b> ${order.deliveryAddress}</div>
            </div>
            <div class="divider"></div>
            <table class="items-table">
              <thead>
                <tr style="border-bottom: 1px dashed #000;">
                  <th style="text-align: left; width: 48%;">ITEM</th>
                  <th style="text-align: center; width: 16%;">QTY</th>
                  <th style="text-align: right; width: 36%;">PRICE</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((i: any) => `
                  <tr>
                    <td style="text-align: left; word-break: break-word; padding-right: 2px; font-weight: bold;">${i.title}</td>
                    <td style="text-align: center; font-weight: bold; font-size: 8px;">${i.quantity}</td>
                    <td style="text-align: right; white-space: nowrap; font-weight: bold;">Lei ${i.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="flex-between"><span>SUBTOTAL</span><span>Lei ${order.subtotal}</span></div>
            <div class="flex-between"><span>DELIVERY FEE</span><span>Lei ${order.deliveryFee}</span></div>
            <div class="divider"></div>
            <div class="flex-between font-bold" style="font-size: 9px;"><span>TOTAL DUE</span><span>Lei ${order.totalDue}</span></div>
            <div style="margin-top: 2px; font-size: 7.5px;"><b>PAYMENT  :</b> ${order.paymentMethod}</div>
            <div class="divider"></div>
            <div class="text-center" style="font-size: 7.5px; margin-top: 3px;">Thank you for your order!</div>

            <div class="spacer"></div>
            <div class="cut-line"><span>✂️ CUT HERE ✂️</span></div>
            <div class="spacer"></div>

            <!-- KOT SECTION -->
            <div class="text-center font-bold" style="font-size: 9.5px;">*** KITCHEN ORDER TICKET ***</div>
            <div class="divider"></div>
            <div style="font-size: 7.5px; line-height: 1.3;">
              <div><b>ORDER ID :</b> #${order.orderId}</div>
              <div><b>DATE     :</b> ${new Date(order.createdAt).toLocaleString()}</div>
            </div>
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
                    <td style="text-align: center; font-size: 8.5px; font-weight: bold; padding-right: 2px;">${i.quantity}x</td>
                    <td style="font-size: 8px; font-weight: bold; word-break: break-word;">${i.title}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="divider"></div>
            <div style="height: 12px;"></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    markAsPrinted(order._id);
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 350);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans absolute inset-0 z-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full">
          <h1 className="text-2xl font-black mb-1 text-center text-gray-900 tracking-tight">Sri Lankan Food Oradea</h1>
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
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen text-gray-900 font-sans pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black mb-1 text-gray-900 tracking-tight">Sri Lankan Food Oradea POS</h1>
            <p className="text-xs text-gray-500 font-medium">Mobile POS Dashboard</p>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('adminAuth'); setIsAuthenticated(false); }}
            className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 px-3 py-2 rounded-xl"
          >
            Log Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            New Orders
          </button>
          <button 
            onClick={() => setActiveTab('printed')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'printed' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Printed
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'users' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'menu' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Menu
          </button>
        </div>
        
        {activeTab === 'orders' || activeTab === 'printed' ? (
          <div className="grid gap-4">
            {orders.filter(order => activeTab === 'orders' ? (order.orderStatus !== 'PRINTED' && !printedOrdersSet.has(order._id)) : (order.orderStatus === 'PRINTED' || printedOrdersSet.has(order._id))).map(order => {
              const isPrinted = order.orderStatus === 'PRINTED' || printedOrdersSet.has(order._id);
              const isNew = !isPrinted;
              
              return (
                <div key={order._id} className={`p-4 rounded-2xl shadow-sm border transition-all ${
                  isPrinted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-green-200 shadow-green-100/50'
                }`}>
                  {isNew && (
                    <div className="mb-2">
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">New Order</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-lg tracking-tight text-gray-900">{order.orderId}</h3>
                      <p className="text-xs text-gray-500 font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                      <p className="text-xs mt-2 font-medium"><span className="font-bold text-gray-900">Customer:</span> {order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{order.orderStatus}</span>
                      <p className="font-black text-xl mt-2 text-green-600">Lei {order.totalDue}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => printBoth(order)}
                      className={`${isPrinted ? 'bg-gray-500' : 'bg-green-600'} hover:bg-green-700 text-white px-4 py-3 rounded-xl text-xs font-bold flex-1 transition-colors cursor-pointer`}
                    >
                      🖨️ Print Both (KOT + Receipt)
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <button 
                      onClick={() => printKOT(order)}
                      className={`${isPrinted ? 'bg-gray-500' : 'bg-gray-900'} hover:bg-gray-800 text-white px-4 py-3 rounded-xl text-xs font-bold flex-1 transition-colors cursor-pointer`}
                    >
                      🖨️ KOT (Kitchen)
                    </button>
                    <button 
                      onClick={() => printReceipt(order)}
                      className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 px-4 py-3 rounded-xl text-xs font-bold flex-1 transition-colors cursor-pointer"
                    >
                      🧾 Receipt (Delivery)
                    </button>
                  </div>
                </div>
              );
            })}
            {orders.filter(order => activeTab === 'orders' ? (order.orderStatus !== 'PRINTED' && !printedOrdersSet.has(order._id)) : (order.orderStatus === 'PRINTED' || printedOrdersSet.has(order._id))).length === 0 && (
              <div className="bg-white p-8 text-center rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm font-medium">
                  {activeTab === 'orders' ? 'No new orders received yet. Waiting for new orders...' : 'No printed orders.'}
                </p>
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {users.length} Users
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Manage customer accounts and add new users</p>
              </div>
              <button 
                onClick={() => {
                  setUserFormError('');
                  setNewUserForm({ fullName: '', email: '', mobile: '', address: '', password: '' });
                  setShowPassword(false);
                  setShowUserModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>+</span> Add New User
              </button>
            </div>

            {/* Search Filter */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users by name, email, or mobile..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Users List */}
            <div className="grid gap-3">
              {users
                .filter(u => {
                  if (!userSearchTerm) return true;
                  const term = userSearchTerm.toLowerCase();
                  return (
                    (u.fullName && u.fullName.toLowerCase().includes(term)) ||
                    (u.email && u.email.toLowerCase().includes(term)) ||
                    (u.mobile && u.mobile.toLowerCase().includes(term))
                  );
                })
                .map(user => {
                  const initial = (user.fullName || 'U').charAt(0).toUpperCase();
                  return (
                    <div key={user._id || user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-gray-300 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-base">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-gray-900 truncate">{user.fullName}</h3>
                              <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Customer</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-gray-400">📧</span>
                                <a href={`mailto:${user.email}`} className="truncate hover:underline text-gray-700">{user.email}</a>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">📱</span>
                                <a href={`tel:${user.mobile}`} className="hover:underline text-gray-700">{user.mobile}</a>
                              </div>
                              <div className="flex items-center gap-1.5 sm:col-span-2">
                                <span className="text-gray-400">📍</span>
                                <span className="truncate">{user.address}</span>
                              </div>
                            </div>
                            
                            <p className="text-[11px] text-gray-400 mt-2 font-medium">
                              Joined: {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteUser(user._id || user.id, user.fullName)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                          title="Delete User"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

              {users.filter(u => {
                if (!userSearchTerm) return true;
                const term = userSearchTerm.toLowerCase();
                return (
                  (u.fullName && u.fullName.toLowerCase().includes(term)) ||
                  (u.email && u.email.toLowerCase().includes(term)) ||
                  (u.mobile && u.mobile.toLowerCase().includes(term))
                );
              }).length === 0 && (
                <div className="bg-white p-8 text-center rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm font-medium">
                    {userSearchTerm ? 'No users matching your search.' : 'No users registered yet. Click "+ Add New User" to create one!'}
                  </p>
                </div>
              )}
            </div>

            {/* Add User Modal */}
            {showUserModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Add New User</h2>
                    <button 
                      onClick={() => setShowUserModal(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-bold p-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>

                  {userFormError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-bold">
                      {userFormError}
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={newUserForm.fullName}
                        onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                        className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                        placeholder="customer@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        value={newUserForm.mobile}
                        onChange={(e) => setNewUserForm({ ...newUserForm, mobile: e.target.value })}
                        className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                        placeholder="+40 72 301 7320"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Delivery / Street Address</label>
                      <textarea 
                        rows={2}
                        required
                        value={newUserForm.address}
                        onChange={(e) => setNewUserForm({ ...newUserForm, address: e.target.value })}
                        className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all resize-none"
                        placeholder="Strada Republicii 12, Oradea"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700">Password</label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[11px] font-bold text-green-700 hover:text-green-800 cursor-pointer"
                        >
                          ⚡ Generate
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          required
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          className="w-full border border-gray-300 p-2.5 pr-14 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer px-1 py-0.5"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button 
                        type="button" 
                        onClick={() => setShowUserModal(false)}
                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isCreatingUser}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isCreatingUser ? 'Creating...' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Menu Items</h2>
              <button 
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800"
              >
                + Add Item
              </button>
            </div>
            
            <div className="grid gap-4">
              {products.map(product => (
                <div key={product._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img src={product.image} alt={product.title} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                    <div>
                      <h3 className="font-black text-lg text-gray-900">{product.title}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase">{product.category}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">Lei {product.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                      className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="bg-white p-8 text-center rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm font-medium">No menu items found. Add some!</p>
                </div>
              )}
            </div>

            {showProductModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Title</label>
                      <input name="title" defaultValue={editingProduct?.title} required className="w-full border p-2 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Category</label>
                      <input name="category" defaultValue={editingProduct?.category} required className="w-full border p-2 rounded-lg" placeholder="e.g. Kottu, Rice, Drinks" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Price (Lei)</label>
                      <input type="number" step="0.01" name="price" defaultValue={editingProduct?.price} required className="w-full border p-2 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Image URL (Optional)</label>
                      <input name="image" defaultValue={editingProduct?.image} className="w-full border p-2 rounded-lg" placeholder="Leave empty for default image" />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-gray-900 text-white rounded-lg font-bold">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
