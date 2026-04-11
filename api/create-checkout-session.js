// 使用 require 引入 Stripe
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 使用 module.exports 匯出函數
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { itemName, amount, bookingId, currentUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'alipay', 'wechat_pay'], 
      
      // 微信支付在網頁端跳轉必須加上這個 options 設定，否則會報錯
      payment_method_options: {
        wechat_pay: {
          client: 'web', 
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: { name: itemName },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${currentUrl}?success=true&booking_id=${bookingId}`,
      cancel_url: `${currentUrl}?canceled=true`,
      metadata: { bookingId },
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe API 錯誤:", err);
    res.status(500).json({ error: err.message });
  }
};