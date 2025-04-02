'use client';
import { Button } from '@/components/ui/button';
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react';

const Home: React.FC = () => {
	const { user, isLoaded } = useUser();
	const isAuth = isLoaded && !!user;

	return (
		<main className='relative w-screen min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-center px-6'>
			{/* Background Gradient Animation */}
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,112,243,0.2)_0%,_transparent_70%)] animate-pulse pointer-events-none' />

			{/* Floating Neon Glow */}
			<div className='absolute top-0 left-0 w-40 h-40 bg-blue-500/25 rounded-full blur-3xl animate-pulse pointer-events-none' />
			<div className='absolute bottom-0 right-0 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl animate-pulse pointer-events-none' />

			{/* Main Content */}
			<h1 className='font-black text-6xl sm:text-7xl leading-tight drop-shadow-lg text-white'>
				Transform Your PDFs
			</h1>

			<div className='flex gap-2 mt-4'>{isLoaded && <UserButton />}</div>

			<h3 className='text-lg sm:text-xl font-semibold mt-6 text-gray-300 leading-relaxed max-w-3xl'>
				Bring your documents to life with AI-powered insights. Upload a PDF, ask
				any question, and get clear, instant answers with ease. Streamline your
				work with smarter document interactions.
			</h3>

			<div className='mt-6 flex flex-col gap-4 w-full max-w-md'>
				{isAuth ? (
					<>
						<Link href='/chats'>
							<Button
								size='xl'
								className='w-full bg-indigo-500/20 hover:bg-indigo-600/30 backdrop-blur-md border border-indigo-500/50 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-indigo-500/40'>
								View Your Chats
							</Button>
						</Link>
						<Link href='/upload'>
							<Button
								size='xl'
								className='w-full bg-blue-500/20 hover:bg-blue-600/30 backdrop-blur-md border border-blue-500/50 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-blue-500/40'>
								Upload a PDF
							</Button>
						</Link>
					</>
				) : (
					<Link href='/sign-in'>
						<Button
							size='xl'
							className='w-full bg-purple-500/20 hover:bg-purple-600/30 backdrop-blur-md border border-purple-500/50 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-purple-600/40'>
							Sign In to Start
						</Button>
					</Link>
				)}
			</div>
		</main>
	);
};

export default Home;
