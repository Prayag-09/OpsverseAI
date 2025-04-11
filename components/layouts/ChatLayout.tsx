'use client';

import { useState } from 'react';
import ChatComponent from '@/components/layouts/ChatComponent';
import ChatSideBar from '@/components/layouts/ChatSideBar';
import PDFViewer from '@/components/layouts/PDFView';
import { DrizzleChat } from '@/lib/postgres/schema';
import { Menu } from 'lucide-react';
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetClose,
} from '@/components/ui/sheet';

type Props = {
	chats: DrizzleChat[];
	chatId: number;
	isPro: boolean;
	currentChatPdfUrl: string;
	currentChatPdfName: string;
};

export default function ChatLayout({
	chats,
	chatId,
	isPro,
	currentChatPdfUrl,
	currentChatPdfName,
}: Props) {
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const handleSheetClose = () => {
		setIsSheetOpen(false);
	};

	return (
		<div className='flex flex-col h-screen w-full bg-black text-white overflow-hidden'>
			<header className='md:hidden p-4 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-md z-50'>
				<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
					<SheetTrigger asChild>
						<button
							className='p-2 rounded-md bg-white/10 hover:bg-white/20 transition-all duration-200'
							aria-label='Open sidebar'>
							<Menu className='w-5 h-5 text-white' />
						</button>
					</SheetTrigger>
					<SheetContent
						side='left'
						className='p-0 w-72 bg-black text-white border-r border-white/10 z-60'
						onInteractOutside={handleSheetClose}
						onEscapeKeyDown={handleSheetClose}>
						<h2 className='sr-only'>Chat Navigation</h2>{' '}
						<ChatSideBar chats={chats} chatId={chatId} isPro={isPro} />
						<SheetClose className='hidden' />{' '}
					</SheetContent>
				</Sheet>
				<h1 className='text-base font-semibold truncate'>
					{currentChatPdfName}
				</h1>
			</header>

			<div className='flex flex-1 overflow-hidden z-40'>
				<aside className='hidden md:block h-screen border-r border-white/10'>
					<ChatSideBar chats={chats} chatId={chatId} isPro={isPro} />
				</aside>

				<main className='flex flex-1 flex-col md:flex-row overflow-hidden'>
					<section className='flex-1 md:flex-[5] p-4 md:p-6 overflow-hidden border-b md:border-b-0 md:border-r border-white/10'>
						<PDFViewer pdf_url={currentChatPdfUrl} />
					</section>

					<aside className='flex-1 md:flex-[3] border-t md:border-t-0 md:border-l border-white/10'>
						<ChatComponent chatId={chatId} />
					</aside>
				</main>
			</div>
		</div>
	);
}
