'use client';

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
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUsers(data.users);
          }
        })
        .catch(err => console.error(err));
    } else if (isAuthenticated && activeTab === 'menu') {
      fetchProducts();
    }
  }, [isAuthenticated, activeTab]);

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
    markAsPrinted(order._id);
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
          <div class="text-center font-bold">SRI LANKAN FOOD ORADEA</div>
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
    markAsPrinted(order._id);
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const printBoth = (order: any) => {
    const printWindow = window.open('', '', 'width=300,height=800');
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
            .spacer { height: 40px; }
            .cut-line { border-top: 1px dotted #000; margin: 20px 0; text-align: center; position: relative; }
            .cut-line span { background: #fff; padding: 0 10px; position: relative; top: -10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <!-- RECEIPT SECTION -->
          <div class="text-center font-bold">SRI LANKAN FOOD ORADEA</div>
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

          <div class="spacer"></div>
          <div class="cut-line"><span>✂️ CUT HERE ✂️</span></div>
          <div class="spacer"></div>

          <!-- KOT SECTION -->
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
    markAsPrinted(order._id);
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
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
          <div className="grid gap-4">
            {users.map(user => (
              <div key={user._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-black text-lg text-gray-900 mb-1">{user.fullName}</h3>
                <p className="text-sm text-gray-600 mb-1"><span className="font-bold">Email:</span> {user.email}</p>
                <p className="text-sm text-gray-600 mb-1"><span className="font-bold">Mobile:</span> {user.mobile}</p>
                <p className="text-sm text-gray-600 mb-2"><span className="font-bold">Address:</span> {user.address}</p>
                <p className="text-xs text-gray-400 font-medium">Joined: {new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            ))}
            {users.length === 0 && (
              <div className="bg-white p-8 text-center rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm font-medium">No users registered yet.</p>
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
