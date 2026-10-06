const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80' },
  unit: { type: String, default: '1 portion' },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
