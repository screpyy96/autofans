import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import { Button, Spinner } from '~/components/ui';

export interface ImageUploadProps {
  maxImages?: number;
  onImagesChange: (images: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  initialImages?: string[];
  className?: string;
}

interface ImagePreview {
  id: string;
  file: File;
  url: string;
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
  isMain: boolean;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function ImageUpload({
  maxImages = 10,
  onImagesChange,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFileSize = 10,
  initialImages = [],
  className
}: ImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [cropData, setCropData] = useState<CropData>({ x: 0, y: 0, width: 100, height: 100, rotation: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Initialize with existing images
  useEffect(() => {
    if (initialImages.length > 0) {
      const initialPreviews: ImagePreview[] = initialImages.map((url, index) => ({
        id: `initial-${index}`,
        file: new File([], `image-${index}.jpg`), // Placeholder file
        url,
        isUploading: false,
        uploadProgress: 100,
        isMain: index === 0
      }));
      setImages(initialPreviews);
    }
  }, [initialImages]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipul de fișier ${file.type} nu este acceptat. Folosește: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Fișierul este prea mare. Dimensiunea maximă: ${maxFileSize}MB`;
    }
    
    return null;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      alert(`Poți încărca maximum ${remainingSlots} imagini suplimentare`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(`Erori la încărcarea fișierelor:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      const newImages: ImagePreview[] = validFiles.map(file => ({
        id: generateId(),
        file,
        url: URL.createObjectURL(file),
        isUploading: true,
        uploadProgress: 0,
        isMain: images.length === 0 && validFiles.indexOf(file) === 0
      }));

      setImages(prev => [...prev, ...newImages]);
      
      // Simulate upload progress
      newImages.forEach(image => {
        simulateUpload(image.id);
      });

      // Notify parent component
      onImagesChange([...images.map(img => img.file), ...validFiles]);
    }
  }, [images, maxImages, onImagesChange, acceptedTypes, maxFileSize]);

  const simulateUpload = (imageId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, uploadProgress: progress, isUploading: progress < 100 }
          : img
      ));
    }, 200);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      // If we removed the main image, make the first remaining image main
      if (filtered.length > 0 && !filtered.some(img => img.isMain)) {
        filtered[0].isMain = true;
      }
      onImagesChange(filtered.map(img => img.file));
      return filtered;
    });
  };

  const setMainImage = (imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isMain: img.id === imageId
    })));
  };

  const rotateImage = (imageId: string, degrees: number) => {
    // This would typically involve canvas manipulation
    // For now, we'll just update the rotation value
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, url: img.url } // In real implementation, apply rotation
        : img
    ));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Zone */}
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
          isDragOver 
            ? 'border-primary-500 bg-primary-50' 
            : canAddMore 
              ? 'border-gray-300 hover:border-gray-400' 
              : 'border-gray-200 bg-gray-50',
          !canAddMore && 'cursor-not-allowed opacity-50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        whileHover={canAddMore ? { scale: 1.01 } : {}}
        whileTap={canAddMore ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={!canAddMore}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {canAddMore ? 'Încarcă imagini' : `Maximum ${maxImages} imagini`}
            </h3>
            <p className="text-gray-600 mb-4">
              {canAddMore 
                ? 'Trage și lasă imaginile aici sau fă click pentru a selecta'
                : 'Ai atins limita maximă de imagini'
              }
            </p>
            {canAddMore && (
              <Button onClick={openFileDialog} variant="outline">
                Selectează imagini
              </Button>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Formate acceptate: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}</p>
            <p>Dimensiune maximă: {maxFileSize}MB per imagine</p>
            <p>{images.length} / {maxImages} imagini încărcate</p>
          </div>
        </div>
        
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-primary-500 bg-opacity-10 rounded-lg flex items-center justify-center"
          >
            <p className="text-primary-700 font-medium text-lg">
              Lasă imaginile aici
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            Imagini încărcate ({images.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className={cn(
                    'relative aspect-square rounded-lg overflow-hidden border-2',
                    image.isMain ? 'border-primary-500' : 'border-gray-200'
                  )}>
                    <img
                      src={image.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Upload Progress */}
                    {image.isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Spinner size="sm" className="mb-2" />
                          <p className="text-sm">{Math.round(image.uploadProgress)}%</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Main Image Badge */}
                    {image.isMain && (
                      <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                        Principală
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-2">
                        {!image.isMain && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMainImage(image.id)}
                            className="bg-white text-gray-900 hover:bg-gray-100"
                          >
                            Principală
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotateImage(image.id, 90)}
                          className="bg-white text-gray-900 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeImage(image.id)}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {image.error && (
                    <p className="text-red-600 text-xs mt-1">{image.error}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Tips */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Sfaturi pentru imagini de calitate</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Prima imagine va fi afișată ca imagine principală</li>
                  <li>• Folosește imagini cu rezoluție înaltă și bine iluminate</li>
                  <li>• Fotografiază mașina din toate unghiurile importante</li>
                  <li>• Include imagini cu interiorul și motorul</li>
                  <li>• Evită imaginile blurate sau cu reflexii</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}