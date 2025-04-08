import { Pinecone } from '@pinecone-database/pinecone';
import { toast } from 'sonner';
import { downloadFromS3 } from '../aws/s3.server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import {
	Document,
	RecursiveCharacterTextSplitter,
} from '@pinecone-database/doc-splitter';

if (!process.env.PINECONE_API_KEY) {
	toast.error('Pinecone API key is not defined in the environment variables.');
	throw new Error(
		'Pinecone API key is not defined in the environment variables.'
	);
}
export const getPineconeClient = () => {
	return new Pinecone({
		apiKey: process.env.PINECONE_API_KEY!,
	});
};

type PDFPage = {
	pageContent: string;
	metadata: {
		loc: { pageNumber: number };
	};
};
export const loadS3toPinecone = async (file_key: string) => {
	try {
		const file = await downloadFromS3(file_key);
		if (!file) {
			console.error('Failed to download file from S3:', file_key);
			throw new Error('File is not defined');
		}

		// Step 1: Load the PDF file
		const loader = new PDFLoader(file);
		const docs = (await loader.load()) as PDFPage[];

		if (!docs || docs.length === 0) {
			console.error('No documents loaded from PDF:', file_key);
			throw new Error('Failed to load documents from PDF');
		}

		// Step 2: Split the documents into smaller chunks
		const spilttedDocuments = await Promise.all(docs.map(splitDocuments));
		if (!spilttedDocuments || spilttedDocuments.length === 0) {
			console.error('No documents split from PDF:', file_key);
			throw new Error('Failed to split documents from PDF');
		}

		// Step 3: Vectorize , Embedd and then store the documents in Pinecone
		const pinecone = getPineconeClient();
		const indexName = process.env.PINECONE_INDEX_NAME;

		if (!indexName) {
			console.error(
				'Pinecone index name is not defined in environment variables.'
			);
			throw new Error('Pinecone index name is not defined');
		}

		const index = pinecone.Index(indexName);

		const vectors = docs.map((doc, i) => ({
			id: `${file_key}_${i}`,
			values: new Array(1536).fill(0),
			metadata: { text: doc.pageContent },
		}));

		await index.upsert(vectors);

		console.log(
			`Upserted ${vectors.length} vectors to Pinecone index: ${indexName}`
		);
		toast.success('Successfully loaded documents to Pinecone!');
		return docs;
	} catch (error) {
		console.error('Error in loadS3toPinecone:', error);
		throw error;
	}
};

export const truncateStringByBytes = (str: string, bytes: number) => {
	const enc = new TextEncoder();
	return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
};

export const splitDocuments = async (docs: PDFPage) => {
	let { pageContent, metadata } = docs;

	pageContent = pageContent.replace(/\n/g, '');

	const splitter = new RecursiveCharacterTextSplitter();
	const splittedDocuments = await splitter.splitDocuments([
		new Document({
			pageContent,
			metadata: {
				pageNumber: metadata.loc.pageNumber,
				text: truncateStringByBytes(pageContent, 36000),
			},
		}),
	]);
	return splittedDocuments;
};
