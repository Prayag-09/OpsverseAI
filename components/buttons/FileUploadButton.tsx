'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import uploadToS3, { getPublicUrl } from '@/lib/aws/s3';

const FileUploadButton: React.FC = () => {
	const [uploading, setUploading] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: async (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (!file) return;

			try {
				setUploading(true);
				setError(null);
				console.log('Uploading:', file);

				const data = await uploadToS3(file);
				console.log('Upload successful:', data);

				const url = getPublicUrl(data.file_key);
				setUploadedUrl(url);
			} catch (error) {
				console.error('❌ Upload failed:', error);
				setError('Failed to upload file. Please try again.');
			} finally {
				setUploading(false);
			}
		},
		accept: {
			'application/pdf': ['.pdf'],
		},
		maxFiles: 1,
		maxSize: 10 * 1024 * 1024,
		onDropRejected: (rejectedFiles) => {
			const firstFile = rejectedFiles[0];
			let errorMessage = 'File type not supported or file size exceeds 10MB.';

			if (firstFile?.errors?.some((e) => e.code === 'file-too-large')) {
				errorMessage = 'File size exceeds 10MB limit.';
			}

			setError(errorMessage);
		},
	});

	return (
		<div className='flex flex-col items-center justify-center w-full max-w-md mt-8 gap-4'>
			<div
				{...getRootProps({
					className:
						'flex flex-col items-center justify-center w-full h-48 p-4 border-2 border-dashed rounded-lg bg-gray-800/20 border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
					'aria-busy': uploading,
				})}>
				<input {...getInputProps()} aria-label='File upload' />
				<Upload
					className={`h-8 w-8 mb-2 ${
						uploading ? 'text-blue-400 animate-pulse' : 'text-gray-400'
					}`}
				/>
				<p className='text-gray-300 text-center'>
					{uploading
						? 'Uploading file...'
						: isDragActive
						? 'Drop the PDF here'
						: 'Drag & drop your PDF here or click to upload'}
				</p>
				<p className='text-sm text-gray-500 mt-1'>Max file size: 10MB</p>
			</div>

			{error && <p className='text-red-400 text-center'>{error}</p>}

			{uploadedUrl && (
				<div className='mt-2 text-center'>
					<p className='text-green-400 mb-2'>File uploaded successfully!</p>
					<a
						href={uploadedUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='underline text-blue-400 hover:text-blue-300 transition-colors'>
						View uploaded PDF
					</a>
				</div>
			)}
		</div>
	);
};

export default FileUploadButton;
