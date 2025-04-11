import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { db } from '@/lib/postgres/index';
import { Chat as chats, Message as _messages } from '@/lib/postgres/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getMatches, getIntroChunks } from '@/lib/context/context';
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

		const isSummaryQuery =
			/summary|summarize|overview|what is.*(pdf|document)/i.test(
				lastMessage.content
			);

		const context = isSummaryQuery
			? await getIntroChunks(chat.fileKey)
			: await getMatches(lastMessage.content, chat.fileKey);

		console.log('Retrieved context:', context);

		const systemPrompt = `
		You are Readora, a highly intelligent and articulate AI assistant designed to help users understand the content of uploaded PDF documents with clarity and precision.
		
		Your role:
		- Provide accurate, concise, and well-structured answers based strictly on the provided document context.
		- Communicate in a helpful, professional, and friendly tone at all times.
		- Maintain factual integrity: never guess, speculate, or generate unsupported information.
		
		Guidelines:
		1. ONLY use the information found in the CONTEXT BLOCK to answer questions.
		2. If the context does not contain the answer, respond with:
			"I'm sorry, but I couldn't find the answer to that question based on the provided information."
		3. Do NOT reference the "CONTEXT BLOCK" or mention that you are reading from context.
		4. Integrate the content naturally into your response, as if you are the expert who knows this material.
		5. Avoid repeating the user's question unnecessarily.
		6. Keep responses clear, informative, and easy to follow.
		7. Never invent details or add information that is not explicitly found in the context.
		
		Output Style:
		- Use bullet points or numbered steps when listing key points.
		- Use short paragraphs for explanations (2–4 sentences).
		- Keep your language approachable but professional — think of a helpful researcher explaining to a curious learner.
		
		Context:
		The content below contains excerpts from a PDF uploaded by the user. Use it exclusively to formulate your response.
		
		-------------------------
		START OF CONTEXT BLOCK
		${context}
		END OF CONTEXT BLOCK
		-------------------------
		
		Begin crafting your response based only on the above context. Stay grounded, stay accurate, and aim to be genuinely helpful.
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
