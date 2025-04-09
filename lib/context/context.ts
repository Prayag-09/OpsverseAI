import { Pinecone } from '@pinecone-database/pinecone';
import { convertToAscii } from '../pinecone/converToAscii';
import { getEmbedding } from '../gemini/embedd';

type Metadata = {
	text: string;
	pageNumber: number;
};

/**
 * Queries Pinecone using the embedding vector and returns the closest matches.
 */
export const getMatchesFromEmbeddings = async (
	embedding: number[],
	fileKey: string
) => {
	try {
		const pinecone = new Pinecone({
			apiKey: process.env.PINECONE_API_KEY!,
		});

		const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);
		const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

		const queryResult = await namespace.query({
			topK: 5,
			vector: embedding,
			includeMetadata: true,
		});

		return queryResult.matches || [];
	} catch (error: any) {
		console.error('🔥 Error querying Pinecone:', error);
		throw new Error('Failed to fetch context from Pinecone');
	}
};

/**
 * Returns a formatted context string based on a user's question and matching embeddings from Pinecone.
 */
export const getMatches = async (query: string, fileKey: string) => {
	try {
		const queryEmbedding = await getEmbedding(query);

		const matchedResults = await getMatchesFromEmbeddings(
			queryEmbedding,
			fileKey
		);

		const THRESHOLD = 0.5;

		const topDocs = matchedResults
			.filter((match) => match.score && match.score >= THRESHOLD)
			.map((match) => (match.metadata as Metadata).text);

		if (topDocs.length === 0) {
			console.warn('⚠️ No relevant context found for query:', query);
			return 'No relevant context found for this query.';
		}

		return topDocs.join('\n').slice(0, 3000); // limit to ~5 vectors or ~3k characters
	} catch (error) {
		console.error('❌ Error fetching matches:', error);
		return 'Context retrieval failed. Please try again.';
	}
};