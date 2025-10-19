import { useState, useCallback } from 'react';
import { Upload, FileCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeSHA256 } from '@/utils/hash';
import { toast } from 'react-hot-toast';

interface UploadCardProps {
  onHashComputed: (hash: string, fileName: string, file: File) => void;
  isProcessing?: boolean;
}

export function UploadCard({ onHashComputed, isProcessing = false }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(async (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File too large! Max 10MB');
      return;
    }

    setFile(selectedFile);
    setIsHashing(true);
    setProgress(0);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const hash = await computeSHA256(selectedFile);
      setProgress(100);
      clearInterval(progressInterval);
      setTimeout(() => {
        onHashComputed(hash, selectedFile.name, selectedFile);
        setIsHashing(false);
      }, 300);
    } catch (error) {
      clearInterval(progressInterval);
      toast.error('Failed to compute hash');
      setIsHashing(false);
      setFile(null);
    }
  }, [onHashComputed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass p-8 rounded-2xl"
    >
      <label
        htmlFor="file-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center
          min-h-[300px] border-2 border-dashed rounded-xl
          transition-all duration-300 cursor-pointer
          ${isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-white/20 hover:border-primary/50'}
          ${isProcessing || isHashing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) handleFile(selectedFile);
          }}
          disabled={isProcessing || isHashing}
        />

        <AnimatePresence mode="wait">
          {isHashing ? (
            <motion.div
              key="hashing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <p className="text-lg font-medium">Computing SHA-256 hash...</p>
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">{file.name}</p>
              )}
            </motion.div>
          ) : file ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <FileCheck className="w-16 h-16 text-success" />
              <p className="text-lg font-medium">Hash computed!</p>
              <p className="text-sm text-muted-foreground">{file.name}</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 text-center px-4"
            >
              <Upload className="w-16 h-16 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Max 10MB • All file types supported
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your file stays local - only the hash is computed
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    </motion.div>
  );
}
