'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useChat } from 'ai/react';
import { Send } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import MessageList from './MessagesList';

type Props = { chatId: number };

export default function ChatComponent({ chatId }: Props) {
	const {
		data: initialMessages,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['chat', chatId],
		queryFn: async () => {
			const response = await axios.post('/api/get-messages', { chatId });
			return response.data || [];
		},
	});

	const {
		input,
		handleInputChange,
		handleSubmit,
		messages,
		isLoading: isSending,
		setMessages,
	} = useChat({
		api: '/api/chat',
		body: { chatId },
		initialMessages: initialMessages || [],
		onError: (error) => {
			console.error('Chat error:', error);
			alert('Failed to send message. Please try again.');
		},
	});

	useEffect(() => {
		if (initialMessages) {
			setMessages(initialMessages);
		}
	}, [initialMessages, setMessages]);

	if (isLoading) return <div className='p-4'>Loading chat history...</div>;
	if (error) return <div className='p-4 text-red-500'>Error loading chat</div>;

	return (
		<div className='flex flex-col h-full'>
			{/* Header */}
			<div className='sticky top-0 z-10 bg-white p-4 border-b'>
				<h3 className='text-xl font-bold'>Chat</h3>
			</div>

			{/* Message List with scrollable area */}
			<div className='flex-1 overflow-y-auto'>
				<MessageList messages={messages} isLoading={isSending} />
			</div>

			{/* Input Form - Fixed at bottom */}
			<div className='sticky bottom-0 bg-white border-t'>
				<form onSubmit={handleSubmit} className='p-4'>
					<div className='flex gap-2'>
						<Input
							value={input}
							onChange={handleInputChange}
							placeholder='Type your message...'
							disabled={isSending}
							className='flex-1'
						/>
						<Button
							type='submit'
							disabled={isSending || !input.trim()}
							className='bg-blue-600 hover:bg-blue-700 text-white'>
							<Send className='h-4 w-4' />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
