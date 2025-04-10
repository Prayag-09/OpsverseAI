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
			console.error('Error fetching user data:', error);
		}
	}

	return (
		<main className='relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12 z-10'>
			<div className='absolute top-4 right-4 z-20'>
				<UserButton />
			</div>

			<section className='flex flex-col items-center max-w-4xl z-10 space-y-8'>
				<h1 className='font-black text-5xl sm:text-6xl leading-tight text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]'>
					TL;DR? Chat. With. Your. PDFs 📄💬
				</h1>

				<p className='text-lg sm:text-xl font-medium mt-4 text-gray-300 leading-relaxed max-w-2xl'>
					Ditch the scrolling. Upload any PDF — textbook, report, thesis, chaos
					— and just <em>ask</em> stuff. OpsverseAI turns boring docs into
					convos that actually make sense.
				</p>

				<div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center items-center animate-slide-up'>
					{isAuthenticated && (
						<>
							{mostRecentChat && (
								<Link
									href={`/chat/${mostRecentChat.id}`}
									className='w-full sm:w-auto group'>
									<Button
										size='lg'
										className='w-full sm:w-auto bg-indigo-600/30 hover:bg-indigo-600/50 backdrop-blur-md border border-indigo-500/60 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-105'>
										<ArrowRight className='mr-2 w-4 h-4 group-hover:animate-bounce-right' />
										Back to Your Last Chat!
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
								className='w-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 hover:from-purple-600/40 hover:to-indigo-600/40 backdrop-blur-md border border-purple-500/60 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-600/50 transition-all duration-300 hover:scale-105'>
								<LogIn className='mr-2 w-5 h-5 animate-spin-once' />
								Jump In — Free Fun Awaits!
							</Button>
						</Link>
					) : (
						<FileUploadButton disabled={!isPremiumUser} />
					)}

					{isAuthenticated && !isPremiumUser && (
						<div className='text-sm text-yellow-300 flex flex-col items-center justify-center gap-3 animate-pulse-slow'>
							<div className='flex items-center gap-2'>
								<Sparkles className='w-4 h-4 text-yellow-400 animate-bounce-slow' />
								<span className='font-medium'>
									Upgrade to{' '}
									<span className='font-bold text-yellow-200'>Premium</span> to
									unlock full access!
								</span>
							</div>
							<div className='w-full max-w-md bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-500/40 rounded-xl p-4 text-center shadow-md hover:shadow-yellow-500/30 transition-all duration-300'>
								<p className='mb-2 text-yellow-200 font-medium'>
									Just testing? Use the Stripe test card below to explore
									Premium features:
								</p>
								<strong className='text-base text-yellow-100 tracking-wide'>
									4242 4242 4242 4242
								</strong>
								<p className='text-xs text-yellow-300 mt-1'>
									Use any future expiry, any CVC, and any ZIP code.
								</p>
							</div>
						</div>
					)}
				</div>

				<div className='mt-12 text-gray-300 text-sm max-w-xl bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-md animate-fade-in-delay'>
					<h2 className='flex items-center justify-center gap-2 text-lg font-semibold text-indigo-300 mb-4'>
						<Lightbulb className='w-5 h-5 text-yellow-400 animate-pulse' />
						How It Works
					</h2>
					<ul className='list-disc list-inside text-left space-y-3 text-sm sm:text-base'>
						<li className='flex items-center gap-2'>
							<FileText className='w-4 h-4 text-green-400' />
							Upload any PDF — textbooks, reports, or even chaos. We don’t
							judge.
						</li>
						<li className='flex items-center gap-2'>
							<Zap className='w-4 h-4 text-indigo-400 animate-pulse' />
							Ask anything: “Summarize this”, “Explain that diagram”, or get
							insights fast.
						</li>
						<li className='flex items-center gap-2'>
							<Lightbulb className='w-4 h-4 text-yellow-400' />
							Like magic, get intelligent, concise answers straight from your
							PDF.
						</li>
					</ul>
				</div>

				<div className='mt-8 text-gray-400 text-sm flex items-center gap-2 animate-bounce-slow'>
					<Sparkles className='w-4 h-4 text-indigo-400' />
					Excited to try? Upload a file or unlock even more with Premium!
				</div>
			</section>
		</main>
	);
}
