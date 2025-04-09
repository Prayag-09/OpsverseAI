import { db } from '../postgres';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { userSubscriptions } from '../postgres/schema';

export const checkSubscription = async () => {
	try {
		const { userId } = await auth();
		if (!userId) {
			console.warn('🚫 checkSubscription: No user ID found');
			return false;
		}

		const [subscription] = await db
			.select()
			.from(userSubscriptions)
			.where(eq(userSubscriptions.userId, userId));

		if (!subscription) {
			console.info(`ℹ️ No subscription found for user: ${userId}`);
			return false;
		}

		if (!subscription.stripeCurrentPeriodEnd) {
			console.info(`ℹ️ Subscription exists but no period end date`);
			return false;
		}

		const isActive =
			new Date(subscription.stripeCurrentPeriodEnd).getTime() > Date.now();

		return isActive;
	} catch (error) {
		console.error('❌ checkSubscription error:', error);
		return false;
	}
};
