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
			return NextResponse.json(
				{ error: 'Unauthorized access' },
				{ status: 401 }
			);
		}

		const body = await req.json();
		const { messages, chatId } = body;
		if (!Array.isArray(messages) || !Number.isInteger(chatId)) {
			return NextResponse.json(
				{
					error:
						'Invalid request: messages must be an array and chatId must be an integer',
				},
				{ status: 400 }
			);
		}

		const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
		if (!chat || chat.userId !== userId || !chat.fileKey) {
			return NextResponse.json(
				{ error: 'Chat not found or access denied' },
				{ status: 404 }
			);
		}

		const lastMessage = messages[messages.length - 1];
		if (
			!lastMessage ||
			typeof lastMessage.content !== 'string' ||
			!lastMessage.content.trim()
		) {
			return NextResponse.json(
				{ error: 'Invalid message: content must be a non-empty string' },
				{ status: 400 }
			);
		}
		const context = await getMatches(lastMessage.content, chat.fileKey);
		console.log('Retrieved context:', context);

		const systemPrompt = `
		You are a helpful, knowledgeable, and friendly AI assistant. Your role is to assist users with questions about the contents of a PDF they uploaded to this chat application.
		
		Use **only** the information from the provided CONTEXT section to answer questions. Be accurate, concise, and clear. If the answer is not found in the context, respond with:
		"I don’t have enough information from the PDF to answer that accurately."
		
		Do not make assumptions or generate content beyond what is provided.
		
		---
		
		**CONTEXT START**
		${context || 'No relevant context available'}
		**CONTEXT END**
		`;

		const result = streamText({
			model: gemini('models/gemini-1.5-pro'),
			system: systemPrompt,
			messages: messages.map((msg: { role: string; content: string }) => ({
				role: msg.role as 'user' | 'assistant',
				content: msg.content,
			})),
			onFinish: async (event) => {
				try {
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
				} catch (dbError) {
					console.error('Failed to save messages:', dbError);
				}
			},
		});

		return result.toDataStreamResponse();
	} catch (error) {
		console.error('Chat API error:', error);
		if (error instanceof Error) {
			if (error.message.includes('rate limit')) {
				return NextResponse.json(
					{ error: 'Too many requests, please try again later' },
					{ status: 429 }
				);
			}
			return NextResponse.json(
				{ error: 'Something went wrong', details: error.message },
				{ status: 500 }
			);
		}
		return NextResponse.json(
			{ error: 'Unexpected server error' },
			{ status: 500 }
		);
	}
}
