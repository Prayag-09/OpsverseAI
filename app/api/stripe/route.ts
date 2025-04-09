import { db } from '@/lib/postgres';
import { userSubscriptions } from '@/lib/postgres/schema';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/stripe';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

const baseUrl = process.env.NEXT_BASE_URL || 'http://localhost:3000';

export const GET = async () => {
	try {
		const { userId } = await auth();
		const user = await currentUser();

		if (!userId || !user) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const [subscription] = await db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.userId, userId));

		// 👇 User already has a Stripe customer, redirect to billing portal
		if (subscription?.stripeCustomerId) {
			const billingPortal = await stripe.billingPortal.sessions.create({
				customer: subscription.stripeCustomerId,
				return_url: baseUrl,
			});
			return NextResponse.json({ url: billingPortal.url });
		}

		// 👇 No customer — create a checkout session
		const checkoutSession = await stripe.checkout.sessions.create({
			success_url: `${baseUrl}?success=true`,
			cancel_url: `${baseUrl}?canceled=true`,
			payment_method_types: ['card'],
			mode: 'subscription',
			billing_address_collection: 'auto',
			customer_email: user.emailAddresses[0]?.emailAddress ?? undefined,
			line_items: [
				{
					price_data: {
						currency: 'USD',
						product_data: {
							name: 'OpsVerseAI Pro',
							description: 'Unlimited PDF chat sessions',
						},
						unit_amount: 2000, // $20.00
						recurring: {
							interval: 'month',
						},
					},
					quantity: 1,
				},
			],
			metadata: {
				userId,
			},
		});

		return NextResponse.json({ url: checkoutSession.url });
	} catch (error: any) {
		console.error('❌ Stripe checkout error:', error.message ?? error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
};
