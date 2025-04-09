import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { db } from '@/lib/postgres/index';
import { Chat as chats, Message as _messages } from '@/lib/postgres/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/context/context';
import { auth } from '@clerk/nextjs/server';

const gemini = createGoogleGenerativeAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { messages, chatId } = await req.json();
		if (!Array.isArray(messages) || typeof chatId !== 'number') {
			return NextResponse.json(
				{ error: 'Invalid request format' },
				{ status: 400 }
			);
		}

		const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
		if (!chat || chat.userId !== userId || !chat.fileKey) {
			return NextResponse.json(
				{ error: 'Chat not found or unauthorized' },
				{ status: 404 }
			);
		}

		const lastMessage = messages[messages.length - 1];
		if (!lastMessage || typeof lastMessage.content !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid message content' },
				{ status: 400 }
			);
		}

		const context = await getMatches(lastMessage.content, chat.fileKey);
		console.log('Retrieved context:', context); // Debug log

		const systemPrompt = `You are a helpful AI assistant designed to assist users with questions about PDFs uploaded to a chat application powered by Pinecone and Vercel. Your traits include expert knowledge, helpfulness, cleverness, and articulateness. You are friendly, kind, and inspiring, providing vivid and thoughtful responses. Use the following context from the PDF to answer the user's question. If the context is empty or doesn’t contain the answer, respond with "I'm sorry, but I don't know the answer to that question based on the provided context" and avoid inventing information.

START CONTEXT BLOCK
${context || 'No context available'}
END CONTEXT BLOCK`;

		const result = await streamText({
			model: gemini('models/gemini-1.5-pro'),
			system: systemPrompt,
			messages: messages.map((msg: { role: string; content: string }) => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content,
			})),
			onFinish: async (event) => {
				await db.insert(_messages).values([
					{
						chatId,
						content: lastMessage.content,
						role: 'user',
						createdAt: new Date(),
					},
					{
						chatId,
						content: event.text,
						role: 'assistant',
						createdAt: new Date(),
					},
				]);
			},
		});

		return result.toDataStreamResponse();
	} catch (error) {
		console.error('Chat API error:', error);
		if (error instanceof Error && error.message.includes('rate limit')) {
			return NextResponse.json(
				{ error: 'Rate limit exceeded' },
				{ status: 429 }
			);
		}
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
