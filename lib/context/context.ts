import { Pinecone } from '@pinecone-database/pinecone';
import { convertToAscii } from '../pinecone/converToAscii';
import { getEmbedding } from '../gemini/embedd';

type Metadata = {
	text: string;
	pageNumber: number;
};

export const getMatchesFromEmbeddings = async (
	embeddings: number[],
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
			vector: embeddings,
			includeMetadata: true,
		});
		return queryResult.matches || [];
	} catch (error: any) {
		console.log(error);
		throw new error();
	}
};

export const getMatches = async (query: string, fileKey: string) => {
	const queryEmbeddings = await getEmbedding(query);
	const matchedResults = await getMatchesFromEmbeddings(
		queryEmbeddings,
		fileKey
	);

	const qualifyingDocs = matchedResults.filter(
		(match) => match.score && match.score > 0.7
	);

	const docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
	return docs.join('\n').substring(0, 3000); // 5 Vectors
};
