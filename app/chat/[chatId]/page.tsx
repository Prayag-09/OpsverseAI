// chat/[chatId]/page.tsx
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
	if (!params?.chatId || isNaN(Number(params.chatId))) notFound();

	const numericChatId = parseInt(params.chatId);
	const { userId } = await auth();
	if (!userId) redirect('/sign-in');

	const _chats = await db
		.select()
		.from(chats)
		.where(eq(chats.userId, userId))
		.orderBy(chats.createdAt);

	if (!_chats || _chats.length === 0) redirect('/');

	const currentChat = _chats.find((chat) => chat.id === numericChatId);
	if (!currentChat || !currentChat.pdfUrl) notFound();

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
