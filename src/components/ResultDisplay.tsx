import { useState } from 'react';
import { Copy, Check, FileText, BarChart3 } from 'lucide-react';

interface ResultDisplayProps {
  text: string;
  confidence: number;
  language: string;
  imageName: string;
}

export function ResultDisplay({ text, confidence, language, imageName }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor = confidence >= 80
    ? 'text-emerald-400'
    : confidence >= 50
      ? 'text-amber-400'
      : 'text-red-400';

  const confidenceBg = confidence >= 80
    ? 'bg-emerald-500/10 border-emerald-500/20'
    : confidence >= 50
      ? 'bg-amber-500/10 border-amber-500/20'
      : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10">
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Extracted Text</h3>
              <p className="text-xs text-slate-500">{imageName}</p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
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
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${confidenceBg}`}>
            <BarChart3 className="w-3.5 h-3.5" />
            <span className={confidenceColor}>{confidence}% confidence</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 font-medium uppercase">
            {language}
          </span>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 max-h-80 overflow-y-auto border border-slate-800/50">
          <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
