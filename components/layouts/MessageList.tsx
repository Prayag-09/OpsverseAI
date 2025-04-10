'use client';

import { cn } from '@/lib/utils';
import { Message } from '@ai-sdk/react';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Props = {
	isLoading: boolean;
	messages: Message[];
};

const MessageList = ({ messages, isLoading }: Props) => {
	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-full'>
				<Loader2 className='w-6 h-6 text-white animate-spin' />
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-3 p-2'>
			{messages?.map((message) => (
				<div
					key={message.id}
					className={cn('flex', {
						'justify-end': message.role === 'user',
						'justify-start': message.role === 'assistant',
					})}>
					<div
						className={cn(
							'px-4 py-2 max-w-[80%] rounded-md border border-white/20 shadow-sm transition-all duration-200 font-medium',
							{
								'bg-white/10 text-white': message.role === 'user',
								'bg-black text-gray-300': message.role === 'assistant',
							}
						)}>
						<ReactMarkdown
							components={{
								p: ({ node, ...props }) => (
									<p
										{...props}
										className='prose prose-invert text-sm max-w-none whitespace-pre-wrap'
									/>
								),
							}}>
							{message.content}
						</ReactMarkdown>
					</div>
				</div>
			))}
		</div>
	);
};

export default MessageList;
