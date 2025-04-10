import { db } from '@/lib/postgres';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { userSubscriptions } from '@/lib/postgres/schema';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get('userId');

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { userId: authenticatedUserId } = await auth();
		if (!authenticatedUserId || authenticatedUserId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const [subscription] = await db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.userId, userId));

		if (!subscription) {
			return NextResponse.json({ isActive: false });
		}

		if (!subscription.stripeCurrentPeriodEnd) {
			return NextResponse.json({ isActive: false });
		}

		const isActive =
			new Date(subscription.stripeCurrentPeriodEnd).getTime() > Date.now();

		return NextResponse.json({ isActive });
	} catch (error) {
		console.error('❌ Check subscription error:', error);
		return NextResponse.json(
			{ isActive: false, error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
