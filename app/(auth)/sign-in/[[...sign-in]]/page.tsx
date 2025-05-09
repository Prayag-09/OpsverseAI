import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
	return (
		<div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden'>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,112,243,0.15)_0%,_transparent_60%)] animate-pulse'></div>
			<div className='relative backdrop-blur-2xl bg-white/10 p-10 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-blue-500/20 transition-transform duration-300 hover:scale-105'>
				<SignIn
					signUpFallbackRedirectUrl={
						process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
					}
					appearance={{
						elements: {
							formButtonPrimary:
								'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-blue-500/50',
							card: 'shadow-2xl rounded-xl border border-white/20 bg-black/40 text-white',
							headerTitle: 'text-3xl font-bold tracking-wide text-white',
							inputField:
								'bg-black/50 border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500',
							formFieldInput:
								'bg-gray-900 border border-gray-700 text-white focus:ring-blue-500',
							socialButtonsBlockButton:
								'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600',
						},
					}}
				/>
			</div>
			<div className='absolute top-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse'></div>
			<div className='absolute bottom-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse'></div>
		</div>
	);
}
