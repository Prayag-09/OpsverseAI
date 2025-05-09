import FileUploadButton from '@/components/buttons/FileUploadButton';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import {
	ArrowRight,
	LogIn,
	Sparkles,
	FileText,
	Lightbulb,
	Zap,
} from 'lucide-react';
import { checkSubscription } from '@/lib/subscription/sub';
import SubscriptionButton from '@/components/buttons/SubscriptionButton';
import { db } from '@/lib/postgres/index';
import { Chat as chats } from '@/lib/postgres/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function Home() {
	const { userId } = await auth();
	const isAuthenticated = !!userId;
	let isPremiumUser = false;
	let mostRecentChat;

	if (isAuthenticated) {
		try {
			const subscriptionStatus = await checkSubscription();
			isPremiumUser =
				typeof subscriptionStatus === 'boolean' ? subscriptionStatus : false;

			const latestInteraction = await db
				.select()
				.from(chats)
				.where(eq(chats.userId, userId!))
				.orderBy(chats.createdAt)
				.limit(1);

			if (latestInteraction.length > 0) {
				mostRecentChat = latestInteraction[0];
			}
		} catch (error) {
			console.error('Error retrieving user data:', error);
		}
	}

	return (
		<main className='relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12 z-10'>
			<div className='absolute top-4 right-4 z-20'>
				<UserButton />
			</div>

			<section className='flex flex-col items-center max-w-4xl z-10 space-y-10'>
				<h1 className='font-black text-4xl sm:text-5xl leading-tight text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]'>
					TL;DR? Chat With Your PDF 📄💬
				</h1>
				<h1 className='font-black text-2xl sm:text-4xl leading-tight text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]'>
					Welcome to OpsverseAI
				</h1>
				<p className='text-lg sm:text-xl font-medium text-gray-300 leading-relaxed max-w-2xl'>
					Upload any PDF—textbooks, reports, or research documents—and ask
					questions effortlessly. OpsVerseAI delivers precise, document-based
					responses.
				</p>

				<div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center items-center'>
					{isAuthenticated && (
						<>
							{mostRecentChat && (
								<Link
									href={`/chat/${mostRecentChat.id}`}
									className='w-full sm:w-auto'>
									<Button
										size='lg'
										className='w-full sm:w-auto bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-white font-semibold rounded-lg shadow-md hover:shadow-indigo-500/30 transition-all duration-200'>
										<ArrowRight className='mr-2 w-4 h-4' /> Resume Last Session
									</Button>
								</Link>
							)}
							<div className='w-full sm:w-auto'>
								<SubscriptionButton initialIsPro={isPremiumUser} />
							</div>
						</>
					)}
				</div>

				<div className='flex flex-col gap-6 w-full max-w-md'>
					{!isAuthenticated ? (
						<Link href='/sign-in'>
							<Button
								size='xl'
								className='w-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/40 text-white font-bold rounded-lg shadow-md hover:shadow-purple-500/30 transition-all duration-200'>
								<LogIn className='mr-2 w-5 h-5' /> Get Started
							</Button>
						</Link>
					) : (
						<FileUploadButton disabled={!isPremiumUser} />
					)}

					{isAuthenticated && !isPremiumUser && (
						<div className='text-sm text-yellow-300 flex flex-col items-center justify-center gap-3'>
							<div className='flex items-center gap-2'>
								<Sparkles className='w-4 h-4 text-yellow-400' />
								<span className='font-medium'>
									Enhance your experience with{' '}
									<span className='font-bold text-yellow-200'>Premium</span>.
								</span>
							</div>
							<div className='w-full max-w-md bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-500/40 rounded-lg p-4 text-center shadow-md'>
								<p className='mb-2 text-yellow-200 font-medium'>
									For testing, use this Stripe test card to access Premium
									features:
								</p>
								<strong className='text-base text-yellow-100 tracking-wide'>
									4242 4242 4242 4242
								</strong>
								<p className='text-xs text-yellow-300 mt-1'>
									Valid with any future expiry date, CVC, and ZIP code.
								</p>
								<span className='text-xs text-yellow-400 mt-2 block'>
									Note: Refresh the page after payment to update your status.
								</span>
							</div>
						</div>
					)}
				</div>

				<div className='mt-12 text-gray-300 text-sm max-w-xl bg-gray-800/30 p-6 rounded-lg border border-gray-700 shadow-md'>
					<h2 className='flex items-center justify-center gap-2 text-lg font-semibold text-indigo-300 mb-4'>
						<Lightbulb className='w-5 h-5 text-yellow-400' /> How It Works
					</h2>
					<ul className='list-disc list-inside text-left space-y-3 text-sm sm:text-base'>
						<li className='flex items-center gap-2'>
							<FileText className='w-4 h-4 text-green-400' />
							Upload any PDF document for analysis.
						</li>
						<li className='flex items-center gap-2'>
							<Zap className='w-4 h-4 text-indigo-400' />
							Pose questions or request summaries with natural language.
						</li>
						<li className='flex items-center gap-2'>
							<Lightbulb className='w-5 h-5 text-yellow-400' />
							Receive accurate, context-aware responses directly from your file.
						</li>
					</ul>
				</div>

				<div className='mt-8 text-gray-400 text-sm'>
					<span className='flex items-center gap-2'>
						<Sparkles className='w-4 h-4 text-indigo-400' />
						Ready to begin? Upload a document or upgrade to Premium for more.
					</span>
				</div>
			</section>
		</main>
	);
}
