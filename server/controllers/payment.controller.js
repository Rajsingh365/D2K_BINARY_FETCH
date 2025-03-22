import Stripe from 'stripe';


export const createCheckoutSession = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET);
    console.log('stripe', process.env.STRIPE_SECRET);
    const { products } = req.body;
    console.log('products', products);

    const lineItems = products.map(product => {
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image]
          },
          unit_amount: Math.round(product.price * 100), // Convert price to cents
        },
        quantity: 1
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
