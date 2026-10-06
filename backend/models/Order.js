const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id: String,
  title: String,
  price: Number,
  quantity: Number,
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerId: String,
  customerName: String,
  customerPhone: String,
  deliveryAddress: String,
  items: [orderItemSchema],
  subtotal: Number,
  deliveryFee: Number,
  totalDue: Number,
  paymentMethod: String,
  orderStatus: { type: String, default: 'NEW' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
