import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  Calendar, 
  Printer, 
  Clock, 
  Utensils, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ChefHat, 
  Bell 
} from 'lucide-react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'printed' | 'analytics' | 'users' | 'menu'>('orders');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [printedOrdersSet, setPrintedOrdersSet] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Analytics State
  const [analyticsRange, setAnalyticsRange] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom'>('today');
  const [analyticsDate, setAnalyticsDate] = useState<string>(new Date().toISOString().slice(0, 10));

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

  // Analytics Calculations
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const analyticsOrders = orders.filter(order => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    const orderDateStr = orderDate.toISOString().slice(0, 10);

    if (analyticsRange === 'today') {
      return orderDateStr === todayStr;
    }
    if (analyticsRange === 'yesterday') {
      return orderDateStr === yesterdayStr;
    }
    if (analyticsRange === 'custom') {
      return orderDateStr === analyticsDate;
    }
    if (analyticsRange === '7days') {
      return orderDate >= sevenDaysAgo && orderDate <= now;
    }
    if (analyticsRange === 'month') {
      return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
    }
    if (analyticsRange === 'all') {
      return true;
    }
    return true;
  });

  const totalRevenue = analyticsOrders.reduce((sum, o) => sum + (Number(o.totalDue) || 0), 0);
  const totalSubtotal = analyticsOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
  const totalDeliveryFee = analyticsOrders.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0);
  const totalOrdersCount = analyticsOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const printedOrdersCount = analyticsOrders.filter(o => o.orderStatus === 'PRINTED' || printedOrdersSet.has(o._id)).length;
  const newOrdersCount = totalOrdersCount - printedOrdersCount;

  // Item sales map
  const itemMap: Record<string, { title: string; count: number; revenue: number }> = {};
  analyticsOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach((item: any) => {
        const title = item.title || 'Unknown Item';
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        if (!itemMap[title]) {
          itemMap[title] = { title, count: 0, revenue: 0 };
        }
        itemMap[title].count += qty;
        itemMap[title].revenue += price * qty;
      });
    }
  });

  const topSellingItems = Object.values(itemMap).sort((a, b) => b.count - a.count);
  const totalItemsSold = topSellingItems.reduce((sum, i) => sum + i.count, 0);

  // Payment breakdown
  const cashOrders = analyticsOrders.filter(o => !o.paymentMethod || o.paymentMethod.toLowerCase().includes('cash'));
  const cardOrders = analyticsOrders.filter(o => o.paymentMethod && !o.paymentMethod.toLowerCase().includes('cash'));
  const cashRevenue = cashOrders.reduce((sum, o) => sum + (Number(o.totalDue) || 0), 0);
  const cardRevenue = cardOrders.reduce((sum, o) => sum + (Number(o.totalDue) || 0), 0);
  const cashPercentage = totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
  const cardPercentage = totalRevenue > 0 ? 100 - cashPercentage : 0;

  // Latest active order date for shortcut jump
  const latestOrderDate = orders[0]?.createdAt ? new Date(orders[0].createdAt).toISOString().slice(0, 10) : null;

  // Chart data
  const isSingleDay = analyticsRange === 'today' || analyticsRange === 'yesterday' || analyticsRange === 'custom';
  let chartBars: { label: string; subLabel: string; revenue: number; count: number }[] = [];

  if (isSingleDay) {
    const hoursMap: Record<number, { revenue: number; count: number }> = {};
    for (let h = 8; h <= 22; h += 2) {
      hoursMap[h] = { revenue: 0, count: 0 };
    }
    analyticsOrders.forEach(o => {
      const h = new Date(o.createdAt).getHours();
      const bucket = Math.max(8, Math.min(22, Math.floor(h / 2) * 2));
      if (hoursMap[bucket]) {
        hoursMap[bucket].revenue += Number(o.totalDue) || 0;
        hoursMap[bucket].count += 1;
      }
    });
    chartBars = Object.entries(hoursMap).map(([hStr, data]) => {
      const h = Number(hStr);
      return {
        label: `${h}:00`,
        subLabel: `${h + 2}:00`,
        revenue: data.revenue,
        count: data.count,
      };
    });
  } else {
    const dayMap: Record<string, { revenue: number; count: number }> = {};
    analyticsOrders.forEach(o => {
      const d = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!dayMap[d]) {
        dayMap[d] = { revenue: 0, count: 0 };
      }
      dayMap[d].revenue += Number(o.totalDue) || 0;
      dayMap[d].count += 1;
    });
    chartBars = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, data]) => {
        const d = new Date(dateStr);
        return {
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          subLabel: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
          revenue: data.revenue,
          count: data.count,
        };
      });
  }

  const maxRevenue = Math.max(...chartBars.map(b => b.revenue), 10);

  const getRangeLabel = () => {
    if (analyticsRange === 'today') return "Today's Sales (" + new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ")";
    if (analyticsRange === 'yesterday') return "Yesterday's Sales (" + yesterday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ")";
    if (analyticsRange === 'custom') return "Sales for " + new Date(analyticsDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (analyticsRange === '7days') return "Last 7 Days";
    if (analyticsRange === 'month') return "This Month (" + now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + ")";
    return "All Time Sales";
  };

  const printDailyReport = () => {
    const printWindow = window.open('', '', 'width=380,height=650');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Daily Sales Report</title>
          <style>
            @page { size: 55mm auto; margin: 0; }
            body { font-family: 'Courier New', monospace; font-size: 7.5px; padding: 2mm 1mm; line-height: 1.25; color: #000; margin: 0; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 3px 0; }
            .flex-between { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold" style="font-size: 9.5px;">SRI LANKAN FOOD ORADEA</div>
          <div class="text-center font-bold">DAILY SALES CLOSING REPORT</div>
          <div class="divider"></div>
          <div><b>PERIOD :</b> ${analyticsRange.toUpperCase()} (${analyticsRange === 'custom' ? analyticsDate : (analyticsRange === 'today' ? new Date().toISOString().slice(0, 10) : analyticsRange)})</div>
          <div><b>DATE   :</b> ${new Date().toLocaleString()}</div>
          <div class="divider"></div>
          <div class="flex-between"><span>TOTAL ORDERS:</span><b>${totalOrdersCount}</b></div>
          <div class="flex-between"><span>ITEMS SOLD:</span><b>${totalItemsSold}</b></div>
          <div class="flex-between"><span>SUBTOTAL:</span><b>Lei ${totalSubtotal.toFixed(2)}</b></div>
          <div class="flex-between"><span>DELIVERY:</span><b>Lei ${totalDeliveryFee.toFixed(2)}</b></div>
          <div class="divider"></div>
          <div class="flex-between font-bold" style="font-size: 9px;"><span>TOTAL SALES:</span><span>Lei ${totalRevenue.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="flex-between"><span>Cash on Delivery:</span><span>Lei ${cashRevenue.toFixed(2)} (${cashOrders.length})</span></div>
          <div class="flex-between"><span>Card / Online:</span><span>Lei ${cardRevenue.toFixed(2)} (${cardOrders.length})</span></div>
          <div class="divider"></div>
          <div class="font-bold">TOP DISHES:</div>
          ${topSellingItems.slice(0, 5).map(i => `
            <div class="flex-between"><span>${i.count}x ${i.title}</span><span>Lei ${i.revenue.toFixed(2)}</span></div>
          `).join('')}
          <div class="divider"></div>
          <div class="text-center">*** HAVE A NICE DAY ***</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
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
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen text-slate-900 font-sans pb-28">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <ChefHat size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Sri Lankan Food Oradea</h1>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">
                  POS Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Order Dispatch, Sales Reports & Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 hidden md:inline font-medium">admin@kottu.com</span>
            <button 
              onClick={() => { localStorage.removeItem('adminAuth'); setIsAuthenticated(false); }}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-200/60 p-1.5 rounded-2xl flex gap-1.5 overflow-x-auto shadow-inner border border-slate-200">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Bell size={16} className={activeTab === 'orders' ? 'text-amber-500' : 'text-slate-400'} />
            <span>New Orders</span>
            {orders.filter(o => o.orderStatus !== 'PRINTED' && !printedOrdersSet.has(o._id)).length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {orders.filter(o => o.orderStatus !== 'PRINTED' && !printedOrdersSet.has(o._id)).length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('printed')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'printed' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Printer size={16} className={activeTab === 'printed' ? 'text-blue-500' : 'text-slate-400'} />
            <span>Printed</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 size={16} className={activeTab === 'analytics' ? 'text-emerald-500' : 'text-slate-400'} />
            <span>Sales Analytics</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users size={16} className={activeTab === 'users' ? 'text-indigo-500' : 'text-slate-400'} />
            <span>Users</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-200">
              {users.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'menu' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Utensils size={16} className={activeTab === 'menu' ? 'text-orange-500' : 'text-slate-400'} />
            <span>Menu</span>
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
        ) : activeTab === 'analytics' ? (
          <div className="space-y-6">
            {/* Top Control Bar: Header + Actions + Timeframe Selector */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Header row */}
              <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Sales & Revenue Analytics</h2>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Sync
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                    {getRangeLabel()} • Real-time sales, order breakdown & daily revenue metrics
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={printDailyReport}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                    title="Print Daily Sales Closing Slip"
                  >
                    <Printer size={15} />
                    <span>Print Day Z-Report</span>
                  </button>
                </div>
              </div>

              {/* Timeframe Selector row */}
              <div className="p-4 md:px-6 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Timeframe:</span>
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: 'month', label: 'This Month' },
                    { id: 'all', label: 'All Time' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setAnalyticsRange(btn.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        analyticsRange === btn.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Specific Date Picker */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Pick Date:</span>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 shadow-xs">
                    <Calendar size={13} className="text-slate-400" />
                    <input
                      type="date"
                      value={analyticsDate}
                      onChange={(e) => {
                        setAnalyticsDate(e.target.value);
                        setAnalyticsRange('custom');
                      }}
                      className="outline-none text-xs font-semibold text-slate-700 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Notice if selected period has 0 orders */}
              {totalOrdersCount === 0 && (
                <div className="mx-4 md:mx-6 my-3 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-amber-800 font-medium flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>No orders recorded in this selected period.</span>
                  </div>
                  {latestOrderDate && (
                    <button
                      onClick={() => {
                        setAnalyticsDate(latestOrderDate);
                        setAnalyticsRange('custom');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shrink-0 cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Calendar size={13} />
                      <span>View Latest Active Orders ({new Date(latestOrderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Revenue */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Gross Sales</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    <span className="text-sm font-bold text-emerald-600 mr-1 font-mono">Lei</span>
                    {totalRevenue.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Food: Lei {totalSubtotal.toFixed(2)} • Delivery: Lei {totalDeliveryFee.toFixed(2)}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500 opacity-80"></div>
              </div>

              {/* Card 2: Total Orders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Volume</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ShoppingBag size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    {totalOrdersCount}
                    <span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">orders</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {printedOrdersCount} Ready/Printed • {newOrdersCount} Kitchen Pending
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-500 opacity-80"></div>
              </div>

              {/* Card 3: Average Order Value */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Ticket</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Receipt size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    <span className="text-sm font-bold text-purple-600 mr-1 font-mono">Lei</span>
                    {avgOrderValue.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Average revenue per customer order
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-500 opacity-80"></div>
              </div>

              {/* Card 4: Portions Sold */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dishes Prepared</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Utensils size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                    {totalItemsSold}
                    <span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">portions</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Across {topSellingItems.length} active menu dishes
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500 opacity-80"></div>
              </div>
            </div>

            {/* Sales Trend Bar Chart */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="font-black text-base md:text-lg text-slate-900 tracking-tight">
                    {isSingleDay ? "Hourly Revenue Trajectory" : "Daily Revenue History"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {isSingleDay ? "Hourly sales volume throughout operating hours" : "Sales performance comparison over time"}
                  </p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full shrink-0">
                  Peak: Lei {maxRevenue.toFixed(0)}
                </span>
              </div>

              {chartBars.length > 0 ? (
                <div className="relative pt-6">
                  {/* Reference line */}
                  <div className="absolute top-6 left-0 right-0 border-b border-dashed border-slate-200"></div>

                  <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 overflow-x-auto pb-1 px-1">
                    {chartBars.map((bar, idx) => {
                      const heightPercent = Math.max(6, Math.round((bar.revenue / maxRevenue) * 100));
                      return (
                        <div key={idx} className="flex-1 min-w-[36px] max-w-[64px] flex flex-col items-center h-full justify-end group">
                          {/* Value on hover or top */}
                          <div className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-600 transition-colors mb-1.5 text-center whitespace-nowrap">
                            {bar.revenue > 0 ? `Lei ${bar.revenue}` : ''}
                          </div>

                          {/* Bar */}
                          <div className="w-full bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-xl transition-all duration-300 relative ${
                                bar.revenue > 0
                                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300'
                                  : 'bg-transparent'
                              }`}
                            >
                              {bar.count > 0 && (
                                <span className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded shadow z-20 whitespace-nowrap">
                                  {bar.count} {bar.count === 1 ? 'order' : 'orders'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Label */}
                          <div className="mt-2 text-center w-full">
                            <div className="text-[10px] font-bold text-slate-700 truncate">{bar.label}</div>
                            {bar.subLabel && <div className="text-[9px] text-slate-400 font-medium truncate">{bar.subLabel}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Baseline */}
                  <div className="border-t border-slate-200 w-full mt-1"></div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-medium">
                  No sales recorded for this timeframe.
                </div>
              )}
            </div>

            {/* Two Column Grid: Top Selling Dishes + Payment & Kitchen Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="font-black text-base md:text-lg text-slate-900 tracking-tight">Top Performing Dishes</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Most ordered menu items ranked by popularity</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                      {topSellingItems.length} items
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topSellingItems.slice(0, 5).map((item, idx) => {
                      const sharePercent = totalItemsSold > 0 ? Math.round((item.count / totalItemsSold) * 100) : 0;
                      return (
                        <div key={idx} className="p-3 bg-slate-50/80 hover:bg-slate-100 rounded-xl transition-all border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-sm text-slate-900 truncate">{item.title}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-sm text-emerald-600">Lei {item.revenue.toFixed(2)}</span>
                              <span className="text-xs text-slate-400 font-medium ml-1.5">({item.count} sold)</span>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${sharePercent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}

                    {topSellingItems.length === 0 && (
                      <div className="py-12 text-center text-xs text-slate-400 font-medium">
                        No dishes sold in the selected period.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment & Order Status Breakdown */}
              <div className="space-y-6 flex flex-col justify-between">
                {/* Payment Methods Card */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h3 className="font-black text-base md:text-lg text-slate-900 tracking-tight mb-1">Payment Method Distribution</h3>
                  <p className="text-xs text-slate-400 font-medium mb-5">Cash on Delivery vs Digital / Card settlement</p>

                  <div className="space-y-4">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${cashPercentage}%` }}></div>
                      <div className="bg-blue-500 h-full transition-all" style={{ width: `${cardPercentage}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Banknote size={14} className="text-emerald-500" />
                          <span>Cash on Delivery</span>
                        </div>
                        <div className="text-base font-black text-slate-900 mt-1">
                          Lei {cashRevenue.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {cashOrders.length} orders ({cashPercentage}%)
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <CreditCard size={14} className="text-blue-500" />
                          <span>Card / Online</span>
                        </div>
                        <div className="text-base font-black text-slate-900 mt-1">
                          Lei {cardRevenue.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {cardOrders.length} orders ({cardPercentage}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fulfillment Status Card */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h3 className="font-black text-base md:text-lg text-slate-900 tracking-tight mb-1">Kitchen Operational Status</h3>
                  <p className="text-xs text-slate-400 font-medium mb-4">Preparation status for selected period</p>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl">
                      <div className="flex justify-center mb-1 text-emerald-600">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="text-2xl font-black text-emerald-700">{printedOrdersCount}</div>
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-0.5">Dispatched / Ready</div>
                    </div>
                    <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                      <div className="flex justify-center mb-1 text-amber-600">
                        <Clock size={18} />
                      </div>
                      <div className="text-2xl font-black text-amber-700">{newOrdersCount}</div>
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mt-0.5">Kitchen Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Orders Transaction Log */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base md:text-lg text-slate-900 tracking-tight">Period Transaction Log</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {analyticsOrders.length} {analyticsOrders.length === 1 ? 'order' : 'orders'} recorded in this timeframe
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {analyticsOrders.map((order) => {
                      const isPrinted = order.orderStatus === 'PRINTED' || printedOrdersSet.has(order._id);
                      return (
                        <tr key={order._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-black font-mono text-slate-900 whitespace-nowrap">
                            #{order.orderId}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {order.customerName || 'Guest'}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                            {order.items?.map((i: any) => `${i.quantity}x ${i.title}`).join(', ')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {order.paymentMethod || 'Cash on Delivery'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-600 whitespace-nowrap text-sm">
                            Lei {order.totalDue}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isPrinted
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => printReceipt(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                              title="Print Customer Receipt"
                            >
                              <Printer size={12} />
                              <span>Receipt</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {analyticsOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-medium">
                          No transactions found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
