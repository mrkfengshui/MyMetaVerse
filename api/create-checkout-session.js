import Stripe from 'stripe';

// 讀取 Vercel 環境變數中的私鑰
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { itemName, amount, bookingId, currentUrl } = req.body;

    // 向 Stripe 請求建立結帳頁面
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'alipay'], // 支援信用卡、支付寶
      line_items: [
        {
          price_data: {
            currency: 'hkd',
            product_data: { name: itemName },
            unit_amount: Math.round(amount * 100), // Stripe 金額單位是「分」，所以 HK$168 要變成 16800
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // 設定付款成功與取消後的跳轉網址
      success_url: `${currentUrl}?success=true&booking_id=${bookingId}`,
      cancel_url: `${currentUrl}?canceled=true`,
      metadata: { bookingId }, // 紀錄在 Stripe 後台方便對帳
    });

    // 將 session ID 回傳給前端 Vite
    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Stripe API 錯誤:", err);
    res.status(500).json({ error: err.message });
  }
}