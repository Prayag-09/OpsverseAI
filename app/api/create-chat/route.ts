import { loadS3toPinecone } from '@/lib/pinecone/pincone';
import { NextResponse } from 'next/server';
import { db } from '@/lib/postgres';
import { Chat as chats } from '@/lib/postgres/schema';
import { getPublicUrl } from '@/lib/aws/s3.client';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { file_key, fileName } = await req.json();
		if (!file_key || !fileName) {
			return NextResponse.json(
				{ error: 'Missing file_key or fileName' },
				{ status: 400 }
			);
		}

		await loadS3toPinecone(file_key);

		const [chat] = await db
			.insert(chats)
			.values({
				fileKey: file_key,
				pdfName: fileName,
				pdfUrl: getPublicUrl(file_key),
				userId,
			})
			.returning({ insertedId: chats.id });

		return NextResponse.json({ id: chat.insertedId }, { status: 201 });
	} catch (error) {
		console.error('Create chat error:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
