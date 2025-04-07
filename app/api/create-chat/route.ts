import { loadS3toPinecone } from '@/lib/pinecone/pincone';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	try {
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

		const pages = await loadS3toPinecone(file_key);
		console.log('Successfully loaded to Pinecone:', { pages });

		return NextResponse.json(
			{
				success: true,
				message: 'Chat created successfully',
				data: {
					file_key,
					fileName,
					pages,
				},
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
}
