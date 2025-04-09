'use client';

import { cn } from '@/lib/utils';
import { Message } from 'ai/react';
import { Loader2 } from 'lucide-react';

type Props = {
	isLoading: boolean;
	messages: Message[];
};

const MessageList = ({ messages, isLoading }: Props) => {
	if (isLoading) {
		return (
			<div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
				<Loader2 className='w-6 h-6 animate-spin' />
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-4 px-4 pb-4'>
			{messages?.map((message) => (
				<div
					key={message.id}
					className={cn('flex', {
						'justify-end': message.role === 'user',
						'justify-start': message.role === 'assistant',
					})}>
					<div
						className={cn('rounded-lg px-4 py-2 max-w-[80%]', {
							'bg-blue-600 text-white': message.role === 'user',
							'bg-gray-100': message.role === 'assistant',
						})}>
						<p className='whitespace-pre-wrap'>{message.content}</p>
					</div>
				</div>
			))}
		</div>
	);
};

export default MessageList;
