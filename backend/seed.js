require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const MOCK_PRODUCTS = [
  { id: 'p1', title: 'Dolphin Kottu', price: 35, category: 'Kottu', unit: '1 Portion', tags: ['Spicy', 'Popular'] },
  { id: 'p2', title: 'Chicken Kottu', price: 30, category: 'Kottu', unit: '1 Portion', tags: ['Non-Veg'] },
  { id: 'p3', title: 'Idiyappa Kottu', price: 30, category: 'Kottu', unit: '1 Portion', tags: ['Veg'] },
  { id: 'p4', title: 'Chicken Fried Rice', price: 25, category: 'Fried Rice', unit: '1 Portion', tags: ['Non-Veg', 'Popular'] }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Seed Products
    const count = await Product.countDocuments();
    if (count === 0) {
      for (const p of MOCK_PRODUCTS) {
        const prod = new Product({
          id: p.id,
          title: p.title,
          category: p.category,
          price: p.price,
          unit: p.unit,
          tags: p.tags
        });
        await prod.save();
      }
      console.log('Seeded products');
    }

    // Seed User
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const u = new User({
        fullName: 'Test User',
        email: 'test@example.com',
        mobile: '+94 77 123 4567',
        address: '123 Test Street, Colombo',
        password: 'password123'
      });
      await u.save();
      console.log('Seeded user');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
