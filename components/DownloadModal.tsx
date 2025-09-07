import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface DownloadModalProps {
  imageSrc: string; // Used for initial display and filename
  fileName: string;
  onClose: () => void;
  getCanvasPromise: () => Promise<HTMLCanvasElement>;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ imageSrc, fileName, onClose, getCanvasPromise }) => {
  const [format, setFormat] = useState<'PNG' | 'JPEG'>('PNG');
  const [customFilename, setCustomFilename] = useState(fileName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Quality settings
  const [jpegQuality, setJpegQuality] = useState(92);
  const [targetSize, setTargetSize] = useState({
    isEnabled: false,
    size: 100,
    unit: 'KB' as 'KB' | 'MB',
  });
  
  // Create a debounced effect for filename
  useEffect(() => {
      const handler = setTimeout(() => {
          if (!customFilename.trim()) {
              setCustomFilename(fileName);
          }
      }, 500);
      return () => clearTimeout(handler);
  }, [customFilename, fileName]);


  const getBlob = (canvas: HTMLCanvasElement, mimeType: 'image/png' | 'image/jpeg', quality?: number): Promise<Blob> => {
      return new Promise((resolve, reject) => {
          canvas.toBlob(blob => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob conversion failed. The image may be tainted by cross-origin data.'));
          }, mimeType, quality);
      });
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    setDownloadError(null);
    
    try {
        const canvas = await getCanvasPromise();
        let blob: Blob;
        let finalFilename = `${customFilename.trim()}.${format.toLowerCase()}`;

        if (format === 'PNG') {
            blob = await getBlob(canvas, 'image/png');
        } else { // JPEG
            if (targetSize.isEnabled) {
                 const targetBytes = targetSize.size * (targetSize.unit === 'KB' ? 1024 : 1024 * 1024);
                 let quality = 0.95;
                 blob = await getBlob(canvas, 'image/jpeg', quality);

                 // Iteratively reduce quality to meet target size
                 while (blob.size > targetBytes && quality > 0.1) {
                     quality -= 0.05;
                     blob = await getBlob(canvas, 'image/jpeg', Math.max(0.1, quality));
                 }

            } else {
                blob = await getBlob(canvas, 'image/jpeg', jpegQuality / 100);
            }
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onClose();

    } catch (error) {
        console.error("Download failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during processing.";
        setDownloadError(errorMessage);
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-center text-zinc-200">Download Image</h2>
        
        <div className="space-y-4">
            {/* Filename */}
            <div>
                <label htmlFor="filename" className="text-sm font-medium text-zinc-400">Filename</label>
                <div className="flex items-center mt-1">
                    <input
                        id="filename"
                        type="text"
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        className="flex-grow w-full bg-zinc-700 border border-zinc-600 rounded-l-md p-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        disabled={isProcessing}
                    />
                    <span className="inline-flex items-center px-3 bg-zinc-600 text-zinc-300 border border-l-0 border-zinc-600 rounded-r-md">
                        .{format.toLowerCase()}
                    </span>
                </div>
            </div>

            {/* Format */}
            <div>
                <label className="text-sm font-medium text-zinc-400">Format</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <button onClick={() => setFormat('PNG')} disabled={isProcessing} className={`p-2 rounded-md text-center text-sm transition-colors ${format === 'PNG' ? 'bg-amber-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600'}`}>PNG</button>
                    <button onClick={() => setFormat('JPEG')} disabled={isProcessing} className={`p-2 rounded-md text-center text-sm transition-colors ${format === 'JPEG' ? 'bg-amber-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600'}`}>JPEG</button>
                </div>
            </div>
            
            {/* Quality Options */}
            {format === 'JPEG' && (
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-700">
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        id="target-size-check" 
                        checked={targetSize.isEnabled} 
                        onChange={(e) => setTargetSize(p => ({ ...p, isEnabled: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 accent-amber-500"
                        disabled={isProcessing}
                    />
                    <label htmlFor="target-size-check" className="ml-2 block text-sm text-zinc-400">
                        Target specific file size
                    </label>
                </div>

                {targetSize.isEnabled ? (
                    <div className="flex items-center gap-2 mt-3">
                        <input 
                            type="number" 
                            value={targetSize.size}
                            onChange={(e) => setTargetSize(p => ({ ...p, size: Math.max(1, +e.target.value) }))}
                            className="w-24 bg-zinc-700 border border-zinc-600 rounded-md p-1 text-center"
                            aria-label="Target file size"
                            disabled={isProcessing}
                        />
                        <select 
                            value={targetSize.unit}
                            onChange={(e) => setTargetSize(p => ({ ...p, unit: e.target.value as 'KB' | 'MB' }))}
                            className="bg-zinc-700 border border-zinc-600 rounded-md p-1"
                            aria-label="File size unit"
                            disabled={isProcessing}
                        >
                            <option>KB</option>
                            <option>MB</option>
                        </select>
                    </div>
                ) : (
                    <div className="mt-3">
                        <label htmlFor="jpeg-quality" className="text-xs text-zinc-400">Quality: {jpegQuality}%</label>
                        <input id="jpeg-quality" type="range" min="1" max="100" value={jpegQuality} onChange={(e) => setJpegQuality(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-lg accent-amber-500" disabled={isProcessing} />
                    </div>
                )}
              </div>
            )}
        </div>
        
        {downloadError && <p className="text-xs text-red-400 text-center mt-4">{downloadError}</p>}

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} disabled={isProcessing} className="px-6 py-2 rounded-lg bg-zinc-600 hover:bg-zinc-700 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleDownload} disabled={isProcessing} className="min-w-[120px] flex items-center justify-center px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
            {isProcessing ? <LoadingSpinner /> : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
