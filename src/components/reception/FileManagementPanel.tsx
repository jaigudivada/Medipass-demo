import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { VitalsForm } from './VitalsForm';
import {
  PatientVitals,
  Session,
  subscribeToHospitalSessions,
} from '../../lib/firestore';
import {
  executeReceptionUploadPipeline,
  UploadProgressInfo,
} from '../../lib/uploadService';
import { Upload, Camera, FileText, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';

interface FileManagementPanelProps {
  hospitalId: string;
  staffId: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const FileManagementPanel: React.FC<FileManagementPanelProps> = ({
  hospitalId,
  staffId,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const [documentType, setDocumentType] = useState<
    'prescription' | 'lab_report' | 'imaging_report' | 'discharge_summary'
  >('prescription');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [vitals, setVitals] = useState<PatientVitals>({});

  // Upload sequence status state
  const [stepStatus, setStepStatus] = useState<
    'idle' | 'uploading' | 'ocr' | 'ai' | 'saving' | 'completed' | 'failed'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hospitalId) return;
    const unsubscribe = subscribeToHospitalSessions(hospitalId, (list) => {
      setSessions(list);
      if (list.length > 0 && !selectedSessionId) {
        setSelectedSessionId(list[0].id);
      }
    });
    return () => unsubscribe();
  }, [hospitalId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      let sizeOrTypeErr: string | null = null;

      filesArray.forEach((f) => {
        if (!ALLOWED_TYPES.includes(f.type) && !f.name.endsWith('.pdf')) {
          sizeOrTypeErr = `File format not supported for ${f.name}. Please select JPG, PNG, or PDF files.`;
        } else if (f.size > MAX_FILE_SIZE_BYTES) {
          sizeOrTypeErr = `File ${f.name} exceeds maximum allowed size of 10MB.`;
        } else {
          validFiles.push(f);
        }
      });

      if (sizeOrTypeErr) {
        setErrorMessage(sizeOrTypeErr);
      } else {
        setErrorMessage(null);
      }

      setSelectedFiles((prev) => {
        const existingNames = new Set(prev.map((pf) => pf.name));
        const nonDuplicates = validFiles.filter((vf) => !existingNames.has(vf.name));
        return [...prev, ...nonDuplicates];
      });

      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setStepStatus('idle');
        setStatusMessage('');
        setUploadProgress(0);
        setErrorMessage(null);
      }
      return updated;
    });
  };

  const handleProcessAndUpload = async () => {
    if (!selectedSessionId) {
      setErrorMessage('Please select an active visit session.');
      return;
    }
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select or scan at least one document file first.');
      return;
    }

    const currentSession = sessions.find((s) => s.id === selectedSessionId);
    if (!currentSession) {
      setErrorMessage('Selected session not found.');
      return;
    }

    setErrorMessage(null);
    setStepStatus('uploading');
    setUploadProgress(0);
    setStatusMessage(`Preparing upload for ${selectedFiles.length} file(s)...`);

    try {
      await executeReceptionUploadPipeline({
        hospitalId,
        staffId,
        sessionId: currentSession.id,
        patientId: currentSession.patientId,
        files: selectedFiles,
        documentType,
        vitals,
        onProgress: (info: UploadProgressInfo) => {
          setStepStatus(info.step);
          setStatusMessage(info.message);
          setUploadProgress(info.percent);
          if (info.error) {
            setErrorMessage(info.error);
          }
        },
      });

      setStepStatus('completed');
      setStatusMessage(`${selectedFiles.length} document(s) & vitals successfully attached!`);
      setSelectedFiles([]);
      setVitals({});
    } catch (err: any) {
      console.error('[FileManagementPanel] Upload error:', err);
      setStepStatus('failed');
      setErrorMessage(err.message || 'Failed to process and attach medical record.');
    }
  };

  const isWorking = stepStatus === 'uploading' || stepStatus === 'ocr' || stepStatus === 'ai' || stepStatus === 'saving';

  const sessionOptions = sessions.map((s) => ({
    value: s.id,
    label: `${s.patientName} (${s.opNumber}) — ${s.doctorName}`,
  }));

  const docTypeOptions = [
    { value: 'prescription', label: 'Clinical Prescription' },
    { value: 'lab_report', label: 'Laboratory Diagnostic Report' },
    { value: 'imaging_report', label: 'Radiology / Imaging Scan' },
    { value: 'discharge_summary', label: 'Hospital Discharge Summary' },
  ];

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Upload & Scan Patient Medical Documents</span>
        </CardTitle>
        <CardDescription>
          Scan paper prescriptions or lab reports to run client-side OCR and attach vitals to the patient's record.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Target Patient Visit Session:
          </label>
          {sessionOptions.length > 0 ? (
            <Select
              options={sessionOptions}
              value={selectedSessionId}
              onChange={setSelectedSessionId}
              placeholder="Select active patient..."
              disabled={isWorking}
            />
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              No active checked-in patients. Please check in a patient first.
            </p>
          )}
        </div>

        {/* Document Type Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Document Category:</label>
          <Select
            options={docTypeOptions}
            value={documentType}
            onChange={(v) => setDocumentType(v as any)}
            disabled={isWorking}
          />
        </div>

        {/* File Picker & Camera Capture */}
        <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 rounded-xl p-4 text-center transition-colors">
          <input
            type="file"
            id="file-upload-reception"
            accept="image/*,.pdf"
            multiple
            disabled={isWorking}
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload-reception" className={`block space-y-2 ${isWorking ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-800">
              Click to select or scan document images / PDF
            </div>
            <p className="text-[11px] text-slate-500">Supports JPG, PNG, PDF up to 10MB per file</p>
          </label>
        </div>

        {/* Selected Files Pending Upload List with Individual X Remove Button */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 block">
                Files Pending Upload ({selectedFiles.length}):
              </span>
              {!isWorking && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFiles([]);
                    setStepStatus('idle');
                    setStatusMessage('');
                    setUploadProgress(0);
                    setErrorMessage(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-red-600 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {selectedFiles.map((f, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{f.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  {!isWorking && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors shrink-0"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vitals Form */}
        <VitalsForm vitals={vitals} onChange={setVitals} />

        {/* Error State */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {stepStatus === 'failed' && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-red-300 text-red-700 hover:bg-red-100 shrink-0"
                onClick={handleProcessAndUpload}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Upload
              </Button>
            )}
          </div>
        )}

        {/* Real Processing Progress Status */}
        {isWorking && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                <span>{statusMessage}</span>
              </div>
              <span className="text-xs text-blue-700 font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed Success Banner */}
        {stepStatus === 'completed' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-lg flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Process & Upload Button */}
        <Button
          type="button"
          variant="default"
          size="sm"
          className="w-full"
          disabled={selectedFiles.length === 0 || !selectedSessionId || isWorking}
          onClick={handleProcessAndUpload}
        >
          <FileText className="w-4 h-4 mr-1.5" />
          <span>Process OCR, AI & Save Record</span>
        </Button>
      </CardContent>
    </Card>
  );
};
