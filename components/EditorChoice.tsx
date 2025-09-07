import React from 'react';

interface EditorChoiceProps {
  imageSrc: string;
  onAiEdit: () => void;
  onManualEdit: () => void;
  onReset: () => void;
}

const EditorChoice: React.FC<EditorChoiceProps> = ({ imageSrc, onAiEdit, onManualEdit, onReset }) => {
  return (
    <div className="w-full max-w-4xl text-center p-4 md:p-8 bg-zinc-800/50 rounded-2xl border border-zinc-700 shadow-2xl backdrop-blur-md animate-fade-in">
      <h2 className="text-3xl font-bold text-zinc-100 mb-4">Choose Your Path</h2>
      <p className="text-zinc-400 mb-8">How would you like to edit your photo?</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="w-full rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center">
          <img src={imageSrc} alt="Your upload" className="max-h-[40vh] object-contain" />
        </div>
        
        <div className="flex flex-col space-y-6">
          <button 
            onClick={onAiEdit}
            className="group flex flex-col items-center justify-center p-6 bg-zinc-700/50 hover:bg-amber-900/40 rounded-xl border-2 border-zinc-600 hover:border-amber-500 transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-12 h-12 mb-3 text-amber-400 group-hover:animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-xl font-bold text-zinc-200">AI Magic Edit</h3>
            <p className="text-sm text-zinc-400 mt-1">Use a text prompt to transform your image.</p>
          </button>
          
          <button 
            onClick={onManualEdit}
            className="group flex flex-col items-center justify-center p-6 bg-zinc-700/50 hover:bg-blue-900/40 rounded-xl border-2 border-zinc-600 hover:border-blue-500 transition-all duration-300 transform hover:scale-105"
          >
             <svg className="w-12 h-12 mb-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 16v-2m8-8h-2M4 12H2m15.364-6.364l-1.414 1.414M6.05 19.95l-1.414-1.414M18 12a6 6 0 11-12 0 6 6 0 0112 0z" />
             </svg>
            <h3 className="text-xl font-bold text-zinc-200">Manual Studio</h3>
            <p className="text-sm text-zinc-400 mt-1">Use sliders to adjust light, color, and effects.</p>
          </button>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onReset}
          className="text-sm text-zinc-400 hover:text-amber-400 transition-colors duration-200"
        >
          Or upload a different photo
        </button>
      </div>
    </div>
  );
};

export default EditorChoice;
