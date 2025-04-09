import { db } from '@/lib/postgres';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { Message as _messages } from '@/lib/postgres/schema';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { chatId } = await req.json();
		if (typeof chatId !== 'number') {
			return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 });
		}

		const messages = await db
			.select()
			.from(_messages)
			.where(eq(_messages.chatId, chatId));

		return NextResponse.json(messages);
	} catch (error) {
		console.error('Get messages error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
