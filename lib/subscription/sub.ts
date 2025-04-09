import { db } from '../postgres';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { userSubscriptions } from '../postgres/schema';

export const checkSubscription = async (): Promise<boolean> => {
	const { userId } = await auth();

	if (!userId) throw new Error('Unauthorized');

	const [subscription] = await db
		.select()
		.from(userSubscriptions)
		.where(eq(userSubscriptions.userId, userId));

	if (!subscription || !subscription.stripeCurrentPeriodEnd) return false;

	const isActive =
		new Date(subscription.stripeCurrentPeriodEnd).getTime() > Date.now();

	return isActive;
};
