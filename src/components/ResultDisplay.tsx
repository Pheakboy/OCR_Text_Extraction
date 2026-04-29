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
      ? "text-emerald-400"
      : confidence >= 50
        ? "text-amber-400"
        : "text-red-400";

  const confidenceBg =
    confidence >= 80
      ? "bg-emerald-500/10 border-emerald-500/20"
      : confidence >= 50
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-red-500/10 border-red-500/20";

  const confidenceDot =
    confidence >= 80
      ? "bg-emerald-500"
      : confidence >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                <FileText className="w-4 h-4 text-teal-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Extracted Text
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </h3>
              <p className="text-xs text-slate-500">{imageName}</p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
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
            <BarChart3 className="w-3.5 h-3.5" />
            <span className={confidenceColor}>{confidence}% confidence</span>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-slate-600/50 text-xs text-slate-300 font-medium uppercase tracking-wide">
            {language}
          </span>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-4 max-h-80 overflow-y-auto border border-slate-800/50">
          <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
