const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Models
const Order = require('./models/Order');
const User = require('./models/User');

// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.send('Backend Server is running!');
});

// Geocode Reverse Route (OpenStreetMap Nominatim)
app.get('/api/geocode/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng parameters are required' });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: { 'User-Agent': 'FoodsOradeaApp/1.0 (delivery@foodsoradea.ro)' }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'Geocoding service unavailable' });
    }

    const data = await response.json();
    const addr = data.address || {};
    
    // Format clean street and area for Oradea
    const street = addr.road || addr.pedestrian || addr.footway || addr.suburb || '';
    const number = addr.house_number ? ` Nr. ${addr.house_number}` : '';
    const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || '';
    const city = addr.city || addr.town || addr.municipality || 'Oradea';
    
    let cleanAddress = [street + number, neighborhood, city].filter(Boolean).join(', ');
    if (!cleanAddress) cleanAddress = data.display_name || 'Oradea, România';

    res.status(200).json({
      success: true,
      formattedAddress: cleanAddress,
      displayName: data.display_name,
      addressDetails: addr,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ success: false, error: 'Internal geocoding error' });
  }
});

// Geocode Search Route (OpenStreetMap Nominatim bounded to Oradea)
app.get('/api/geocode/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Query parameter q is required' });
    }

    // Search query bounded to Oradea bounding box [minLon, maxLat, maxLon, minLat]
    const query = `${q.trim()}, Oradea, Romania`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&bounded=1&viewbox=21.8428,47.1421,22.0322,47.0070&limit=6&addressdetails=1`,
      {
        headers: { 'User-Agent': 'FoodsOradeaApp/1.0 (delivery@foodsoradea.ro)' }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'Search geocoding unavailable' });
    }

    const data = await response.json();
    const results = data.map(item => {
      const addr = item.address || {};
      const street = addr.road || addr.pedestrian || addr.footway || item.display_name.split(',')[0];
      const number = addr.house_number ? ` Nr. ${addr.house_number}` : '';
      const neighborhood = addr.suburb || addr.neighbourhood || '';
      const label = [street + number, neighborhood, 'Oradea'].filter(Boolean).join(', ');

      return {
        name: label,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type
      };
    });

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Search geocode error:', error);
    res.status(500).json({ success: false, error: 'Internal search geocoding error' });
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, mobile, address, deliveryLocation, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const newUser = new User({ fullName, email, mobile, address, deliveryLocation, password });
    await newUser.save();

    res.status(201).json({ 
      success: true, 
      user: { 
        id: newUser._id, 
        fullName: newUser.fullName, 
        email: newUser.email, 
        mobile: newUser.mobile, 
        address: newUser.address,
        deliveryLocation: newUser.deliveryLocation
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(400).json({ success: false, error: 'Invalid password' });
    }

    res.status(200).json({ 
      success: true, 
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        mobile: user.mobile, 
        address: user.address,
        deliveryLocation: user.deliveryLocation 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// Create Order Route
app.post('/api/orders', async (req, res) => {
  try {
    const count = await Order.countDocuments();
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(count + 1).padStart(3, '0');
    const orderId = `ORD-${dateStr}-${seq}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = new Order({ ...req.body, orderId });
    await newOrder.save();

    // Fetch user to get email and send confirmation
    try {
      if (req.body.customerId && req.body.customerId !== 'guest') {
        const user = await User.findById(req.body.customerId);
        if (user && user.email) {
          const { sendOrderConfirmationEmail } = require('./utils/emailUtils');
          await sendOrderConfirmationEmail(user.email, newOrder);
        }
      }
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
    }

    res.status(201).json({ success: true, orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all Orders Route (For POS)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update Order Status Route
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get User Orders Route (For Order History)
app.get('/api/orders/user/:id', async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all Users Route (For Admin)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add User Route (For Admin)
app.post('/api/users', async (req, res) => {
  try {
    const { fullName, email, mobile, address, password } = req.body;
    
    if (!fullName || !email || !mobile || !address || !password) {
      return res.status(400).json({ success: false, error: 'All fields (Name, Email, Mobile, Address, Password) are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const newUser = new User({ fullName, email, mobile, address, password });
    await newUser.save();

    res.status(201).json({ 
      success: true, 
      user: { 
        id: newUser._id, 
        _id: newUser._id, 
        fullName: newUser.fullName, 
        email: newUser.email, 
        mobile: newUser.mobile, 
        address: newUser.address,
        createdAt: newUser.createdAt
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// Update User Route
app.put('/api/users/:id', async (req, res) => {
  try {
    const { fullName, address, mobile, password, deliveryLocation } = req.body;
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (address) updateData.address = address;
    if (mobile) updateData.mobile = mobile;
    if (password) updateData.password = password;
    if (deliveryLocation) updateData.deliveryLocation = deliveryLocation;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      user: { 
        id: updatedUser._id, 
        _id: updatedUser._id, 
        fullName: updatedUser.fullName, 
        email: updatedUser.email, 
        mobile: updatedUser.mobile, 
        address: updatedUser.address,
        deliveryLocation: updatedUser.deliveryLocation,
        createdAt: updatedUser.createdAt
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete User Route (For Admin)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

const Product = require('./models/Product');

// Get Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add Product
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product({ ...req.body, id: Date.now().toString() });
    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Helper to find product by string id or MongoDB _id
const getProductFilter = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ id: id }, { _id: id }] }
    : { id: id };
};

// Update Product
app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(getProductFilter(req.params.id), req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.status(200).json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Toggle Availability (Blur / Unblur item)
app.patch('/api/products/:id/toggle-availability', async (req, res) => {
  try {
    const product = await Product.findOne(getProductFilter(req.params.id));
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const nextState = typeof req.body.isAvailable === 'boolean' 
      ? req.body.isAvailable 
      : (product.isAvailable === false ? true : false);
    product.isAvailable = nextState;
    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findOneAndDelete(getProductFilter(req.params.id));
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
