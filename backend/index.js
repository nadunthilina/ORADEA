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

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, mobile, address, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const newUser = new User({ fullName, email, mobile, address, password });
    await newUser.save();

    res.status(201).json({ 
      success: true, 
      user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email, mobile: newUser.mobile, address: newUser.address } 
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
      user: { id: user._id, fullName: user.fullName, email: user.email, mobile: user.mobile, address: user.address } 
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

// Update User Route
app.put('/api/users/:id', async (req, res) => {
  try {
    const { address, mobile } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { address, mobile }, 
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.status(200).json({ success: true, user: { id: updatedUser._id, fullName: updatedUser.fullName, email: updatedUser.email, mobile: updatedUser.mobile, address: updatedUser.address } });
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

// Update Product
app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.status(200).json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.params.id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
