import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_API_KEY as string, {
	apiVersion: '2025-03-31.basil',
	typescript: true,
});
