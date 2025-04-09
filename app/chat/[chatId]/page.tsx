import ChatComponent from '@/components/layouts/ChatComponent';
import ChatSideBar from '@/components/layouts/ChatSideBar';
import PDFViewer from '@/components/layouts/PDFView';
import { db } from '@/lib/postgres/index';
import { Chat as chats } from '@/lib/postgres/schema';
import { checkSubscription } from '@/lib/subscription/sub';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';

export default async function ChatPage({
	params,
}: {
	params: { chatId: string };
}) {
	// Validate route param
	if (!params?.chatId || isNaN(Number(params.chatId))) {
		return notFound();
	}
	const numericChatId = parseInt(params.chatId);

	// Auth check
	const { userId } = await auth();
	if (!userId) {
		return redirect('/sign-in');
	}

	// Fetch user chats (limit to 100 for performance)
	const _chats = await db
		.select()
		.from(chats)
		.where(eq(chats.userId, userId))
		.orderBy(chats.createdAt)
		.limit(100);

	if (!_chats || _chats.length === 0) {
		return redirect('/');
	}

	const currentChat = _chats.find((chat) => chat.id === numericChatId);
	if (!currentChat) {
		return redirect('/');
	}

	// Subscription check
	const subscriptionResult = await checkSubscription();
	const isPro =
		typeof subscriptionResult === 'boolean' ? subscriptionResult : false;

	// Layout
	return (
		<div className='flex h-screen overflow-hidden'>
			{/* Sidebar */}
			<div className='w-64 border-r border-gray-200 bg-[#111827] text-white'>
				<ChatSideBar chats={_chats} chatId={numericChatId} isPro={isPro} />
			</div>

			{/* Main content area */}
			<div className='flex flex-1 overflow-hidden'>
				{/* PDF Viewer */}
				<div className='flex-[5] overflow-y-auto bg-white p-4'>
					<PDFViewer pdf_url={currentChat.pdfUrl || ''} />
				</div>

				{/* Chat Component */}
				<div className='flex-[3] border-l border-gray-200'>
					<ChatComponent chatId={numericChatId} />
				</div>
			</div>
		</div>
	);
}
