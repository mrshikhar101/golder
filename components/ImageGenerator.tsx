import React, { useState } from 'react';
import { generateImageWithGemini, upscaleImageWithGemini } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';

interface ImageGeneratorProps {
  onImageGenerated: (base64Data: string) => void;
  onBack: () => void;
}

const aspectRatios = [
  { name: 'Square 1:1', value: '1:1' as const },
  { name: 'Landscape 4:3', value: '4:3' as const },
  { name: 'Portrait 3:4', value: '3:4' as const },
  { name: 'Widescreen 16:9', value: '16:9' as const },
  { name: 'Tall 9:16', value: '9:16' as const },
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated, onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '3:4' | '16:9' | '9:16'>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const resultBase64 = await generateImageWithGemini(prompt, aspectRatio);
      setGeneratedImage(resultBase64);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!generatedImage) return;

    setIsUpscaling(true);
    setError(null);
    try {
        const upscaledImageBase64 = await upscaleImageWithGemini(generatedImage);
        setGeneratedImage(upscaledImageBase64);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Upscaling failed: ${errorMessage}`);
        console.error(err);
    } finally {
        setIsUpscaling(false);
    }
  };

  const handleConfirm = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
    }
  };

  return (
    <div className="w-full max-w-4xl p-4 md:p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700 shadow-2xl backdrop-blur-md animate-fade-in">
       <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-zinc-100">Generate Image with AI</h2>
          <button onClick={onBack} disabled={isLoading || isUpscaling} className="text-sm text-zinc-400 hover:text-amber-400 transition-colors duration-200 disabled:opacity-50">&larr; Back to Upload</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Side: Controls */}
        <div className="flex flex-col space-y-4 h-full">
            <div className="flex-grow flex flex-col">
                <label htmlFor="prompt-input" className="text-lg font-semibold text-zinc-300 mb-2">Your Prompt</label>
                <p className="text-sm text-zinc-400 mb-2">Describe the image you want to create. Be as specific as possible for the best results.</p>
                <textarea id="prompt-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A cinematic shot of a raccoon in a library, wearing a monocle..." rows={8}
                    className="flex-grow w-full p-3 bg-zinc-900/70 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-amber-500 transition-all duration-200 resize-none" disabled={isLoading || isUpscaling}/>
            </div>

            <div className="w-full space-y-2">
              <h4 className="text-md font-semibold text-zinc-400">Aspect Ratio</h4>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map(r => 
                    <button key={r.name} onClick={() => setAspectRatio(r.value)} disabled={isLoading || isUpscaling} className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${aspectRatio === r.value ? 'bg-amber-600 text-white shadow-md' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300 disabled:opacity-50'}`}>{r.name}</button>
                )}
              </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading || isUpscaling || !prompt.trim()}
                className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-amber-500/30 transform hover:scale-105 active:scale-100"
            >
                {isLoading ? ( <><LoadingSpinner /><span className="ml-2">Generating...</span></> ) : ('Generate')}
            </button>
        </div>

        {/* Right Side: Output */}
        <div className="flex flex-col items-center justify-center space-y-4 w-full h-full bg-zinc-900/70 border border-zinc-700 rounded-xl p-4 min-h-[300px] md:min-h-full">
            {error && <div className="w-full"><ErrorAlert message={error} onClose={() => setError(null)} /></div>}
            {isLoading && (
                <div className="flex flex-col items-center text-zinc-400">
                    <LoadingSpinner />
                    <p className="mt-4">Conjuring pixels...</p>
                </div>
            )}
             {isUpscaling && (
                <div className="flex flex-col items-center text-zinc-400">
                    <LoadingSpinner />
                    <p className="mt-4">Enhancing resolution...</p>
                </div>
            )}
            {!isLoading && !isUpscaling && !generatedImage && !error && (
                <div className="text-center text-zinc-500">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <p className="mt-2">Your generated image will appear here.</p>
                </div>
            )}
            {generatedImage && !isLoading && !isUpscaling &&(
                <div className="w-full flex flex-col items-center space-y-4 animate-fade-in">
                    <img src={`data:image/png;base64,${generatedImage}`} alt="Generated by AI" className="max-w-full max-h-[40vh] rounded-lg shadow-lg" />
                    <div className="flex items-center flex-wrap justify-center gap-4">
                         <button
                            onClick={handleGenerate}
                            disabled={isLoading || isUpscaling}
                            className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                        >
                           {isLoading ? 'Generating...' : 'Generate Again'}
                        </button>
                        <button
                            onClick={handleUpscale}
                            disabled={isLoading || isUpscaling}
                            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                        >
                            {isUpscaling ? <><LoadingSpinner /><span className="ml-2">Upscaling...</span></> : 'Upscale'}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading || isUpscaling}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                        >
                            Use this Image
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;