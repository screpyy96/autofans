import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button, Spinner } from '~/components/ui';

export type ListingImageUpload = {
  id: string;
  path: string;
  url: string;
  isMain: boolean;
};

type ImagePreview = ListingImageUpload & {
  file?: File;
  isUploading?: boolean;
  error?: string;
};

export interface ImageUploadProps {
  maxImages?: number;
  initialImages?: ListingImageUpload[];
  acceptedTypes?: string[];
  maxFileSize?: number;
  onUpload: (files: File[]) => Promise<ListingImageUpload[]>;
  onImagesChange: (images: ListingImageUpload[]) => void;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function normalizeMain(images: ImagePreview[]) {
  const mainId = images.find((image) => image.isMain)?.id || images[0]?.id;
  return images.map((image) => ({ ...image, isMain: image.id === mainId }));
}

export function ImageUpload({
  maxImages = 15,
  initialImages = [],
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = 10,
  onUpload,
  onImagesChange,
  className,
}: ImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const imagesRef = useRef<ImagePreview[]>([]);
  const initialKey = initialImages.map((image) => `${image.id}:${image.path}:${image.url}:${image.isMain}`).join('|');
  const appliedInitialKey = useRef<string | null>(null);

  const setImageState = useCallback((next: ImagePreview[], notify = false) => {
    imagesRef.current = next;
    setImages(next);
    if (notify) {
      onImagesChange(next
        .filter((image) => image.path)
        .map(({ id, path, url, isMain }) => ({ id, path, url, isMain })));
    }
  }, [onImagesChange]);

  useEffect(() => {
    if (appliedInitialKey.current === initialKey) return;
    appliedInitialKey.current = initialKey;
    setImageState(normalizeMain(initialImages.map((image) => ({ ...image }))), false);
  }, [initialImages, initialKey, setImageState]);

  useEffect(() => () => {
    imagesRef.current.forEach((image) => {
      if (image.file && image.url.startsWith('blob:')) URL.revokeObjectURL(image.url);
    });
  }, []);

  const validateFile = useCallback((file: File) => {
    if (!acceptedTypes.includes(file.type)) return `Format neacceptat (${file.type || 'necunoscut'}).`;
    if (file.size > maxFileSize * 1024 * 1024) return `Depășește limita de ${maxFileSize} MB.`;
    return null;
  }, [acceptedTypes, maxFileSize]);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const availableSlots = maxImages - imagesRef.current.length;
    const accepted: File[] = [];
    const errors: string[] = [];

    files.slice(0, Math.max(availableSlots, 0)).forEach((file) => {
      const error = validateFile(file);
      if (error) errors.push(`${file.name}: ${error}`);
      else accepted.push(file);
    });
    if (files.length > availableSlots) errors.push(`Poți adăuga cel mult ${Math.max(availableSlots, 0)} imagini acum.`);
    setValidationError(errors.length ? errors.join(' ') : null);
    if (!accepted.length) return;

    const temporary: ImagePreview[] = accepted.map((file) => ({
      id: `pending-${crypto.randomUUID()}`,
      path: '',
      url: URL.createObjectURL(file),
      isMain: false,
      file,
      isUploading: true,
    }));
    setImageState(normalizeMain([...imagesRef.current, ...temporary]), false);

    try {
      const uploaded = await onUpload(accepted);
      if (uploaded.length !== accepted.length) throw new Error('Nu au fost încărcate toate imaginile.');
      const pendingIds = new Set(temporary.map((image) => image.id));
      temporary.forEach((image) => URL.revokeObjectURL(image.url));
      setImageState(normalizeMain([
        ...imagesRef.current.filter((image) => !pendingIds.has(image.id)),
        ...uploaded.map((image) => ({ ...image, isUploading: false })),
      ]), true);
    } catch (error) {
      const pendingIds = new Set(temporary.map((image) => image.id));
      setImageState(imagesRef.current.map((image) => (
        pendingIds.has(image.id)
          ? { ...image, isUploading: false, error: error instanceof Error ? error.message : 'Încărcarea a eșuat.' }
          : image
      )), false);
    }
  }, [maxImages, onUpload, setImageState, validateFile]);

  const removeImage = (imageId: string) => {
    const removed = imagesRef.current.find((image) => image.id === imageId);
    if (removed?.file && removed.url.startsWith('blob:')) URL.revokeObjectURL(removed.url);
    setImageState(normalizeMain(imagesRef.current.filter((image) => image.id !== imageId)), true);
  };

  const setMainImage = (imageId: string) => {
    setImageState(imagesRef.current.map((image) => ({ ...image, isMain: image.id === imageId })), true);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative rounded-2xl border border-dashed p-5 text-center transition-colors sm:p-7',
          isDragOver ? 'border-accent-gold bg-accent-gold/10' : 'border-white/15 bg-white/[0.03] hover:border-accent-gold/50',
          !canAddMore && 'cursor-not-allowed opacity-60',
        )}
        onDragEnter={(event) => { event.preventDefault(); dragCounter.current += 1; setIsDragOver(true); }}
        onDragLeave={(event) => { event.preventDefault(); dragCounter.current -= 1; if (!dragCounter.current) setIsDragOver(false); }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          dragCounter.current = 0;
          setIsDragOver(false);
          if (event.dataTransfer.files.length) void processFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(event) => {
            if (event.target.files?.length) void processFiles(event.target.files);
            event.target.value = '';
          }}
          className="hidden"
          disabled={!canAddMore}
        />
        <ImagePlus className="mx-auto h-8 w-8 text-accent-gold" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-white">Adaugă fotografii clare ale mașinii</p>
        <p className="mt-1 text-xs text-gray-400">JPG, PNG sau WebP · maximum {maxFileSize} MB · {images.length}/{maxImages} fotografii</p>
        {canAddMore && (
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-4 border-white/15 text-white hover:border-accent-gold/50 hover:bg-white/5">
            Alege fotografii
          </Button>
        )}
      </div>
      {validationError && <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">{validationError}</p>}

      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence initial={false}>
            {images.map((image) => (
              <motion.div key={image.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-secondary-900">
                <img src={image.url} alt={image.isMain ? 'Fotografie principală a anunțului' : 'Fotografie a mașinii'} className="h-full w-full object-cover" />
                {image.isUploading && <div className="absolute inset-0 grid place-items-center bg-secondary-950/75"><Spinner size="sm" /></div>}
                {image.isMain && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent-gold px-2 py-1 text-[10px] font-bold text-secondary-950"><Star className="h-3 w-3 fill-current" /> Principală</span>}
                <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-secondary-950/95 via-secondary-950/45 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {!image.isMain && !image.isUploading && <Button type="button" size="sm" variant="outline" onClick={() => setMainImage(image.id)} className="h-8 flex-1 border-white/20 bg-secondary-950/80 px-2 text-xs text-white">Principală</Button>}
                  <Button type="button" size="sm" variant="outline" onClick={() => removeImage(image.id)} className="h-8 border-red-400/30 bg-secondary-950/80 px-2 text-red-300 hover:bg-red-500/20" aria-label="Șterge fotografia"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                {image.error && <p className="absolute inset-x-2 bottom-10 rounded bg-red-500/90 p-1.5 text-[10px] text-white">{image.error}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
