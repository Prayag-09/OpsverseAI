'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

type Props = {
	initialIsPro?: boolean;
};

const SubscriptionButton = ({ initialIsPro = false }: Props) => {
	const [loading, setLoading] = useState(false);
	const [isPro, setIsPro] = useState(initialIsPro);
	const { userId, isLoaded } = useAuth();

	useEffect(() => {
		if (isLoaded && userId) {
			const fetchSubscriptionStatus = async () => {
				try {
					const response = await axios.get('/api/check-subscription', {
						params: { userId },
					});
					setIsPro(response.data.isActive || false);
				} catch (error) {
					console.error('Failed to fetch subscription status:', error);
					setIsPro(false);
				}
			};
			fetchSubscriptionStatus();
		}
	}, [isLoaded, userId]);

	const handleSub = async () => {
		try {
			setLoading(true);
			toast.info(
				isPro
					? 'Redirecting to Stripe Customer Portal...'
					: 'Creating Stripe checkout session...'
			);

			const response = await axios.get('/api/stripe', {
				params: {
					userId: userId,
					isManage: isPro,
				},
			});

			if (response.data?.url) {
				window.location.href = response.data.url;
			} else {
				throw new Error('No URL returned from Stripe.');
			}
		} catch (error: any) {
			console.error('Subscription redirect error:', error);
			if (error.response?.data?.error === 'No such customer') {
				toast.error(
					'Subscription not found. Please upgrade or contact support.'
				);
			} else {
				toast.error('Something went wrong. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			disabled={loading}
			onClick={handleSub}
			size='lg'
			className={`px-6 py-3 font-semibold text-white rounded-xl transition-all duration-200 backdrop-blur-md
        ${
					isPro
						? 'bg-gradient-to-r from-gray-700 to-gray-900 border border-gray-600 hover:shadow-md'
						: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 hover:bg-purple-600/30 hover:shadow-purple-600/40'
				}
    `}>
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
