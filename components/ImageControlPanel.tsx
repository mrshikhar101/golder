import React, { useState, useEffect, useCallback } from 'react';
import CropModal from './CropModal';
import LoadingSpinner from './LoadingSpinner';
import DownloadModal from './DownloadModal';
import { editImageWithGemini } from '../services/geminiService';


interface ImageControlPanelProps {
  imageSrc: string;
  title: string;
  isEditedPanel?: boolean;
}

const filters: { name: string; style: (intensity: number) => string }[] = [
    { name: 'None', style: () => '' },
    { name: 'Auto Enhance', style: (i) => `brightness(${100 + 5 * (i/100)}%) contrast(${100 + 15 * (i/100)}%) saturate(${100 + 20 * (i/100)}%)` },
    { name: 'Grayscale', style: (i) => `grayscale(${i}%)` },
    { name: 'Sepia', style: (i) => `sepia(${i}%)` },
    { name: 'Invert', style: (i) => `invert(${i}%)` },
    { name: 'Noir', style: (i) => `grayscale(100%) contrast(${100 + 25 * (i/100)}%) brightness(${100 - 10 * (i/100)}%)` },
    { name: 'Vibrant', style: (i) => `saturate(${100 + 50 * (i/100)}%)` },
    { name: 'Cool', style: (i) => `hue-rotate(-${15 * (i/100)}deg) saturate(${100 + 25 * (i/100)}%)` },
    { name: 'Warm', style: (i) => `sepia(${20 * (i/100)}%) saturate(${100 + 25 * (i/100)}%) brightness(${100 + 5 * (i/100)}%)` },
    { name: 'High Contrast', style: (i) => `contrast(${100 + 100 * (i/100)}%)` },
    { name: 'Vintage', style: (i) => `sepia(${80 * (i/100)}%) contrast(${100 + 10 * (i/100)}%) brightness(${100 - 5 * (i/100)}%) saturate(${100 - 20 * (i/100)}%)` },
    { name: 'Cyberpunk', style: (i) => `contrast(${100 + 40 * (i/100)}%) hue-rotate(${180 * (i/100)}deg) saturate(${100 + 60 * (i/100)}%) brightness(${100 + 5 * (i/100)}%)` },
    { name: 'Pastel', style: (i) => `saturate(${100 - 40 * (i/100)}%) contrast(${100 - 25 * (i/100)}%) brightness(${100 + 10 * (i/100)}%)` },
    { name: 'Dreamy', style: (i) => `blur(${3 * (i/100)}px) brightness(${100 + 15 * (i/100)}%) contrast(${100 - 15 * (i/100)}%) saturate(${100 + 10 * (i/100)}%)` },
    { name: 'Nashville', style: (i) => `sepia(${20 * (i/100)}%) contrast(${100 + 20 * (i/100)}%) brightness(${100 + 5 * (i/100)}%) saturate(${100 + 20 * (i/100)}%)` },
    { name: 'Lomo', style: (i) => `saturate(${100 + 50 * (i/100)}%) contrast(${100 + 50 * (i/100)}%) sepia(${30 * (i/100)}%)` },
    { name: 'Gotham', style: (i) => `contrast(${100 + 30 * (i/100)}%) brightness(${100 - 10 * (i/100)}%) sepia(${30 * (i/100)}%)` },
    { name: 'Pop Art', style: (i) => `contrast(${100 + 100 * (i/100)}%) saturate(${100 + 100 * (i/100)}%) hue-rotate(${15 * (i/100)}deg)` },
    { name: 'Infrared', style: (i) => `hue-rotate(-${60 * (i/100)}deg) saturate(${100 + 100 * (i/100)}%) contrast(${100 + 50 * (i/100)}%)` },
    { name: 'Old West', style: (i) => `sepia(${100 * (i/100)}%) contrast(${100 - 10 * (i/100)}%) brightness(${100 + 10 * (i/100)}%) saturate(${100 - 20 * (i/100)}%)` },
    { name: 'Emerald City', style: (i) => `hue-rotate(${90 * (i/100)}deg) saturate(${100 + 50 * (i/100)}%) contrast(${100 + 20 * (i/100)}%)` },
];

type CroppingState = { onComplete: (newSrc: string) => void; } | null;

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  tint: number;
  vignette: number;
}
const initialAdjustments: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  tint: 0,
  vignette: 0,
};

interface RetouchOptions {
  enhanceSkin: boolean;
  brightenEyes: boolean;
  whitenTeeth: boolean;
  reduceDarkCircles: boolean;
}

const ImageControlPanel: React.FC<ImageControlPanelProps> = ({ imageSrc, title, isEditedPanel = false }) => {
  const [displayImage, setDisplayImage] = useState(imageSrc);
  const [adjustments, setAdjustments] = useState<Adjustments>(initialAdjustments);
  const [activeFilter, setActiveFilter] = useState({ name: 'None', intensity: 100 });
  const [croppingState, setCroppingState] = useState<CroppingState>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | undefined>();
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [retouchOptions, setRetouchOptions] = useState<RetouchOptions>({
    enhanceSkin: false,
    brightenEyes: false,
    whitenTeeth: false,
    reduceDarkCircles: false,
  });
  const [isRetouching, setIsRetouching] = useState(false);
  const [retouchError, setRetouchError] = useState<string | null>(null);


  useEffect(() => {
    setDisplayImage(imageSrc);
    setAdjustments(initialAdjustments);
    setActiveFilter({ name: 'None', intensity: 100 });
  }, [imageSrc]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalHeight > 0) {
      setImageAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const getCombinedStyle = useCallback((): React.CSSProperties => {
    const filterFunc = filters.find(f => f.name === activeFilter.name)?.style(activeFilter.intensity) || '';
    const adjustmentFilter = `
      brightness(${adjustments.brightness}%) 
      contrast(${adjustments.contrast}%) 
      saturate(${adjustments.saturation}%) 
      sepia(${adjustments.warmth}%) 
      hue-rotate(${adjustments.tint}deg)
    `;
    return { filter: `${filterFunc} ${adjustmentFilter}`.trim() };
  }, [adjustments, activeFilter]);

  const vignetteStyle: React.CSSProperties = {
      boxShadow: `inset 0 0 ${adjustments.vignette * 1.5}px ${adjustments.vignette * 0.5}px rgba(0,0,0,0.5)`
  };

  const renderImageWithEffectsToCanvas = useCallback(async (sourceImage: string): Promise<HTMLCanvasElement> => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = sourceImage;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.filter = getCombinedStyle().filter || 'none';
    ctx.drawImage(img, 0, 0);

    if (adjustments.vignette > 0) {
      const outerRadius = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width / 2 * (1 - adjustments.vignette / 120),
        canvas.width / 2, canvas.height / 2, outerRadius
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100 * 0.6})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }, [getCombinedStyle, adjustments.vignette]);


  const handleApplyRetouch = async () => {
    const selectedOptions = Object.entries(retouchOptions)
        .filter(([, value]) => value)
        .map(([key]) => key);

    if (selectedOptions.length === 0) {
        setRetouchError("Please select at least one retouch option.");
        return;
    }

    setRetouchError(null);
    setIsRetouching(true);

    try {
        const canvas = await renderImageWithEffectsToCanvas(displayImage);
        const currentImageBase64 = canvas.toDataURL('image/png');
        const base64Data = currentImageBase64.split(',')[1];
        
        const promptCommands = [];
        if (retouchOptions.enhanceSkin) promptCommands.push("perform skin enhancement to smooth texture and reduce blemishes");
        if (retouchOptions.brightenEyes) promptCommands.push("brighten the eyes");
        if (retouchOptions.whitenTeeth) promptCommands.push("whiten the teeth");
        if (retouchOptions.reduceDarkCircles) promptCommands.push("reduce dark circles under the eyes");

        const prompt = `Subtly retouch this portrait. Please ${promptCommands.join(', ')}. Maintain a natural look.`;

        const resultBase64 = await editImageWithGemini(base64Data, 'image/png', prompt);
        setDisplayImage(`data:image/png;base64,${resultBase64}`);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setRetouchError(`Retouch failed: ${errorMessage}`);
        console.error(err);
    } finally {
        setIsRetouching(false);
    }
  };


  const AdjustmentSlider = ({ label, id, value, min, max, onChange, unit = '%' }: { label: string, id: string, value: number, min: number, max: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string }) => (
    <div>
        <label htmlFor={id} className="text-xs text-zinc-400">{label}: {value}{unit}</label>
        <input id={id} type="range" min={min} max={max} value={value} onChange={onChange} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-lg accent-amber-500" />
    </div>
  );
  
  const RetouchCheckbox = ({ label, id, checked, onChange }: { label: string, id: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
      <div className="flex items-center">
          <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 accent-amber-500"
              disabled={isRetouching}
          />
          <label htmlFor={id} className="ml-2 block text-sm text-zinc-300">
              {label}
          </label>
      </div>
  );


  return (
    <>
      {croppingState && (
        <CropModal
          imageSrc={displayImage}
          onCropComplete={(newSrc) => {
              setDisplayImage(newSrc);
              setCroppingState(null);
          }}
          onClose={() => setCroppingState(null)}
        />
      )}
      {isDownloadModalOpen && (
          <DownloadModal
            imageSrc={displayImage}
            fileName={`edited-photo-${title}`}
            onClose={() => setIsDownloadModalOpen(false)}
            getCanvasPromise={() => renderImageWithEffectsToCanvas(displayImage)}
          />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* --- Image Column --- */}
        <div className="lg:col-span-2 flex flex-col items-center space-y-4">
            <h3 className={`text-xl font-semibold ${isEditedPanel ? 'text-amber-400' : 'text-zinc-300'}`}>{title}</h3>
            <div 
            className={`w-full rounded-xl overflow-hidden border-2 ${isEditedPanel ? 'border-amber-500' : 'border-zinc-700'} bg-zinc-900 flex items-center justify-center relative`}
            style={{ aspectRatio: imageAspectRatio }}
            >
            <img src={displayImage} alt={title} className="w-full h-full object-contain transition-all duration-300" style={getCombinedStyle()} onLoad={handleImageLoad}/>
            <div className="absolute inset-0 pointer-events-none" style={vignetteStyle}></div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setCroppingState({ onComplete: setDisplayImage })} className="px-4 py-2 text-sm rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors">Crop</button>
                <button onClick={() => setIsDownloadModalOpen(true)} className="min-w-[120px] flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
                    Download
                </button>
            </div>
        </div>

        {/* --- Controls Column --- */}
        <div className="lg:col-span-1 w-full space-y-4">
            <details className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700" open>
                <summary className="cursor-pointer font-semibold text-zinc-300">Adjustments</summary>
                <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-zinc-400 border-b border-zinc-600 pb-1">Light</h4>
                    <AdjustmentSlider label="Brightness" id={`${title}-brightness`} value={adjustments.brightness} min={0} max={200} onChange={(e) => setAdjustments(p => ({ ...p, brightness: +e.target.value }))} />
                    <AdjustmentSlider label="Contrast" id={`${title}-contrast`} value={adjustments.contrast} min={0} max={200} onChange={(e) => setAdjustments(p => ({ ...p, contrast: +e.target.value }))} />

                    <h4 className="text-sm font-semibold text-zinc-400 border-b border-zinc-600 pb-1 pt-2">Color</h4>
                    <AdjustmentSlider label="Saturation" id={`${title}-saturation`} value={adjustments.saturation} min={0} max={200} onChange={(e) => setAdjustments(p => ({ ...p, saturation: +e.target.value }))} />
                    <AdjustmentSlider label="Warmth" id={`${title}-warmth`} value={adjustments.warmth} min={0} max={100} onChange={(e) => setAdjustments(p => ({ ...p, warmth: +e.target.value }))} unit="" />
                    <AdjustmentSlider label="Tint" id={`${title}-tint`} value={adjustments.tint} min={-180} max={180} onChange={(e) => setAdjustments(p => ({ ...p, tint: +e.target.value }))} unit="deg" />
                    
                    <h4 className="text-sm font-semibold text-zinc-400 border-b border-zinc-600 pb-1 pt-2">Effects</h4>
                    <AdjustmentSlider label="Vignette" id={`${title}-vignette`} value={adjustments.vignette} min={0} max={100} onChange={(e) => setAdjustments(p => ({ ...p, vignette: +e.target.value }))} />

                    <button onClick={() => setAdjustments(initialAdjustments)} className="text-xs text-zinc-400 hover:text-amber-400 transition-colors w-full text-center pt-2">Reset Adjustments</button>
                </div>
            </details>
            
            <details className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700" open>
                <summary className="cursor-pointer font-semibold text-zinc-300">Filters</summary>
                 {activeFilter.name !== 'None' && (
                    <div className="w-full my-3">
                        <label htmlFor={`${title}-intensity`} className="text-xs text-zinc-400">Intensity: {activeFilter.intensity}%</label>
                        <input id={`${title}-intensity`} type="range" min="0" max="100" value={activeFilter.intensity} onChange={(e) => setActiveFilter(p => ({ ...p, intensity: +e.target.value }))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-lg accent-amber-500" aria-label="Filter intensity" />
                    </div>
                 )}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {filters.map(filter => (
                        <button key={`${title}-${filter.name}`} onClick={() => setActiveFilter({ name: filter.name, intensity: 100 })} className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${activeFilter.name === filter.name ? 'bg-amber-600 text-white shadow-md' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                            {filter.name}
                        </button>
                    ))}
                </div>
            </details>

            <details className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700">
                <summary className="cursor-pointer font-semibold text-zinc-300">Retouch (AI)</summary>
                <div className="mt-4 space-y-3">
                    <p className="text-xs text-zinc-400">Select desired enhancements and apply them using AI. This may take a moment.</p>
                    <RetouchCheckbox id={`${title}-skin`} label="Enhance Skin" checked={retouchOptions.enhanceSkin} onChange={e => setRetouchOptions(p => ({...p, enhanceSkin: e.target.checked}))} />
                    <RetouchCheckbox id={`${title}-eyes`} label="Brighten Eyes" checked={retouchOptions.brightenEyes} onChange={e => setRetouchOptions(p => ({...p, brightenEyes: e.target.checked}))} />
                    <RetouchCheckbox id={`${title}-teeth`} label="Whiten Teeth" checked={retouchOptions.whitenTeeth} onChange={e => setRetouchOptions(p => ({...p, whitenTeeth: e.target.checked}))} />
                    <RetouchCheckbox id={`${title}-dark-circles`} label="Reduce Dark Circles" checked={retouchOptions.reduceDarkCircles} onChange={e => setRetouchOptions(p => ({...p, reduceDarkCircles: e.target.checked}))} />
                    
                    {retouchError && <p className="text-xs text-red-400 text-center">{retouchError}</p>}
                    
                    <button 
                        onClick={handleApplyRetouch} 
                        disabled={isRetouching || !Object.values(retouchOptions).some(v => v)}
                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 mt-2"
                    >
                       {isRetouching ? <><LoadingSpinner /><span className="ml-2">Retouching...</span></> : 'Apply AI Retouch'}
                    </button>
                </div>
            </details>

        </div>
      </div>
    </>
  );
};

export default ImageControlPanel;
