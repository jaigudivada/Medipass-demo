import React, { useState } from 'react';
import { FileSummaryItem, MedicationGuidance } from '../../lib/aiExplainer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FileText, Download, Sparkles, ZoomIn, ZoomOut, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export interface EmbeddedDocumentViewerProps {
  primaryUrl: string;
  attachments?: Array<{ url: string; name: string; type?: string }>;
  aiExplanation?: {
    summary?: string;
    fileSummaries?: FileSummaryItem[];
    keyFindings?: string[];
    medicationGuidance?: MedicationGuidance[];
    warnings?: string[];
    confidence?: number;
  } | null;
  hospitalName?: string;
  docTypeLabel?: string;
}

export const EmbeddedDocumentViewer: React.FC<EmbeddedDocumentViewerProps> = ({
  primaryUrl,
  attachments = [],
  aiExplanation,
  hospitalName,
  docTypeLabel,
}) => {
  // Build unified files list
  const fileList = attachments && attachments.length > 0
    ? attachments
    : [{ url: primaryUrl, name: 'Primary Document Scan', type: 'image/jpeg' }];

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);

  const activeFile = fileList[activeIndex] || fileList[0];
  const isPdf = activeFile.name?.toLowerCase().endsWith('.pdf') || activeFile.url?.toLowerCase().includes('.pdf');

  // Match corresponding fileSummary item if available
  const fileSummaries = aiExplanation?.fileSummaries || [];
  const currentFileSummary = fileSummaries.find(
    (f) => f.fileIndex === activeIndex + 1 || f.sourceUrl === activeFile.url
  ) || (fileSummaries.length === 1 ? fileSummaries[0] : null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75));

  return (
    <div className="space-y-4 text-xs font-sans text-slate-800">

      {/* Multi-File Tab Selector (if multiple files attached) */}
      {fileList.length > 1 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Attached Documents / Pages ({fileList.length}):</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click tab to switch file</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {fileList.map((f, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setZoomLevel(100);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>File {idx + 1}: {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded Document Viewport */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 space-y-0">
        
        {/* Viewport Toolbar */}
        <div className="bg-slate-800/90 px-3 py-2 flex items-center justify-between text-slate-300 border-b border-slate-700/50">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-xs text-white truncate">
              {fileList.length > 1 ? `File ${activeIndex + 1} of ${fileList.length}: ${activeFile.name}` : activeFile.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isPdf && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 75}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 w-9 text-center">{zoomLevel}%</span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <a
              href={activeFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* Document Display Area */}
        <div className="p-3 flex items-center justify-center min-h-[300px] max-h-[480px] overflow-auto bg-slate-950/80">
          {isPdf ? (
            <iframe
              src={activeFile.url}
              title={activeFile.name}
              className="w-full h-[400px] rounded border border-slate-800 bg-white"
            />
          ) : (
            <img
              src={activeFile.url}
              alt={activeFile.name}
              style={{ width: `${zoomLevel}%`, maxWidth: zoomLevel === 100 ? '100%' : 'none' }}
              className="rounded object-contain transition-all duration-150 mx-auto shadow-lg"
            />
          )}
        </div>

        {/* Carousel Navigation Footer if multiple files */}
        {fileList.length > 1 && (
          <div className="bg-slate-800/80 px-3 py-1.5 flex items-center justify-between text-slate-400 text-[11px]">
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="flex items-center gap-1 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Previous File
            </button>
            <span>Page/File {activeIndex + 1} of {fileList.length}</span>
            <button
              onClick={() => setActiveIndex((prev) => Math.min(fileList.length - 1, prev + 1))}
              disabled={activeIndex === fileList.length - 1}
              className="flex items-center gap-1 hover:text-white disabled:opacity-30"
            >
              Next File <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Page-Wise AI Summary Block */}
      {aiExplanation && (
        <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>
                {fileList.length > 1
                  ? `File ${activeIndex + 1} Summary & Patient Guidance (MediPass AI)`
                  : 'Clinical Summary & Patient Guidance (MediPass AI)'}
              </span>
            </h4>
            {aiExplanation.confidence ? (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                {aiExplanation.confidence}% Confidence
              </Badge>
            ) : null}
          </div>

          {/* Active File / Page Specific Summary */}
          {currentFileSummary ? (
            <div className="space-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-xs">
                  {currentFileSummary.fileName}:
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-md border border-slate-200">
                {currentFileSummary.summary}
              </p>

              {currentFileSummary.keyFindings && currentFileSummary.keyFindings.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-slate-800 text-[11px]">Findings in this file:</span>
                  <ul className="pl-4 list-disc space-y-0.5 text-slate-700">
                    {currentFileSummary.keyFindings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Fallback Overall Summary */
            <div className="space-y-1">
              <h5 className="font-bold text-slate-800 text-xs">Summary:</h5>
              <p className="text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                {aiExplanation.summary || 'Clinical record preserved in health passport.'}
              </p>
            </div>
          )}

          {/* Key Clinical Findings (Aggregated) */}
          {aiExplanation.keyFindings && aiExplanation.keyFindings.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <h5 className="font-bold text-slate-800 text-xs">All Key Findings & Measurements:</h5>
              <ul className="space-y-1 pl-4 list-disc text-slate-700">
                {aiExplanation.keyFindings.map((finding: string, idx: number) => (
                  <li key={idx}>{finding}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Prescribed Medications */}
          {aiExplanation.medicationGuidance && aiExplanation.medicationGuidance.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <h5 className="font-bold text-slate-800 text-xs">Prescribed Medication Guidance:</h5>
              <ul className="space-y-1 pl-4 list-disc text-slate-700">
                {aiExplanation.medicationGuidance.map((med: any, idx: number) => (
                  <li key={idx}>
                    <strong>{med.name}:</strong> {med.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Precautions / Warnings */}
          {aiExplanation.warnings && aiExplanation.warnings.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <h5 className="font-bold text-amber-900 text-xs">Precautions & Advice:</h5>
              <ul className="space-y-1 pl-4 list-disc text-amber-800">
                {aiExplanation.warnings.map((warn: string, idx: number) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* MANDATORY MEDICAL AI DISCLAIMER NOTICE */}
      <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-3 rounded-xl flex items-start gap-2 text-[11px] leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Medical AI Notice:</span>
          <span>
            AI can make mistakes. Please verify important medical details with your healthcare provider and double-check against the original document scans above.
          </span>
        </div>
      </div>

    </div>
  );
};
