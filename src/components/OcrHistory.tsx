import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Trash2, FileText } from 'lucide-react';

interface OcrRecord {
  id: string;
  image_name: string;
  extracted_text: string;
  language: string;
  confidence: number;
  created_at: string;
}

interface OcrHistoryProps {
  userId: string;
  onSelect: (record: OcrRecord) => void;
  refreshTrigger: number;
}

export function OcrHistory({ userId, onSelect, refreshTrigger }: OcrHistoryProps) {
  const [records, setRecords] = useState<OcrRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ocr_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setRecords(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [userId, refreshTrigger]);

  const handleDelete = async (id: string) => {
    await supabase.from('ocr_results').delete().eq('id', id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No extraction history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div
          key={record.id}
          className="group flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer"
          onClick={() => onSelect(record)}
        >
          <div className="p-1.5 rounded-lg bg-slate-800 mt-0.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{record.image_name}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{record.extracted_text}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-600">{formatDate(record.created_at)}</span>
              <span className="text-xs text-slate-600">{Math.round(record.confidence)}%</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
