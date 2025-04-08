import { loadS3toPinecone } from '@/lib/pinecone/pincone';
import { NextResponse } from 'next/server';
import { db } from '@/lib/postgres';
import { Chat as chats } from '@/lib/postgres/schema';
import { getPublicUrl } from '@/lib/aws/s3.client';
import { auth } from '@clerk/nextjs/server';

export const POST = async (req: Request) => {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json(
				{
					error: 'Unauthorized',
					details: 'User ID is required',
				},
				{ status: 401 }
			);
		}
		const body = await req.json();
		const { file_key, fileName } = body;

		if (!file_key || !fileName) {
			return NextResponse.json(
				{
					error: 'File key and file name are required',
					details: 'file_key and fileName are required',
				},
				{ status: 400 }
			);
		}
		console.log('Attempting to load S3 file to Pinecone:', {
			file_key,
			fileName,
		});
		await loadS3toPinecone(file_key);
		const chat_id = await db
			.insert(chats)
			.values({
				fileKey: file_key,
				pdfName: fileName,
				pdfUrl: getPublicUrl(file_key),
				userId: userId,
			})
			.returning({
				insertedId: chats.id,
			});

		return NextResponse.json(
			{
				chat_id: chat_id[0].insertedId,
			},
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
};
