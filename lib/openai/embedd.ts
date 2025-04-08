import { OpenAIApi, Configuration } from 'openai-edge';

const config = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);
if (!process.env.OPENAI_API_KEY) {
	throw new Error(
		'OpenAI API key is not defined in the environment variables.'
	);
}

export const getEmbedding = async (text: string) => {
	try {
		const response = await openai.createEmbedding({
			model: 'text-embedding-ada-002',
			input: text.replace(/\n/g, ' '),
		});
		const finalResult = await response.json();
		return finalResult.data[0].embedding as number[];
	} catch (error) {
		console.error('Error fetching embedding:', error);
		throw new Error('Failed to fetch embedding');
	}
};
