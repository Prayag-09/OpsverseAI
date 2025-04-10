import { db } from '@/lib/postgres';
import { userSubscriptions } from '@/lib/postgres/schema';
import { stripe } from '@/lib/stripe/stripe';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
	const body = await req.text();
	const signature = (await headers()).get('Stripe-Signature') as string;

	let event: Stripe.Event;

	// Verify webhook signature
	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SIGNING_SECRET as string
		);
	} catch (err) {
		console.error('❌ Webhook signature verification failed:', err);
		return new NextResponse('Webhook Error', { status: 400 });
	}

	// Handle checkout.session.completed event
	if (event.type === 'checkout.session.completed') {
		try {
			const session = event.data.object as Stripe.Checkout.Session;
			const userId = session.metadata?.userId;
			const subscriptionId = session.subscription as string;

			// Validate required fields
			if (!userId || !subscriptionId) {
				console.error('❌ Missing userId or subscription ID', { session });
				return new NextResponse('Missing required fields', { status: 400 });
			}

			// Retrieve subscription from Stripe
			const subscriptionResponse = await stripe.subscriptions.retrieve(
				subscriptionId
			);
			const subscription = subscriptionResponse as Stripe.Subscription;

			// Access current_period_end safely
			const periodEnd = subscription.items.data[0]?.current_period_end;
			if (!periodEnd || typeof periodEnd !== 'number') {
				console.error('❌ Invalid current_period_end:', {
					periodEnd,
					subscription,
				});
				return new NextResponse('Invalid subscription', { status: 500 });
			}

			// Validate customer exists
			const customer = await stripe.customers.retrieve(
				subscription.customer as string
			);
			if (customer.deleted) {
				console.error('❌ Customer deleted in Stripe:', subscription.customer);
				return new NextResponse('Customer deleted', { status: 400 });
			}

			// Insert or update subscription in database
			await db
				.insert(userSubscriptions)
				.values({
					userId,
					stripeSubscriptionId: subscription.id,
					stripeCustomerId: subscription.customer as string,
					stripePriceId: subscription.items.data[0].price.id,
					stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
				})
				.onConflictDoUpdate({
					target: userSubscriptions.userId,
					set: {
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: subscription.customer as string,
						stripePriceId: subscription.items.data[0].price.id,
						stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
					},
				});

			console.log('✅ Subscription created/updated:', {
				userId,
				subscriptionId,
			});
		} catch (err) {
			console.error('❌ Subscription creation error:', err);
			return new NextResponse('Subscription error', { status: 500 });
		}
	}

	// Handle invoice.payment_succeeded event
	if (event.type === 'invoice.payment_succeeded') {
		try {
			const invoice: any = event.data.object as Stripe.Invoice;
			const subscriptionId = invoice.subscription as string;

			// Validate subscription ID
			if (!subscriptionId) {
				console.warn('⚠️ No subscription ID in invoice', { invoice });
				return new NextResponse('Missing subscription ID', { status: 400 });
			}

			// Retrieve subscription from Stripe
			const subscriptionResponse = await stripe.subscriptions.retrieve(
				subscriptionId
			);
			const subscription = subscriptionResponse as Stripe.Subscription;

			// Access current_period_end safely
			const periodEnd = subscription.items.data[0]?.current_period_end;
			if (!periodEnd || typeof periodEnd !== 'number') {
				console.error('❌ Invalid current_period_end:', {
					periodEnd,
					subscription,
				});
				return new NextResponse('Invalid subscription', { status: 500 });
			}

			// Update subscription in database
			await db
				.update(userSubscriptions)
				.set({
					stripePriceId: subscription.items.data[0].price.id,
					stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
				})
				.where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

			console.log('✅ Subscription updated for payment:', { subscriptionId });
		} catch (err) {
			console.error('❌ Subscription update error:', err);
			return new NextResponse('Update error', { status: 500 });
		}
	}

	// Handle customer.subscription.deleted (optional)
	if (event.type === 'customer.subscription.deleted') {
		try {
			const subscription = event.data.object as Stripe.Subscription;
			const subscriptionId = subscription.id;

			await db
				.delete(userSubscriptions)
				.where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId));

			console.log('✅ Subscription deleted from database:', { subscriptionId });
		} catch (err) {
			console.error('❌ Subscription deletion error:', err);
			return new NextResponse('Deletion error', { status: 500 });
		}
	}

	return new NextResponse(null, { status: 200 });
}
