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
						className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
						{children}
						<Toaster />
					</body>
				</html>
			</ReactQueryProvider>
		</ClerkProvider>
	);
}
