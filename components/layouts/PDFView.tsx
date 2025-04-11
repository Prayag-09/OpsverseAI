'use client';

import { useState, useEffect } from 'react';

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setIsLoading(true);
		setError(null);
		const timer = setTimeout(() => setIsLoading(false), 1000);
		return () => clearTimeout(timer);
	}, [pdf_url]);

	const handleError = () => {
		setError('Failed to load PDF. Check the URL or try again.');
		setIsLoading(false);
	};

	return (
		<div className='h-full overflow-hidden rounded-md border border-white/20 shadow-lg'>
			{isLoading ? (
				<div className='flex items-center justify-center h-full'>
					<div className='text-gray-300 animate-pulse bg-black/30 p-4 rounded-md'>
						Loading PDF...
					</div>
				</div>
			) : error ? (
				<div className='flex items-center justify-center h-full'>
					<div className='text-red-400 bg-red-500/10 p-4 rounded-md'>
						{error}
					</div>
				</div>
			) : (
				<iframe
					src={`https://docs.google.com/gview?url=${pdf_url}&embedded=true`}
					className='w-full h-full rounded-md'
					onError={handleError}
					title='PDF Viewer'
				/>
			)}
		</div>
	);
};

export default PDFViewer;
