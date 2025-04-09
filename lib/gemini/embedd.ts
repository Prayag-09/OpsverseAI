import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
	throw new Error(
		'Gemini API key is not defined in the environment variables.'
	);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getEmbedding = async (text: string): Promise<number[]> => {
	try {
		if (!text || text.trim().length === 0) {
			throw new Error('Input text is empty or undefined');
		}

		const model = genAI.getGenerativeModel({ model: 'text-embedding-004' }); // Or 'gemini-embedding-exp-03-07'
		const result = await model.embedContent(text.replace(/\n/g, ' ').trim());

		const embedding = result.embedding.values;
		if (!embedding || !Array.isArray(embedding)) {
			throw new Error('Invalid embedding response from Gemini API');
		}

		return embedding;
	} catch (error: any) {
		console.error('Error fetching embedding from Gemini:', error);
		throw new Error(`Failed to fetch embedding: ${error.message || error}`);
	}
};
