import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';

/**
 * Developer utility component to export localStorage data
 * Add this component temporarily to your app to export current data
 */
export function LocalStorageExporter() {
  const [exported, setExported] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    try {
      const products = localStorage.getItem('timeline_view_products');
      const holidays = localStorage.getItem('timeline_view_holidays');
      const teamMembers = localStorage.getItem('timeline_view_team_members');

      const data = {
        products: products ? JSON.parse(products) : null,
        holidays: holidays ? JSON.parse(holidays) : null,
        teamMembers: teamMembers ? JSON.parse(teamMembers) : null,
        exportedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(data, null, 2);
      setExported(jsonString);
    } catch (error) {
      console.error('Failed to export localStorage data:', error);
      setExported(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-view-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border-2 border-primary rounded-lg shadow-xl p-4 max-w-md">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          🔧 Developer: Export localStorage
        </h3>
        <p className="text-xs text-muted-foreground">
          Export current data to update mockData.ts
        </p>
      </div>

      <button
        onClick={handleExport}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary-hover transition-colors mb-3"
      >
        <Download className="w-4 h-4" />
        Export Data
      </button>

      {exported && (
        <>
          <div className="mb-3 p-3 bg-muted rounded border border-border max-h-48 overflow-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {exported.substring(0, 500)}
              {exported.length > 500 && '...\n\n(truncated for display)'}
            </pre>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground font-medium rounded hover:bg-accent transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground font-medium rounded hover:bg-accent transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </>
      )}
    </div>
  );
}
