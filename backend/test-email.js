require('dotenv').config();
const { sendOrderConfirmationEmail } = require('./utils/emailUtils');

async function test() {
  console.log("Testing email with:", process.env.EMAIL_USER);
  const result = await sendOrderConfirmationEmail('nadunweerakoon48@gmail.com', {
    orderId: 'TEST-123',
    items: [{ title: 'Burger', quantity: 2, price: 5 }],
    subtotal: 10,
    deliveryFee: 2,
    totalDue: 12,
    deliveryAddress: 'Test Address'
  });
  console.log("Result:", result);
}
test();
