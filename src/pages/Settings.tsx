import { useState, useRef } from 'react';
import { toLocalDateString } from '../engine/date-utils';
import {
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Shield,
} from 'lucide-react';
import { exportData, importData, getAllProgress, getStats } from '../engine/storage';

export function Settings() {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allProgress = getAllProgress();
  const stats = getStats();
  const problemCount = Object.keys(allProgress).length;
  const totalReviews = stats.totalReviews;

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repcode-backup-${toLocalDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (!parsed.progress && !parsed.stats) {
          setImportStatus('error');
          setImportMessage('Invalid backup file — missing progress or stats data.');
          return;
        }
        const success = importData(content);
        if (success) {
          setImportStatus('success');
          const importedCount = parsed.progress
            ? Object.keys(parsed.progress).length
            : 0;
          setImportMessage(
            `Imported data for ${importedCount} problem${importedCount !== 1 ? 's' : ''}. Refresh to see updated data.`
          );
        } else {
          setImportStatus('error');
          setImportMessage('Failed to import data. The file may be corrupted.');
        }
      } catch {
        setImportStatus('error');
        setImportMessage('Invalid JSON file.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
  };

  const handleReset = () => {
    localStorage.removeItem('repcode_progress');
    localStorage.removeItem('repcode_stats');
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Data Overview */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-blue-400" />
          Your Data
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          All data is stored locally in your browser. Export regularly to avoid data loss.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
            <p className="text-xs text-gray-500">Problems Tracked</p>
            <p className="text-xl font-bold text-gray-200">{problemCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
            <p className="text-xs text-gray-500">Total Reviews</p>
            <p className="text-xl font-bold text-gray-200">{totalReviews}</p>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Download size={18} className="text-green-400" />
          Export Data
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Download a JSON backup of all your progress, review history, and stats.
        </p>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <FileJson size={16} />
          Export Backup
        </button>
      </div>

      {/* Import */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Upload size={18} className="text-blue-400" />
          Import Data
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Restore from a previously exported backup. This will overwrite your current data.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button onClick={handleImportClick} className="btn-secondary flex items-center gap-2">
          <Upload size={16} />
          Import from File
        </button>

        {importStatus !== 'idle' && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
              importStatus === 'success'
                ? 'bg-green-950 border border-green-800 text-green-400'
                : 'bg-red-950 border border-red-800 text-red-400'
            }`}
          >
            {importStatus === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            )}
            <p className="text-sm">{importMessage}</p>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card border-red-900/50">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-400">
          <Trash2 size={18} />
          Reset All Data
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Permanently delete all progress, review history, and stats. This cannot be undone.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-800 text-red-400 hover:bg-red-950 transition-colors"
          >
            Reset All Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-red-400 text-sm">Are you sure? This deletes everything.</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              Yes, Delete Everything
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
