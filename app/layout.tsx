import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { neobrutalism } from '@clerk/themes';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { Toaster } from 'sonner';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'OpsVerseAI: Decoding Your Docs',
	description:
		'OpsVerseAI is an intelligent PDF chat application that empowers you to interact with your documents effortlessly. Decode your PDFs, extract insights, and get answers to your questions with ease',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider
			appearance={{
				baseTheme: [neobrutalism],
			}}>
			<ReactQueryProvider>
				<html
					lang='en'
					className='h-full scroll-smooth'
					suppressHydrationWarning>
					<body
						className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black`}>
						{/* Global Background Container */}
						<div className='relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden'>
							{/* Radial Gradient */}
							<div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,112,243,0.15)_0%,_transparent_60%)] animate-pulse pointer-events-none' />
							{/* Top-Left Glow */}
							<div className='absolute top-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse pointer-events-none' />
							{/* Bottom-Right Glow */}
							<div className='absolute bottom-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse pointer-events-none' />
							{children}
						</div>
						<Toaster />
					</body>
				</html>
			</ReactQueryProvider>
		</ClerkProvider>
	);
}
