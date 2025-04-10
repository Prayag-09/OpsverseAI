'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useChat } from '@ai-sdk/react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import MessageList from './MessageList';
import { UserButton } from '@clerk/nextjs';

type Message = {
	id: string;
	content: string;
	role: 'user' | 'assistant';
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
		isLoading,
	} = useChat({
		api: '/api/chat',
		id: chatId.toString(),
		initialMessages: initialMessages as any,
		body: { chatId },
		onError: (error) => console.error('Chat error:', error),
	});

	return (
		<div className='flex flex-col h-full text-white bg-black overflow-hidden border border-white/20 rounded-lg'>
			<div className='sticky top-0 z-10 bg-black p-4 border-b border-white/20 shadow-md'>
				<h3 className='text-xl font-bold tracking-tight text-white'>
					PDF Chat
				</h3>
				<div className='absolute top-4 right-4'>
					<UserButton />
				</div>
			</div>

			<div className='flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent'>
				{isLoadingMessages ? (
					<div className='text-center text-gray-300 animate-pulse font-medium'>
						Loading conversation...
					</div>
				) : queryError ? (
					<div className='text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20'>
						Error: {(queryError as Error).message}
					</div>
				) : (
					<MessageList messages={messages} isLoading={isLoading} />
				)}
				{chatError && (
					<div className='mt-4 text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20'>
						Chat error: {chatError.message}
					</div>
				)}
			</div>

			<div className='sticky bottom-0 p-4 bg-black border-t border-white/20'>
				<form onSubmit={handleSubmit} className='flex gap-2 items-center'>
					<Input
						value={input}
						onChange={handleInputChange}
						placeholder='Type your question...'
						disabled={isLoadingMessages || isLoading}
						className='flex-1 bg-black border border-white/20 text-white placeholder-gray-400 rounded-md focus:ring-1 focus:ring-white/30 focus:border-white/30 shadow-sm transition-all duration-200 font-medium'
					/>
					<Button
						type='submit'
						disabled={isLoadingMessages || isLoading || !input.trim()}
						className='bg-black hover:bg-white/10 text-white border border-white/20 rounded-md shadow-md hover:shadow-white/20 transition-all duration-300'>
						<Send className='w-5 h-5' />
					</Button>
				</form>
			</div>
		</div>
	);
}
