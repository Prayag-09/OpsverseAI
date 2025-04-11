import {
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3';

interface UploadResponse {
	file_key: string;
	fileName: string;
}

const uploadToS3 = async (file: File): Promise<UploadResponse> => {
	try {
		const s3 = new S3Client({
			region: process.env.NEXT_PUBLIC_AWS_REGION!,
			credentials: {
				accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
				secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
			},
		});

		if (!file) {
			throw new Error('File is not defined');
		}

		const file_key =
			'uploads/' +
			Date.now().toString() +
			file.name.replace(/\s+/g, '-').toLowerCase();

		const fileBuffer = Buffer.from(await file.arrayBuffer());

		const params = {
			Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
			Key: file_key,
			Body: fileBuffer,
			ContentType: file.type,
		};

		const uploadResult: PutObjectCommandOutput = await s3.send(
			new PutObjectCommand(params)
		);
		console.log('✅ Upload successful:', uploadResult);

		return {
			file_key,
			fileName: file.name,
		};
	} catch (error) {
		console.error('Error uploading to S3:', error);
		throw error;
	}
};

export default uploadToS3;

export const getPublicUrl = (fileKey: string) => {
	const url = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileKey}`;
	return url;
};
