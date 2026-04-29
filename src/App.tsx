import { useState, useCallback, useRef } from "react";
import Tesseract from "tesseract.js";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import { AuthForm } from "./components/AuthForm";
import { ImageUploader } from "./components/ImageUploader";
import { ResultDisplay } from "./components/ResultDisplay";
import { OcrHistory } from "./components/OcrHistory";
import {
  ScanText,
  LogOut,
  AlertCircle,
  Globe,
  Clock,
  Sparkles,
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
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const workerRef = useRef<Tesseract.Worker | null>(null);

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
      // Create worker with no Web Worker - runs in main thread
      const worker = await Tesseract.createWorker(language, 1, {
        workerPath: "",
        workerBlobURL: false,
        corePath:
          "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js",
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      workerRef.current = worker;

      const { data } = await worker.recognize(selectedFile);

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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/8 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <header className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
                <ScanText className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                OCR Extractor
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 rounded-md border border-teal-500/30">
                  <Sparkles className="w-3 h-3 inline" />
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Extract text from images
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">
                    Upload Image
                  </h2>
                  <span className="text-xs text-slate-500">
                    PNG, JPG up to 10MB
                  </span>
                </div>
                <ImageUploader
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                />

                <div className="mt-4">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
                    <Globe className="w-4 h-4 text-teal-400" />
                    OCR Language
                  </label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all appearance-none cursor-pointer hover:bg-slate-800/70"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={handleExtract}
                  disabled={!selectedFile || isProcessing}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Extracting Text... {progress}%
                    </>
                  ) : (
                    <>
                      <ScanText className="w-5 h-5" />
                      Extract Text
                    </>
                  )}
                </button>

                {isProcessing && (
                  <div className="mt-4 relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-cyan-500/20" />
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300 ease-out relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-teal-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="relative group">
                <div className="absolute inset-0 bg-red-500/5 rounded-2xl blur-xl" />
                <div className="relative flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-300">
                      Extraction Failed
                    </p>
                    <p className="text-sm text-red-400/80 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <ResultDisplay
                    text={result.text}
                    confidence={result.confidence}
                    language={result.language}
                    imageName={result.imageName}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-4 sticky top-24">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  History
                </h2>
                <OcrHistory
                  userId={user.id}
                  onSelect={handleHistorySelect}
                  refreshTrigger={historyRefresh}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
