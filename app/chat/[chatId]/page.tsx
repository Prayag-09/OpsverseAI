import { db } from '@/lib/postgres/index';
import { Chat as chats } from '@/lib/postgres/schema';
import { checkSubscription } from '@/lib/subscription/sub';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import ChatLayout from '@/components/layouts/ChatLayout';

export default async function ChatPage({
	params,
}: {
	params: { chatId: string };
}) {
	if (!params?.chatId) {
		console.error(
			'❌ Invalid chatId: params is undefined or missing chatId',
			params
		);
		notFound();
	}

	const chatIdStr = params.chatId;
	const numericChatId = Number(chatIdStr);
	if (isNaN(numericChatId)) {
		console.error('❌ ChatId is not a number:', chatIdStr);
		notFound();
	}

	console.log('Processing chatId:', { chatIdStr, numericChatId });

	const { userId } = await auth();
	if (!userId) {
		console.error('❌ No userId found for chat:', numericChatId);
		redirect('/sign-in');
	}

	const _chats = await db
		.select()
		.from(chats)
		.where(eq(chats.userId, userId))
		.orderBy(chats.createdAt);

	if (!_chats || _chats.length === 0) {
		console.warn('⚠️ No chats found for user:', userId);
		redirect('/');
	}

	const currentChat = _chats.find((chat) => chat.id === numericChatId);
	if (!currentChat || !currentChat.pdfUrl) {
		console.error(
			'❌ Current chat not found or missing pdfUrl:',
			numericChatId
		);
		notFound();
	}

	const subscriptionResult = await checkSubscription();
	const isPro =
		typeof subscriptionResult === 'boolean' ? subscriptionResult : false;

	return (
		<ChatLayout
			chats={_chats}
			chatId={numericChatId}
			isPro={isPro}
			currentChatPdfUrl={currentChat.pdfUrl}
			currentChatPdfName={currentChat.pdfName}
		/>
	);
}
