import React, { useCallback, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
  onStartGeneration: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading, onStartGeneration }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-2xl text-center p-8">
       <h2 className="text-2xl font-semibold mb-4 text-zinc-300">Start by Uploading a Photo</h2>
       <p className="text-zinc-400 mb-8">Let's create something amazing. Your image will be processed locally in your browser before being sent for AI editing.</p>
      <div
        className={`relative w-full p-10 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-amber-500 bg-zinc-800/50 shadow-lg shadow-amber-500/30' : 'border-zinc-600 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span className="text-lg font-medium text-zinc-400">Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span className="text-lg font-medium text-zinc-300">
                Drag & drop an image or <span className="text-amber-400">click to browse</span>
              </span>
              <span className="text-sm text-zinc-500">PNG, JPG, or WEBP</span>
            </>
          )}
        </label>
      </div>
       <div className="mt-8 text-center">
        <p className="text-zinc-400">
            Or, feeling creative?{' '}
            <button
                onClick={onStartGeneration}
                disabled={isLoading}
                className="font-semibold text-amber-400 hover:text-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Generate an image with AI
            </button>
        </p>
    </div>
    </div>
  );
};

export default ImageUploader;