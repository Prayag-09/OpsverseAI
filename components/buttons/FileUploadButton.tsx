'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import uploadToS3, { getPublicUrl } from '@/lib/aws/s3.client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UploadData {
	file_key: string;
	fileName: string;
}

const FileUploadButton: React.FC = () => {
	const [uploading, setUploading] = useState(false);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const { mutate: createChat } = useMutation({
		mutationFn: async (data: UploadData) => {
			const response = await axios.post('/api/create-chat', data);
			if (response.status !== 200) {
				throw new Error(response.data?.message || 'Failed to create chat');
			}
			return response.data;
		},
		onSuccess: (data) => {
			toast.success('Chat created successfully!');
			router.push(`/chat/${data.chat_id}`);
		},
		onError: (error: any) => {
			console.error('Chat creation failed:', error);
			const message =
				error.response?.data?.message ||
				error.message ||
				'Failed to create chat';
			toast.error(message);
			setError(message);
		},
	});

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: async (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (!file) return;

			try {
				setUploading(true);
				setError(null);

				const uploadData = await uploadToS3(file);
				if (!uploadData?.file_key || !uploadData?.fileName) {
					throw new Error('Invalid upload response');
				}
				createChat(uploadData);
				const url = getPublicUrl(uploadData.file_key);
				setUploadedUrl(url);

				toast.success('File uploaded successfully!');
			} catch (err) {
				console.error('Upload failed:', err);
				const message = err instanceof Error ? err.message : 'Upload failed';
				toast.error(message);
				setError(message);
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
			let errorMessage = 'File must be a PDF and under 10MB';

			if (firstFile?.errors?.some((e) => e.code === 'file-too-large')) {
				errorMessage = 'File exceeds 10MB size limit';
			} else if (
				firstFile?.errors?.some((e) => e.code === 'file-invalid-type')
			) {
				errorMessage = 'Only PDF files are accepted';
			}

			toast.error(errorMessage);
			setError(errorMessage);
		},
	});

	return (
		<div className='flex flex-col items-center justify-center w-full max-w-md mt-8 gap-4'>
			<div
				{...getRootProps()}
				className={`flex flex-col items-center justify-center w-full h-52 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
        ${
					uploading
						? 'border-blue-500/50 bg-blue-500/10 animate-pulse'
						: 'bg-gray-800/20 border-gray-600/50 hover:border-gray-400/40'
				}`}>
				<input {...getInputProps()} />
				<Upload className='h-8 w-8 text-gray-400 mb-2' />
				<p className='text-sm sm:text-base text-gray-300 text-center'>
					{uploading
						? 'Uploading...'
						: isDragActive
						? 'Drop PDF here'
						: 'Drag and drop a PDF or click to upload'}
				</p>
				<p className='text-xs text-gray-500 mt-1'>Max size: 10MB (PDF only)</p>
			</div>

			{error && (
				<p className='text-sm text-red-400 text-center max-w-xs'>{error}</p>
			)}

			{uploadedUrl && (
				<div className='mt-2 text-center'>
					<p className='text-green-400 mb-1'>Upload successful!</p>
					<a
						href={uploadedUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='text-sm underline text-blue-400 hover:text-blue-300 transition-colors'>
						View PDF
					</a>
				</div>
			)}
		</div>
	);
};

export default FileUploadButton;
