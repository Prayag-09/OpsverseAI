import { db } from '@/lib/postgres';
import { userSubscriptions } from '@/lib/postgres/schema';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/stripe';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

const baseUrl = process.env.NEXT_BASE_URL || 'http://localhost:3000';

export const GET = async (req: Request) => {
	const { searchParams } = new URL(req.url);
	const isManage = searchParams.get('isManage') === 'true';
	const userIdParam = searchParams.get('userId');

	try {
		const { userId } = await auth();
		const user = await currentUser();

		if (!userId || !user) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		if (userIdParam && userIdParam !== userId) {
			return new NextResponse('Unauthorized: User ID mismatch', {
				status: 401,
			});
		}

		const [subscription] = await db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.userId, userId));

		if (isManage) {
			if (!subscription?.stripeCustomerId) {
				console.warn('⚠️ No Stripe customer ID found for user:', userId);
				return new NextResponse('No subscription found to manage', {
					status: 404,
				});
			}

			const billingPortal = await stripe.billingPortal.sessions.create({
				customer: subscription.stripeCustomerId,
				return_url: baseUrl,
			});
			console.log('✅ Redirecting to Customer Portal:', billingPortal.url);
			return NextResponse.json({ url: billingPortal.url });
		}

		if (!subscription?.stripeCustomerId) {
			const email = user.emailAddresses[0]?.emailAddress;
			if (!email) {
				return new NextResponse('Email not found', { status: 400 });
			}

			const checkoutSession = await stripe.checkout.sessions.create({
				success_url: `${baseUrl}?success=true`,
				cancel_url: `${baseUrl}?canceled=true`,
				payment_method_types: ['card'],
				mode: 'subscription',
				billing_address_collection: 'auto',
				customer_email: email,
				line_items: [
					{
						price_data: {
							currency: 'USD',
							product_data: {
								name: 'OpsVerseAI Pro',
								description: 'Unlimited PDF chat sessions',
							},
							unit_amount: 2000,
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

			console.log('✅ Stripe Checkout Session created:', checkoutSession.id);
			return NextResponse.json({ url: checkoutSession.url });
		} else {
			console.warn(
				'⚠️ Subscription already exists, redirecting to Customer Portal:',
				userId
			);
			const billingPortal = await stripe.billingPortal.sessions.create({
				customer: subscription.stripeCustomerId,
				return_url: baseUrl,
			});
			return NextResponse.json({ url: billingPortal.url });
		}
	} catch (error: any) {
		console.error(
			'❌ Stripe checkout or portal error:',
			error.message ?? error
		);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
};
