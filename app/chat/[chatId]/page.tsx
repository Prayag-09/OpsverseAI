import ChatComponent from '@/components/layouts/ChatComponent';
import ChatSideBar from '@/components/layouts/ChatSideBar';
import PDFViewer from '@/components/layouts/PDFView';
import { db } from '@/lib/postgres/index';
import { Chat as chats } from '@/lib/postgres/schema';
import { checkSubscription } from '@/lib/subscription/sub';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';

export default async function ChatPage({
	params,
}: {
	params: { chatId: string };
}) {
	// Validate route param
	if (!params?.chatId || isNaN(Number(params.chatId))) {
		notFound();
	}
	const numericChatId = parseInt(params.chatId);

	// Auth check
	const { userId } = await auth();
	if (!userId) {
		redirect('/sign-in');
	}

	// Fetch chats
	const _chats = await db
		.select()
		.from(chats)
		.where(eq(chats.userId, userId))
		.orderBy(chats.createdAt);

	if (!_chats || _chats.length === 0) {
		redirect('/'); // Could redirect to a "no chats" page instead
	}

	const currentChat = _chats.find((chat) => chat.id === numericChatId);
	if (!currentChat || !currentChat.pdfUrl) {
		notFound(); // More specific than redirecting to home
	}

	// Subscription check
	const subscriptionResult = await checkSubscription();
	const isPro =
		typeof subscriptionResult === 'boolean' ? subscriptionResult : false;

	return (
		<div className='flex h-screen overflow-hidden bg-black'>
			{/* Sidebar */}
			<div className='w-64 border-r border-gray-700 bg-[#111827] text-white'>
				<ChatSideBar chats={_chats} chatId={numericChatId} isPro={isPro} />
			</div>

			{/* Main content area */}
			<div className='flex flex-1 overflow-hidden'>
				{/* PDF Viewer */}
				<div className='flex-[5] overflow-y-auto bg-gray-900 p-4'>
					<PDFViewer pdf_url={currentChat.pdfUrl} />
				</div>

				{/* Chat Component */}
				<div className='flex-[3] border-l border-gray-700 bg-gray-900'>
					<ChatComponent chatId={numericChatId} />
				</div>
			</div>
		</div>
	);
}
