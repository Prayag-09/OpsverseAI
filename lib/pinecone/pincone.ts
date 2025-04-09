import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { downloadFromS3 } from '../aws/s3.server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import {
	Document,
	RecursiveCharacterTextSplitter,
} from '@pinecone-database/doc-splitter';
import { getEmbedding } from '../gemini/embedd';
import md5 from 'md5';
import { convertToAscii } from './converToAscii';

if (!process.env.PINECONE_API_KEY) {
	throw new Error('PINECONE_API_KEY is not set in the environment variables.');
}

export const getPineconeClient = () => {
	return new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
};

type PDFPage = {
	pageContent: string;
	metadata: { loc: { pageNumber: number } };
};

export const loadS3toPinecone = async (file_key: string): Promise<PDFPage> => {
	try {
		if (!file_key) throw new Error('File key is not provided');

		const file = await downloadFromS3(file_key);
		if (!file) throw new Error(`Failed to download file from S3: ${file_key}`);

		const loader = new PDFLoader(file);
		const docs = (await loader.load()) as PDFPage[];
		if (!docs?.length)
			throw new Error(`No documents found in PDF: ${file_key}`);

		const splitDocs = await Promise.all(docs.map(splitDocument));
		const flattenedDocs = splitDocs.flat();
		if (!flattenedDocs.length) throw new Error(`No chunks found: ${file_key}`);

		const vectors = await Promise.all(flattenedDocs.map(embeddDocuments));
		if (!vectors.length) throw new Error(`No vectors created: ${file_key}`);

		const pinecone = getPineconeClient();
		const indexName = process.env.PINECONE_INDEX_NAME;
		if (!indexName) throw new Error('Pinecone index name is not defined');

		const pineconeIndex = pinecone.Index(indexName);
		const namespace = pineconeIndex.namespace(convertToAscii(file_key));

		await namespace.upsert(vectors);

		console.log(
			`✅ Upserted ${vectors.length} vectors to Pinecone index "${indexName}" in namespace "${file_key}"`
		);

		return docs[0];
	} catch (error) {
		console.error('❌ Error in loadS3toPinecone:', error);
		throw error;
	}
};

export const embeddDocuments = async (
	doc: Document
): Promise<PineconeRecord> => {
	try {
		const embedding = await getEmbedding(doc.pageContent);
		if (!embedding || embedding.length !== 768) {
			throw new Error(
				`Embedding dimension mismatch: expected 768, got ${embedding?.length}`
			);
		}

		const hash = md5(JSON.stringify(embedding));
		return {
			id: hash,
			values: embedding,
			metadata: {
				text: doc.pageContent,
				pageNumber: doc.metadata.pageNumber as number,
			},
		};
	} catch (error: any) {
		console.error('❌ Error in embeddDocuments:', error);
		throw new Error(`Failed to get embeddings: ${error.message || error}`);
	}
};

export const truncateStringByBytes = (str: string, bytes: number): string => {
	const enc = new TextEncoder();
	return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
};

export const splitDocument = async (doc: PDFPage): Promise<Document[]> => {
	const { pageContent, metadata } = doc;
	const cleanedContent = pageContent.replace(/\n/g, '').trim();

	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 200,
	});

	const splitDocs = await splitter.splitDocuments([
		new Document({
			pageContent: cleanedContent,
			metadata: {
				pageNumber: metadata.loc.pageNumber,
				text: truncateStringByBytes(cleanedContent, 36000),
			},
		}),
	]);

	if (!splitDocs.length) {
		throw new Error(
			`Failed to split document on page ${metadata.loc.pageNumber}`
		);
	}
	return splitDocs;
};
