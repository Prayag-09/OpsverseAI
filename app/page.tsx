import FileUploadButton from '@/components/buttons/FileUploadButton';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';
import { checkSubscription } from '@/lib/subscription/sub';
import SubscriptionButton from '@/components/buttons/SubscriptionButton';
import { db } from '@/lib/postgres/index';
import { Chat as chats } from '@/lib/postgres/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function Home() {
	const { userId } = await auth();
	const isAuth = !!userId;
	let isPro = false;
	let firstChat;

	if (isAuth) {
		try {
			const subscriptionResult = await checkSubscription();
			isPro =
				typeof subscriptionResult === 'boolean' ? subscriptionResult : false;

			const chatData = await db
				.select()
				.from(chats)
				.where(eq(chats.userId, userId!))
				.orderBy(chats.createdAt)
				.limit(1);

			if (chatData.length > 0) {
				firstChat = chatData[0];
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	}

	return (
		<main className='relative w-screen min-h-screen flex flex-col items-center justify-center text-center px-6'>
			{/* User Button in top right */}
			<div className='absolute top-4 right-4'>
				<UserButton />
			</div>

			{/* Center Content */}
			<div className='flex flex-col items-center mt-12'>
				<h1 className='font-black text-5xl sm:text-6xl leading-tight text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]'>
					Chat with any PDF
				</h1>

				<h3 className='text-lg sm:text-xl font-medium mt-4 text-gray-300 leading-relaxed max-w-xl'>
					Join millions of students, researchers, and professionals to instantly
					answer questions and understand research with AI
				</h3>

				{/* Authenticated buttons */}
				<div className='flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto justify-center items-center'>
					{isAuth && (
						<>
							{firstChat && (
								<Link
									href={`/chat/${firstChat.id}`}
									className='w-full sm:w-auto'>
									<Button
										size='lg'
										className='w-full sm:w-auto bg-indigo-600/20 hover:bg-indigo-600/40 backdrop-blur-md border border-indigo-500/50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200'>
										Go to Chats <ArrowRight className='ml-2 w-4 h-4' />
									</Button>
								</Link>
							)}
							<div className='w-full sm:w-auto'>
								<SubscriptionButton initialIsPro={isPro} />
							</div>
						</>
					)}
				</div>

				{/* Upload or Login */}
				<div className='mt-8 flex flex-col gap-4 w-full max-w-md'>
					{isAuth ? (
						<FileUploadButton disabled={!isPro} />
					) : (
						<Link href='/sign-in'>
							<Button
								size='xl'
								className='w-full bg-purple-500/20 hover:bg-purple-600/30 backdrop-blur-md border border-purple-500/50 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-600/40 transition-all duration-200'>
								Login to get Started!
								<LogIn className='w-4 h-4 ml-2' />
							</Button>
						</Link>
					)}
					{!isPro && isAuth && (
						<p className='text-sm text-yellow-400 text-center'>
							Upload is disabled. Upgrade to Pro to unlock this feature!
						</p>
					)}
				</div>
			</div>
		</main>
	);
}
