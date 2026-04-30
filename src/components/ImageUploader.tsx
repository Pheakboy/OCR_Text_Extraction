import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_SIZE = 10 * 1024 * 1024;

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function ImageUploader({
  onFileSelect,
  isProcessing,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const validateAndSelect = useCallback(
    (file: File) => {
      setError("");
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Invalid file type. Please upload a PNG, JPG, or JPEG image.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  const clear = useCallback(() => {
    setPreview(null);
    setFileName("");
    setError("");
  }, []);

  return (
    <div className="space-y-4">
      {!preview ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden
            ${
              dragOver
                ? "border-teal-400 bg-teal-50/80 dark:bg-teal-500/10 scale-[1.02]"
                : "border-slate-300 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/40 hover:border-teal-400/60 dark:hover:border-teal-500/50 hover:bg-white/80 dark:hover:bg-slate-800/60"
            }
            ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-teal-500/5 group-hover:via-cyan-500/5 group-hover:to-teal-500/5 dark:group-hover:from-teal-500/10 dark:group-hover:via-cyan-500/10 dark:group-hover:to-teal-500/10 transition-all duration-500" />

          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
          <div
            className={`relative p-4 rounded-2xl transition-all duration-300 ${dragOver ? "bg-teal-100 dark:bg-teal-500/20" : "bg-white dark:bg-slate-800/80 shadow-sm border border-slate-200 dark:border-slate-700/60 group-hover:border-teal-200 dark:group-hover:border-teal-500/40 group-hover:shadow-md dark:group-hover:shadow-none"}`}
          >
            <Upload
              className={`w-8 h-8 transition-colors ${dragOver ? "text-teal-500 dark:text-teal-400" : "text-slate-400 dark:text-slate-500 group-hover:text-teal-500 dark:group-hover:text-teal-400"}`}
            />
          </div>
          <p className="relative mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            {dragOver
              ? "Drop your image here"
              : "Drag & drop an image or click to browse"}
          </p>
          <p className="relative mt-1 text-xs text-slate-500 dark:text-slate-400">
            PNG, JPG, JPEG up to 10MB
          </p>
        </label>
      ) : (
        <div className="relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-500/10 dark:to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/20 border border-teal-100 dark:border-teal-500/30">
                  <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="truncate max-w-[200px] font-medium">
                  {fileName}
                </span>
              </div>
              {!isProcessing && (
                <button
                  onClick={clear}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative rounded-xl overflow-hidden bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 border-3 border-teal-200 dark:border-teal-500/30 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin" />
                      <div className="absolute inset-0 w-12 h-12 border-3 border-teal-100 dark:border-teal-500/10 rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                      Processing...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm shadow-sm dark:shadow-none">
          {error}
        </div>
      )}
    </div>
  );
}
