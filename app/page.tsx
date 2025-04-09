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
		<main className='relative w-screen min-h-screen flex flex-col items-center justify-center overflow-hidden text-center px-6'>
			<div className='flex flex-col items-center'>
				<div className='flex items-center gap-3'>
					<h1 className='font-black text-5xl sm:text-6xl leading-tight drop-shadow-lg text-white'>
						Chat with any PDF
					</h1>
					<UserButton afterSignOutUrl='/' />
				</div>

				<div className='flex gap-4 mt-4'>
					{isAuth && firstChat && (
						<>
							<Link href={`/chat/${firstChat.id}`}>
								<Button
									size='lg'
									className='bg-indigo-500/20 hover:bg-indigo-600/30 backdrop-blur-md border border-indigo-500/50 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-indigo-500/40'>
									Go to Chats <ArrowRight className='ml-2 w-4 h-4' />
								</Button>
							</Link>
							<SubscriptionButton isPro={isPro} />
						</>
					)}
				</div>

				<h3 className='text-lg sm:text-xl font-semibold mt-6 text-gray-300 leading-relaxed max-w-xl'>
					Join millions of students, researchers and professionals to instantly
					answer questions and understand research with AI
				</h3>

				<div className='mt-6 flex flex-col gap-4 w-full max-w-md'>
					{isAuth ? (
						<FileUploadButton />
					) : (
						<Link href='/sign-in'>
							<Button
								size='xl'
								className='w-full bg-purple-500/20 hover:bg-purple-600/30 backdrop-blur-md border border-purple-500/50 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-purple-600/40'>
								Login to get Started!
								<LogIn className='w-4 h-4 ml-2' />
							</Button>
						</Link>
					)}
				</div>
			</div>
		</main>
	);
}
