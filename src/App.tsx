import { useState, useEffect, useCallback, useRef } from "react";
import Tesseract from "tesseract.js";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import { AuthForm } from "./components/AuthForm";
import { ImageUploader } from "./components/ImageUploader";
import { ResultDisplay } from "./components/ResultDisplay";
// import { OcrHistory } from "./components/OcrHistory";
import { Footer } from "./components/Footer";
import {
  ScanText,
  LogOut,
  AlertCircle,
  Globe,
  Clock,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

const LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "chi_sim", label: "Chinese (Simplified)" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
  { code: "ara", label: "Arabic" },
  { code: "hin", label: "Hindi" },
  { code: "rus", label: "Russian" },
  { code: "khm", label: "Khmer" },
];

const PSM_MODES = [
  { value: "3", label: "Automatic (Default)" },
  { value: "6", label: "Single Block of Text" },
  { value: "1", label: "Automatic with OSD" },
  { value: "4", label: "Single Column" },
  { value: "7", label: "Single Line" },
  { value: "11", label: "Sparse Text (Scattered)" },
  { value: "12", label: "Sparse Text + OSD" },
];

interface OcrResult {
  text: string;
  confidence: number;
  language: string;
  imageName: string;
}

interface OcrRecord {
  id: string;
  image_name: string;
  extracted_text: string;
  language: string;
  confidence: number;
  created_at: string;
}

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("eng");
  const [psm, setPsm] = useState("3");
  const [enhanceImage, setEnhanceImage] = useState(true);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      // Default to light mode if nothing is saved
      if (saved) return saved === "dark";
      return false; // Default light mode
    }
    return false;
  });

  // Effect to apply the dark class to the HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError("");
  }, []);

  const saveResult = async (
    text: string,
    confidence: number,
    lang: string,
    imageName: string,
  ) => {
    if (!user) return;
    try {
      await supabase.from("ocr_results").insert({
        user_id: user.id,
        image_name: imageName,
        extracted_text: text,
        language: lang,
        confidence,
      });
      setHistoryRefresh((prev) => prev + 1);
    } catch {
      // Save failure shouldn't block the user
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError("");
    setResult(null);
    setProgress(0);

    try {
      let imageToProcess: string | File = selectedFile;

      if (enhanceImage) {
        // Image Preprocessing using Canvas
        const img = new Image();
        const imageUrl = URL.createObjectURL(selectedFile);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply Grayscale and Contrast enhancement
          const contrast = 1.2; // Increase contrast
          const intercept = 128 * (1 - contrast);
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Grayscale (ITU-R 601-2 Luma transform)
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Contrast
            gray = gray * contrast + intercept;
            
            // Clamp
            gray = Math.min(255, Math.max(0, gray));
            
            data[i] = data[i + 1] = data[i + 2] = gray;
          }
          
          ctx.putImageData(imageData, 0, 0);
          imageToProcess = canvas.toDataURL("image/png");
        }
        URL.revokeObjectURL(imageUrl);
      }

      // Create worker with no Web Worker - runs in main thread
      const worker = await Tesseract.createWorker(language, 1, {
        workerPath: "",
        workerBlobURL: false,
        corePath:
          "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0_best",
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      workerRef.current = worker;
      
      // Set PSM mode
      await worker.setParameters({
        tessedit_pageseg_mode: psm as any,
      });

      const { data } = await worker.recognize(imageToProcess);

      const extractedText = data.text.trim();
      const confidence = Math.round(data.confidence);

      await worker.terminate();
      workerRef.current = null;

      if (!extractedText) {
        setError(
          "No text could be extracted from the image. Try a clearer image with visible text.",
        );
        return;
      }

      setResult({
        text: extractedText,
        confidence,
        language,
        imageName: selectedFile.name,
      });

      await saveResult(extractedText, confidence, language, selectedFile.name);
    } catch (err) {
      // If worker approach fails, try the scheduler approach
      try {
        const { data } = await Tesseract.recognize(selectedFile, language, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
          // Note: Tesseract.recognize (scheduler version) has limited support for custom parameters in some versions
        });

        const extractedText = data.text.trim();
        const confidence = Math.round(data.confidence);

        if (!extractedText) {
          setError(
            "No text could be extracted from the image. Try a clearer image with visible text.",
          );
          return;
        }

        setResult({
          text: extractedText,
          confidence,
          language,
          imageName: selectedFile.name,
        });

        await saveResult(
          extractedText,
          confidence,
          language,
          selectedFile.name,
        );
      } catch (innerErr) {
        setError(
          innerErr instanceof Error
            ? innerErr.message
            : "An unexpected error occurred during OCR processing",
        );
      }
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleHistorySelect = (record: OcrRecord) => {
    setResult({
      text: record.extracted_text,
      confidence: record.confidence,
      language: record.language,
      imageName: record.image_name,
    });
    setSelectedFile(null);
    setError("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-slate-950 to-slate-950" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center animate-pulse">
              <ScanText className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-teal-500/20 animate-ping" />
          </div>
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-100/50 via-slate-50 to-slate-50 dark:from-teal-500/12 dark:via-slate-950 dark:to-slate-950 transition-colors duration-300" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-100/50 via-transparent to-transparent dark:from-cyan-500/10 transition-colors duration-300" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <section className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/20">
                <ScanText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 transition-colors duration-300">
                  OCR Workspace
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/20 text-teal-600 dark:text-teal-300 rounded-md border border-teal-500/20 dark:border-teal-500/30">
                    <Sparkles className="w-3 h-3 inline" />
                  </span>
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 transition-colors duration-300">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600 dark:text-slate-300 transition-colors duration-300">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition-all shadow-sm dark:shadow-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="xl:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 shadow-sm dark:shadow-none transition-colors duration-300">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-4 transition-colors duration-300">
                Upload & Settings
              </h2>
              <ImageUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
              />

              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">
                  <Globe className="w-4 h-4 text-teal-500 dark:text-teal-400 transition-colors duration-300" />
                  OCR Language
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 appearance-none transition-colors duration-300 shadow-sm dark:shadow-none"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors duration-300" />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">
                  <ScanText className="w-4 h-4 text-teal-500 dark:text-teal-400 transition-colors duration-300" />
                  Text Layout (PSM)
                </label>
                <div className="relative">
                  <select
                    value={psm}
                    onChange={(e) => setPsm(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 appearance-none transition-colors duration-300 shadow-sm dark:shadow-none"
                  >
                    {PSM_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-slate-400 dark:border-t-slate-500" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">AI Image Enhancement</span>
                </div>
                <button
                  onClick={() => setEnhanceImage(!enhanceImage)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${enhanceImage ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span
                    className={`${enhanceImage ? 'translate-x-4' : 'translate-x-1'} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>

              <button
                onClick={handleExtract}
                disabled={!selectedFile || isProcessing}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-100 dark:disabled:from-slate-800 disabled:to-slate-100 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border-slate-200 dark:disabled:border-slate-800 border dark:border-0 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md dark:shadow-lg shadow-teal-500/20"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Extracting... {progress}%
                  </>
                ) : (
                  <>
                    <ScanText className="w-5 h-5" />
                    Extract Text
                  </>
                )}
              </button>

              {isProcessing && (
                <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors duration-300">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 backdrop-blur-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                Recent History
              </h2>
              <OcrHistory
                userId={user.id}
                onSelect={handleHistorySelect}
                refreshTrigger={historyRefresh}
              />
            </div> */}
          </aside>

          <section className="xl:col-span-8 space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl transition-colors duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5 transition-colors duration-300" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 transition-colors duration-300">
                    Extraction Failed
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400/80 mt-1 transition-colors duration-300">{error}</p>
                </div>
              </div>
            )}

            {result ? (
              <ResultDisplay
                text={result.text}
                confidence={result.confidence}
                language={result.language}
                imageName={result.imageName}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/55 backdrop-blur-xl min-h-[460px] flex items-center justify-center p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                <div className="text-center max-w-md">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-500/20 dark:to-cyan-500/20 border border-teal-100 dark:border-teal-500/25 flex items-center justify-center mb-4 transition-colors duration-300">
                    <ScanText className="w-7 h-7 text-teal-600 dark:text-teal-300 transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white transition-colors duration-300">
                    Your extracted text appears here
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
                    Upload an image on the left, choose a language, and click
                    extract.
                  </p>
                </div>
              </div>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default App;
