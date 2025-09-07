import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';

interface CropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImageSrc: string) => void;
  onClose: () => void;
}

// Helper function to generate a cropped image from a canvas
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('Canvas context is not available.'));
  }

  const pixelRatio = window.devicePixelRatio;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/png'));
  });
}

const aspectRatios = [
  { name: 'Free', value: undefined },
  { name: '1:1', value: 1 / 1 },
  { name: '4:3', value: 4 / 3 },
  { name: '3:4', value: 3 / 4 },
  { name: '16:9', value: 16 / 9 },
  { name: '9:16', value: 9 / 16 },
  { name: '3:2', value: 3 / 2 },
];

const CropModal: React.FC<CropModalProps> = ({ imageSrc, onCropComplete, onClose }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropAspect, setCropAspect] = useState<number | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        cropAspect || height / width,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(initialCrop);
  }

  // When aspect ratio changes, reset the crop
  useEffect(() => {
    if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                cropAspect || height / width,
                width,
                height,
            ),
            width,
            height,
        );
        setCrop(newCrop);
    }
  }, [cropAspect]);

  const handleConfirmCrop = async () => {
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && imgRef.current) {
      try {
        const croppedImageBase64 = await getCroppedImg(imgRef.current, completedCrop);
        onCropComplete(croppedImageBase64);
        onClose();
      } catch (e) {
        console.error('Cropping failed', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4 text-center">Crop Image</h2>
        <div className="bg-zinc-900 p-4 rounded-lg flex justify-center items-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={cropAspect}
            className="max-h-[60vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Image to crop"
              onLoad={onImageLoad}
              className="max-h-[60vh] object-contain"
            />
          </ReactCrop>
        </div>
        <div className="w-full space-y-2 mt-4">
            <h4 className="text-sm font-semibold text-zinc-400 text-center">Aspect Ratio</h4>
            <div className="flex flex-wrap gap-2 justify-center">
                {aspectRatios.map(ratio => (
                    <button
                        key={ratio.name}
                        onClick={() => setCropAspect(ratio.value)}
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${cropAspect === ratio.value ? 'bg-amber-600 text-white shadow-md' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}
                    >
                        {ratio.name}
                    </button>
                ))}
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-zinc-600 hover:bg-zinc-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirmCrop} className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors">
            Confirm Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;