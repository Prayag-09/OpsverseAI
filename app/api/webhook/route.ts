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

	const session = event.data.object as Stripe.Checkout.Session;

	if (event.type === 'checkout.session.completed') {
		try {
			const subscription: any = await stripe.subscriptions.retrieve(
				session.subscription as string
			);

			const userId = session.metadata?.userId;
			if (!userId) {
				console.error('❌ Missing userId in metadata');
				return new NextResponse('Missing userId', { status: 400 });
			}

			// Upsert: update if user exists, else insert
			await db
				.insert(userSubscriptions)
				.values({
					userId,
					stripeSubscriptionId: subscription.id,
					stripeCustomerId: subscription.customer as string,
					stripePriceId: subscription.items.data[0].price.id,
					stripeCurrentPeriodEnd: new Date(
						subscription.current_period_end * 1000
					),
				})
				.onConflictDoUpdate({
					target: userSubscriptions.userId,
					set: {
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: subscription.customer as string,
						stripePriceId: subscription.items.data[0].price.id,
						stripeCurrentPeriodEnd: new Date(
							subscription.current_period_end * 1000
						),
					},
				});
		} catch (err) {
			console.error('❌ Subscription creation error:', err);
			return new NextResponse('Subscription error', { status: 500 });
		}
	}

	if (event.type === 'invoice.payment_succeeded') {
		try {
			const subscription: any = await stripe.subscriptions.retrieve(
				session.subscription as string
			);

			await db
				.update(userSubscriptions)
				.set({
					stripePriceId: subscription.items.data[0].price.id,
					stripeCurrentPeriodEnd: new Date(
						subscription.current_period_end * 1000
					),
				})
				.where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
		} catch (err) {
			console.error('❌ Subscription update error:', err);
			return new NextResponse('Update error', { status: 500 });
		}
	}

	return new NextResponse(null, { status: 200 });
}
