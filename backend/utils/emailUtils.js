const nodemailer = require('nodemailer');

const sendOrderConfirmationEmail = async (userEmail, orderDetails) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Confirmation - ${orderDetails.orderId}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Your order <strong>${orderDetails.orderId}</strong> has been successfully placed.</p>
        
        <h3>Order Details:</h3>
        <ul>
          ${orderDetails.items.map(item => `<li>${item.title} (x${item.quantity}) - $${item.price}</li>`).join('')}
        </ul>
        <p><strong>Subtotal:</strong> $${orderDetails.subtotal}</p>
        <p><strong>Delivery Fee:</strong> $${orderDetails.deliveryFee}</p>
        <p><strong>Total:</strong> $${orderDetails.totalDue}</p>
        
        <p>Delivery Address: ${orderDetails.deliveryAddress}</p>
        
        <p>We will notify you once your order is on the way.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail
};
