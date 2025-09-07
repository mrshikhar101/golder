import React from 'react';
import ImageControlPanel from './ImageControlPanel';

interface ResultDisplayProps {
  originalImage: string;
  editedImage: string | null; // Can be null for manual-only editing
  prompt: string;
  onReset: () => void;
}


const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImage, editedImage, prompt, onReset }) => {

  const titleText = editedImage ? "Edit Complete!" : "Photo Studio";
  const subText = editedImage 
    ? <>Prompt: <span className="font-medium text-zinc-300">"{prompt}"</span></>
    : "Apply adjustments, filters, and other effects to your image.";


  return (
    <div className="w-full max-w-7xl p-4 md:p-8 bg-zinc-800/50 rounded-2xl border border-zinc-700 shadow-2xl backdrop-blur-md animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-100">{titleText}</h2>
            <p className="text-zinc-400 mt-2 max-w-2xl mx-auto">{subText}</p>
        </div>
        
        <div className={`grid grid-cols-1 ${editedImage ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4 md:gap-8`}>
            {editedImage ? (
                <>
                    <ImageControlPanel imageSrc={originalImage} title="Original" />
                    <ImageControlPanel imageSrc={editedImage} title="Edited" isEditedPanel />
                </>
            ) : (
                <div className="max-w-4xl mx-auto w-full">
                     <ImageControlPanel imageSrc={originalImage} title="Editor" />
                </div>
            )}
        </div>

        <div className="text-center mt-8">
            <button
                onClick={onReset}
                className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
            >
                Start Over
            </button>
        </div>
    </div>
  );
};

export default ResultDisplay;