import { db } from '@/lib/postgres';
import { eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { Message } from '@/lib/postgres/schema';

export const runtime = 'edge';

export const POST = async (req: Request) => {
	const { chatId } = await req.json();
	const _messages = await db
		.select()
		.from(Message)
		.where(eq(Message.chatId, chatId));
	return NextResponse.json({
		_messages,
	});
};
