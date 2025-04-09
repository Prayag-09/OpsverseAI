import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { db } from '@/lib/postgres/index';
import { Chat as chats, Message as _messages } from '@/lib/postgres/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/context/context';

const gemini = createGoogleGenerativeAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { messages, chatId } = body;

		// Validate input
		if (!Array.isArray(messages) || typeof chatId !== 'number') {
			return NextResponse.json(
				{ error: 'Invalid request format' },
				{ status: 400 }
			);
		}

		// Get chat context
		const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
		if (!chat?.fileKey) {
			return NextResponse.json(
				{ error: 'Chat context not found' },
				{ status: 404 }
			);
		}

		const lastMessage = messages[messages.length - 1];
		const context = await getMatches(lastMessage.content, chat.fileKey);

		// Stream response from Gemini
		const result = await streamText({
			model: gemini('models/gemini-pro'),
			messages: [
				{
					role: 'user' as const,
					content: `CONTEXT:\n${context}\n\nQUESTION:\n${lastMessage.content}`,
				},
			],
			system: `You are a helpful AI assistant that answers questions based strictly on the provided context.
               If the answer isn't in the context, say "I don't know" rather than inventing information.`,
		});

		// Save messages to DB
		const assistantResponse = await result.text;
		await db.insert(_messages).values([
			{
				chatId,
				content: lastMessage.content,
				role: 'user',
				createdAt: new Date(),
			},
			{
				chatId,
				content: assistantResponse,
				role: 'model',
				createdAt: new Date(),
			},
		]);

		return result.toDataStreamResponse();
	} catch (error) {
		console.error('Chat API error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
