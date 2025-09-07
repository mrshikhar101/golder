import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { ImageFile } from '../types';

interface ImageEditorProps {
  image: ImageFile;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: (imageData: { base64: string; mimeType: string }) => void;
  isLoading: boolean;
  onReset: () => void;
  onBack: () => void;
}

// Helper function to generate a cropped image from a canvas
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas context is not available.'));

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0, 0,
    crop.width,
    crop.height,
  );
  return Promise.resolve(canvas.toDataURL('image/png'));
}

const aspectRatios = [
  { name: 'Free', value: undefined }, { name: '1:1', value: 1 / 1 },
  { name: '4:3', value: 4 / 3 }, { name: '3:4', value: 3 / 4 },
  { name: '16:9', value: 16 / 9 }, { name: '9:16', value: 9 / 16 },
  { name: '3:2', value: 3 / 2 },
];

const ImageEditor: React.FC<ImageEditorProps> = ({ image, prompt, setPrompt, onSubmit, isLoading, onReset, onBack }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropAspect, setCropAspect] = useState<number | undefined>();
  
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, cropAspect || height / width, width, height),
      width, height
    );
    setCrop(initialCrop);
  }

  useEffect(() => {
    if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, cropAspect || height / width, width, height),
            width, height
        );
        setCrop(newCrop);
    }
  }, [cropAspect]);

  const handleSubmit = async () => {
    if (isLoading || !imgRef.current || !completedCrop || completedCrop.width === 0) return;
    
    try {
      const croppedImageBase64 = await getCroppedImg(imgRef.current, completedCrop);
      onSubmit({ base64: croppedImageBase64, mimeType: 'image/png' });
    } catch (e) {
        console.error('Submission failed', e);
    }
  };

  return (
    <div className="w-full max-w-4xl p-4 md:p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700 shadow-2xl backdrop-blur-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Side: Image Preview & Controls */}
        <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex justify-between items-center">
                <h3 className="text-lg font-semibold text-zinc-300">Prepare Your Photo</h3>
                <button onClick={onBack} disabled={isLoading} className="text-sm text-zinc-400 hover:text-amber-400 transition-colors duration-200 disabled:opacity-50">&larr; Back</button>
            </div>
            <div 
              className="w-full rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center relative"
            >
                <ReactCrop
                    crop={crop} onChange={(_, pc) => setCrop(pc)} onComplete={(c) => setCompletedCrop(c)}
                    aspect={cropAspect} className="max-h-[50vh]"
                    disabled={isLoading} >
                    <img ref={imgRef} src={image.base64} alt="Upload for editing" onLoad={onImageLoad} className="max-h-[50vh] object-contain" />
                </ReactCrop>
            </div>
            
            <div className="w-full space-y-2">
              <h4 className="text-md font-semibold text-zinc-400">Aspect Ratio</h4>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map(r => <button key={r.name} onClick={() => setCropAspect(r.value)} className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${cropAspect === r.value ? 'bg-amber-600 text-white shadow-md' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>{r.name}</button>)}
              </div>
            </div>

            <button onClick={onReset} disabled={isLoading} className="text-sm text-zinc-400 hover:text-amber-400 transition-colors duration-200 disabled:opacity-50 pt-2">Upload a different photo</button>
        </div>
        {/* Right Side: AI Tools */}
        <div className="flex flex-col space-y-4 h-full">
            <h3 className="text-lg font-semibold text-zinc-300">Describe Your Edit</h3>
            <div className="flex-grow flex flex-col">
                <p className="text-sm text-zinc-400 mb-2">Be descriptive. For example: "Add a wizard hat" or "Make the sky look like a vibrant sunset".</p>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Make the sky look like a vibrant sunset..." rows={8}
                    className="flex-grow w-full p-3 bg-zinc-900/70 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500 transition-all duration-200 resize-none" disabled={isLoading}/>
            </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 active:scale-100"
          >
            {isLoading ? ( <><LoadingSpinner /><span className="ml-2">Generating...</span></> ) : ('Apply AI Edit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;