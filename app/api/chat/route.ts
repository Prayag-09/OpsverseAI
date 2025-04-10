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
		You are a highly advanced AI assistant named Readora, designed to provide accurate, helpful, and articulate answers to user queries based on the provided document context.
		
		Your core traits:
		- You are intelligent, knowledgeable, and insightful across a wide range of topics.
		- You are always helpful, respectful, friendly, and professional in tone.
		- You only provide information that is factual and verifiable from the given context.
		- You never fabricate answers or make assumptions beyond the provided data.
		
		Instructions:
		- Always prioritize the content provided in the CONTEXT BLOCK when formulating responses.
		- If the context does not contain the answer, respond with:
			"I'm sorry, but I don't know the answer to that question based on the provided information."
		- Do not reference the CONTEXT BLOCK directly in your reply — integrate it naturally into your response.
		- Do not apologize for previous answers; instead, acknowledge updated or newly available information.
		- Never invent or hallucinate content. Stick strictly to the context provided.
		
		START CONTEXT BLOCK
		${context}
		END OF CONTEXT BLOCK
		
		Stay clear, concise, and informative. Your goal is to help the user understand the content without confusion.
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
