import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const downloadFromS3 = async (file_key: string) => {
	try {
		const s3 = new S3Client({
			region: process.env.AWS_REGION!,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
			},
		});

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME!,
			Key: file_key,
		};

		const command = new GetObjectCommand(params);
		const { Body, ContentType } = await s3.send(command);

		if (!Body) {
			console.error('No body returned from S3 for key:', file_key);
			throw new Error('Failed to retrieve file from S3');
		}

		const streamToBuffer = async (stream: any) => {
			const chunks: Uint8Array[] = [];
			for await (const chunk of stream) {
				chunks.push(chunk);
			}
			return Buffer.concat(chunks);
		};

		const buffer = await streamToBuffer(Body);
		const blob = new Blob([buffer], { type: ContentType || 'application/pdf' });

		return blob;
	} catch (error) {
		console.error('Error downloading from S3:', error);
		throw new Error(
			`Error downloading from S3: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
};
