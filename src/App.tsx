import { useState, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { OcrHistory } from './components/OcrHistory';
import { ScanText, LogOut, AlertCircle, Globe, Clock } from 'lucide-react';

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'ita', label: 'Italian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'kor', label: 'Korean' },
  { code: 'ara', label: 'Arabic' },
  { code: 'hin', label: 'Hindi' },
  { code: 'rus', label: 'Russian' },
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
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('eng');
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError('');
  }, []);

  const saveResult = async (text: string, confidence: number, lang: string, imageName: string) => {
    if (!user) return;
    try {
      await supabase.from('ocr_results').insert({
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
    setError('');
    setResult(null);
    setProgress(0);

    try {
      // Create worker with no Web Worker - runs in main thread
      const worker = await Tesseract.createWorker(language, 1, {
        workerPath: '',
        workerBlobURL: false,
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js',
        logger: (m) => {
          if (m.status === 'recognizing text') {
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
        setError('No text could be extracted from the image. Try a clearer image with visible text.');
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
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });

        const extractedText = data.text.trim();
        const confidence = Math.round(data.confidence);

        if (!extractedText) {
          setError('No text could be extracted from the image. Try a clearer image with visible text.');
          return;
        }

        setResult({
          text: extractedText,
          confidence,
          language,
          imageName: selectedFile.name,
        });

        await saveResult(extractedText, confidence, language, selectedFile.name);
      } catch (innerErr) {
        setError(innerErr instanceof Error ? innerErr.message : 'An unexpected error occurred during OCR processing');
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
    setError('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10">
              <ScanText className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">OCR Extractor</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Extract text from images</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">{user.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-base font-semibold text-white mb-4">Upload Image</h2>
              <ImageUploader onFileSelect={handleFileSelect} isProcessing={isProcessing} />

              <div className="mt-4">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  OCR Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExtract}
                disabled={!selectedFile || isProcessing}
                className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">Extraction Failed</p>
                  <p className="text-sm text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <ResultDisplay
                text={result.text}
                confidence={result.confidence}
                language={result.language}
                imageName={result.imageName}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 sticky top-24">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
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
      </main>
    </div>
  );
}

export default App;
