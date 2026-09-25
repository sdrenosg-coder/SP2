import { config } from '../config.js';
import Stripe from 'stripe';

let stripe = null;
if (config.stripeEnabled) {
  stripe = new Stripe(config.stripeSecretKey);
}

export async function createPaymentIntent({ amount, currency, customerEmail, metadata }) {
  if (!stripe) {
    console.log('[PAYMENT] Stripe not configured. Pay at venue mode.');
    return { mode: 'pay_at_venue', clientSecret: null };
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency || 'usd',
    receipt_email: customerEmail,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return { mode: 'stripe', clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
}

export async function handleWebhook(payload, signature) {
  if (!stripe) return { received: false };
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.stripeWebhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
  console.log('Stripe webhook event:', event.type);
  return { received: true, type: event.type };
}
