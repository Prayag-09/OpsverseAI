'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';

type Props = { isPro: boolean };

const SubscriptionButton = ({ isPro }: Props) => {
	const [loading, setLoading] = useState(false);

	const handleSub = async () => {
		try {
			setLoading(true);
			toast.info(
				isPro
					? 'Redirecting to Stripe portal...'
					: 'Creating Stripe checkout session...'
			);

			const response = await axios.get('/api/stripe');

			if (response.data?.url) {
				window.location.href = response.data.url;
			} else {
				throw new Error('No URL returned from Stripe.');
			}
		} catch (error: any) {
			console.error('Subscription redirect error:', error);
			toast.error('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			disabled={loading}
			onClick={handleSub}
			variant='outline'
			className='w-full'>
			{loading
				? isPro
					? 'Redirecting...'
					: 'Processing...'
				: isPro
				? 'Manage Subscription'
				: 'Upgrade to Pro'}
		</Button>
	);
};

export default SubscriptionButton;
