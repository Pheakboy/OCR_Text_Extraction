import { useState } from "react";
import { Copy, Check, FileText, BarChart3, Sparkles } from "lucide-react";

interface ResultDisplayProps {
  text: string;
  confidence: number;
  language: string;
  imageName: string;
}

export function ResultDisplay({
  text,
  confidence,
  language,
  imageName,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor =
    confidence >= 80
      ? "text-emerald-700 dark:text-emerald-400"
      : confidence >= 50
        ? "text-amber-700 dark:text-amber-400"
        : "text-red-700 dark:text-red-400";

  const confidenceBg =
    confidence >= 80
      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
      : confidence >= 50
        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
        : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";

  const confidenceDot =
    confidence >= 80
      ? "bg-emerald-500"
      : confidence >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="bg-white/60 dark:bg-slate-900/55 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/70 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/20 border border-teal-100 dark:border-teal-500/25">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-300" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-500 dark:bg-teal-400 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                Extracted Text
                <Sparkles className="w-3 h-3 text-teal-500 dark:text-teal-400" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{imageName}</p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 shadow-sm dark:shadow-none"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${confidenceBg}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${confidenceDot}`} />
            <BarChart3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className={confidenceColor}>{confidence}% confidence</span>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 font-medium uppercase tracking-wide">
            {language}
          </span>
        </div>

        <div className="bg-white/50 dark:bg-slate-950/50 rounded-xl p-4 max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800/70 shadow-inner dark:shadow-none">
          <pre className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
