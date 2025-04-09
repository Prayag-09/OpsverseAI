'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useChat } from '@ai-sdk/react'; // Updated import
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import MessageList from './MessagesList';

type Message = {
	id: string;
	content: string;
	role: 'user' | 'assistant'; // Aligned with useChat and your API
	createdAt: string;
};

type Props = { chatId: number };

export default function ChatComponent({ chatId }: Props) {
	const {
		data: initialMessages,
		isLoading: isLoadingMessages,
		error: queryError,
	} = useQuery<Message[]>({
		queryKey: ['chat', chatId],
		queryFn: async () => {
			const response = await axios.post('/api/get-messages', { chatId });
			return response.data || [];
		},
	});

	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		error: chatError,
	} = useChat({
		api: '/api/chat',
		id: chatId.toString(),
		initialMessages: initialMessages as any,
		body: { chatId },
		onError: (error) => {
			console.error('Chat error:', error);
		},
		onFinish: (message) => {
			console.log('Chat finished:', message);
		},
	});

	if (isLoadingMessages) {
		return <div className='p-4 text-gray-400'>Loading chat history...</div>;
	}
	if (queryError) {
		return (
			<div className='p-4 text-red-400'>
				Error loading chat: {(queryError as Error).message}
			</div>
		);
	}
	if (chatError) {
		return (
			<div className='p-4 text-red-400'>Chat error: {chatError.message}</div>
		);
	}

	return (
		<div className='flex flex-col h-full bg-gray-900 text-white'>
			<div className='sticky top-0 z-10 bg-gray-800 p-4 border-b border-gray-700'>
				<h3 className='text-xl font-bold'>Chat</h3>
			</div>

			<div className='flex-1 overflow-y-auto p-4' role='log' aria-live='polite'>
				<MessageList messages={messages} isLoading={isLoadingMessages} />
			</div>

			<div className='sticky bottom-0 bg-gray-800 border-t border-gray-700'>
				<form onSubmit={handleSubmit} className='p-4'>
					<div className='flex gap-2'>
						<Input
							value={input}
							onChange={handleInputChange}
							placeholder='Type your message...'
							disabled={isLoadingMessages}
							className='flex-1 bg-gray-700 text-white border-gray-600 placeholder-gray-400'
							aria-label='Chat input'
						/>
						<Button
							type='submit'
							disabled={isLoadingMessages || !input.trim()}
							className='bg-blue-600 hover:bg-blue-700 text-white'
							aria-label='Send message'>
							<Send className='h-4 w-4' />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
