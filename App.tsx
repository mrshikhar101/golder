import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageEditor from './components/ImageEditor';
import ResultDisplay from './components/ResultDisplay';
import ErrorAlert from './components/ErrorAlert';
import { editImageWithGemini } from './services/geminiService';
import type { ImageFile } from './types';
import EditorChoice from './components/EditorChoice';
import ImageGenerator from './components/ImageGenerator';

type EditingStep = 'upload' | 'choice' | 'ai-edit' | 'studio' | 'generation';

const App: React.FC = () => {
  const [editingStep, setEditingStep] = useState<EditingStep>('upload');
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);
      setOriginalImage({ file, base64, mimeType: file.type });
      setEditedImage(null);
      setPrompt('');
      setEditingStep('choice');
    } catch (err) {
      setError('Failed to process image file. Please try another one.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmitEdit = async (imageData: { base64: string; mimeType: string }) => {
    if (!prompt.trim()) {
      setError('Please ensure you have a prompt written.');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setEditedImage(null);

    try {
      const base64Data = imageData.base64.split(',')[1];
      const resultBase64 = await editImageWithGemini(base64Data, imageData.mimeType, prompt);
      setEditedImage(`data:image/png;base64,${resultBase64}`);
      setEditingStep('studio');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Editing failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageGenerated = (base64Data: string) => {
    const fullBase64 = `data:image/png;base64,${base64Data}`;
    // Create a mock file object since we don't have a real file
    const dummyFile = new File([""], "generated-image.png", { type: "image/png" });
    setOriginalImage({
        file: dummyFile,
        base64: fullBase64,
        mimeType: 'image/png'
    });
    setEditedImage(null);
    setPrompt(''); // Clear prompt from AI edit screen
    setError(null);
    setEditingStep('studio');
  };


  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
    setIsLoading(false);
    setEditingStep('upload');
  };
  
  const renderContent = () => {
    switch (editingStep) {
      case 'upload':
        return <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} onStartGeneration={() => setEditingStep('generation')} />;
      case 'generation':
        return <ImageGenerator onImageGenerated={handleImageGenerated} onBack={() => setEditingStep('upload')} />;
      case 'choice':
        return originalImage && (
            <EditorChoice
                imageSrc={originalImage.base64}
                onAiEdit={() => setEditingStep('ai-edit')}
                onManualEdit={() => setEditingStep('studio')}
                onReset={handleReset}
            />
        );
      case 'ai-edit':
        return originalImage && (
          <ImageEditor
            image={originalImage}
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleSubmitEdit}
            isLoading={isLoading}
            onReset={handleReset}
            onBack={() => setEditingStep('choice')}
          />
        );
      case 'studio':
        return originalImage && (
          <ResultDisplay
            originalImage={originalImage.base64}
            editedImage={editedImage}
            prompt={prompt}
            onReset={handleReset}
          />
        );
      default:
        return <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} onStartGeneration={() => setEditingStep('generation')} />;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
        {renderContent()}
      </main>
      <footer className="text-center p-4">
        <p className="font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            Made in India by the man who is single-handedly rewriting the record books, the reigning, the conqueror, the man who does not show mercy, the one who delivers the pain…, He is the beast incarnate…
        </p>
      </footer>
    </div>
  );
};

export default App;