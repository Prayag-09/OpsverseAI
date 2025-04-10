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

	const { userId } = await auth();
	const user = await currentUser();

	try {
		if (!userId || !user) {
			console.error('❌ Unauthorized: No userId or user', { userId, user });
			return new NextResponse('Unauthorized', { status: 401 });
		}

		if (userIdParam && userIdParam !== userId) {
			console.warn('⚠️ Unauthorized: User ID mismatch', {
				userIdParam,
				userId,
			});
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

			try {
				const billingPortal = await stripe.billingPortal.sessions.create({
					customer: subscription.stripeCustomerId,
					return_url: baseUrl,
				});
				console.log('✅ Redirecting to Customer Portal:', billingPortal.url);
				return NextResponse.json({ url: billingPortal.url });
			} catch (error: any) {
				if (error.code === 'resource_missing') {
					console.error(
						'❌ Invalid customer ID:',
						subscription.stripeCustomerId,
						error
					);
					return NextResponse.json(
						{ error: 'No such customer', details: error.message },
						{ status: 404 }
					);
				}
				throw error;
			}
		}

		if (!subscription?.stripeCustomerId) {
			const email = user.emailAddresses[0]?.emailAddress;
			if (!email) {
				console.error('❌ Email not found for user:', userId);
				return new NextResponse('Email not found', { status: 400 });
			}

			console.log('Creating checkout session for userId:', userId); // Debug log
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
					userId: userId || '',
				},
			});

			console.log('✅ Stripe Checkout Session created:', checkoutSession.id, {
				metadata: checkoutSession.metadata,
			}); // Log metadata to verify
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
			error.message ?? error,
			{ userId }
		);
		if (error.message.includes('No configuration provided')) {
			return new NextResponse(
				'Customer Portal not configured. Please set up in Stripe Dashboard: https://dashboard.stripe.com/test/settings/billing/portal',
				{ status: 500 }
			);
		}
		return new NextResponse('Internal Server Error', { status: 500 });
	}
};
