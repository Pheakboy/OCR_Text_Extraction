import { useState } from "react";
import { Copy, Check, FileText, BarChart3, Sparkles, Download, FileSpreadsheet, Sheet } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

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
  const [downloading, setDownloading] = useState<"word" | "excel" | "pdf" | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download as Word ──────────────────────────────────────────────────────
  const downloadWord = async () => {
    setDownloading("word");
    try {
      const baseName = imageName.replace(/\.[^/.]+$/, "");
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [new TextRun({ text: "OCR Extracted Text", bold: true })],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Source: ${imageName}`, italics: true, color: "6B7280" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Language: ${language.toUpperCase()}   Confidence: ${confidence}%`,
                    italics: true,
                    color: "6B7280",
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: "" })] }),
              ...text.split("\n").map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun({ text: line || " " })],
                  })
              ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}_ocr.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  // ── Download as Excel ─────────────────────────────────────────────────────
  const downloadExcel = () => {
    setDownloading("excel");
    try {
      const baseName = imageName.replace(/\.[^/.]+$/, "");
      const rows = [
        ["OCR Extracted Text"],
        [`Source: ${imageName}`],
        [`Language: ${language.toUpperCase()}`, `Confidence: ${confidence}%`],
        [],
        ...text.split("\n").map((line) => [line]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Column width
      ws["!cols"] = [{ wch: 100 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "OCR Result");
      XLSX.writeFile(wb, `${baseName}_ocr.xlsx`);
    } finally {
      setDownloading(null);
    }
  };

  // ── Download as PDF ───────────────────────────────────────────────────────
  const downloadPdf = () => {
    setDownloading("pdf");
    try {
      const baseName = imageName.replace(/\.[^/.]+$/, "");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 50;
      const maxWidth = pageWidth - margin * 2;

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(15, 118, 110); // teal-600
      pdf.text("OCR Extracted Text", margin, 60);

      // Meta
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // gray-500
      pdf.text(`Source: ${imageName}`, margin, 82);
      pdf.text(
        `Language: ${language.toUpperCase()}   |   Confidence: ${confidence}%`,
        margin,
        96
      );

      // Divider
      pdf.setDrawColor(209, 250, 229); // emerald-100
      pdf.setLineWidth(1);
      pdf.line(margin, 108, pageWidth - margin, 108);

      // Body text
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59); // slate-800

      const lines = pdf.splitTextToSize(text, maxWidth);
      let y = 126;
      const lineHeight = 16;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const bottomMargin = 50;

      for (const line of lines) {
        if (y + lineHeight > pageHeight - bottomMargin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += lineHeight;
      }

      pdf.save(`${baseName}_ocr.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  // ── Confidence styles ─────────────────────────────────────────────────────
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

  const btnBase =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border shadow-sm dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="bg-white/60 dark:bg-slate-900/55 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/70 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
      {/* ── Header ── */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left – title */}
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

          {/* Right – action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className={`${btnBase} bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700/60`}
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

            {/* Word */}
            <button
              id="download-word-btn"
              onClick={downloadWord}
              disabled={downloading !== null}
              title="Download as Word (.docx)"
              className={`${btnBase} bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30`}
            >
              {downloading === "word" ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-400/40 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Word
            </button>

            {/* Excel */}
            <button
              id="download-excel-btn"
              onClick={downloadExcel}
              disabled={downloading !== null}
              title="Download as Excel (.xlsx)"
              className={`${btnBase} bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30`}
            >
              {downloading === "excel" ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-400/40 border-t-emerald-500 rounded-full animate-spin" />
              ) : (
                <Sheet className="w-3.5 h-3.5" />
              )}
              Excel
            </button>

            {/* PDF */}
            <button
              id="download-pdf-btn"
              onClick={downloadPdf}
              disabled={downloading !== null}
              title="Download as PDF (.pdf)"
              className={`${btnBase} bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30`}
            >
              {downloading === "pdf" ? (
                <div className="w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-500 rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
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

        {/* Download hint */}
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 text-center">
          ↑ Download your extracted text as Word, Excel, or PDF using the buttons above
        </p>
      </div>
    </div>
  );
}
