import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import {
  executePatientUploadPipeline,
  UploadProgressInfo,
} from '../../lib/uploadService';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';

interface PatientUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onUploadSuccess: () => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const PatientUploadModal: React.FC<PatientUploadModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onUploadSuccess,
}) => {
  const [documentType, setDocumentType] = useState<
    'prescription' | 'lab_report' | 'imaging_report' | 'discharge_summary' | 'external_doc'
  >('external_doc');

  // Single source of truth for pending file selection
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Pipeline execution state — strictly 'idle' before Confirm & Upload is clicked
  const [stepStatus, setStepStatus] = useState<
    'idle' | 'uploading' | 'ocr' | 'ai' | 'saving' | 'completed' | 'failed'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setStepStatus('idle');
      setStatusMessage('');
      setUploadProgress(0);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      let validationErr: string | null = null;

      filesArray.forEach((f) => {
        if (!ALLOWED_TYPES.includes(f.type) && !f.name.endsWith('.pdf')) {
          validationErr = `Unsupported file format for ${f.name}. Please select JPG, PNG, or PDF files.`;
        } else if (f.size > MAX_FILE_SIZE_BYTES) {
          validationErr = `File ${f.name} exceeds maximum allowed size of 10MB.`;
        } else {
          validFiles.push(f);
        }
      });

      if (validationErr) {
        setErrorMessage(validationErr);
      } else {
        setErrorMessage(null);
      }

      // Append newly selected valid files to pending list WITHOUT triggering any upload or animation
      setSelectedFiles((prev) => {
        // Filter out exact duplicate file names if re-selected
        const existingNames = new Set(prev.map((pf) => pf.name));
        const nonDuplicates = validFiles.filter((vf) => !existingNames.has(vf.name));
        return [...prev, ...nonDuplicates];
      });

      // Clear the input value so selecting the same file again triggers onChange
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // IF REMOVING THE FILE RESULTS IN 0 PENDING FILES:
      // Instantly purge all upload states, progress bars, messages, and spinners!
      if (updated.length === 0) {
        setStepStatus('idle');
        setStatusMessage('');
        setUploadProgress(0);
        setErrorMessage(null);
      }
      return updated;
    });
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setStepStatus('idle');
    setStatusMessage('');
    setUploadProgress(0);
    setErrorMessage(null);
  };

  const handleConfirmAndUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select at least one document file before uploading.');
      return;
    }

    setErrorMessage(null);
    setStepStatus('uploading');
    setUploadProgress(0);
    setStatusMessage(`Preparing real-time upload for ${selectedFiles.length} file(s)...`);

    try {
      await executePatientUploadPipeline({
        patientId,
        files: selectedFiles,
        documentType,
        onProgress: (info: UploadProgressInfo) => {
          setStepStatus(info.step);
          setStatusMessage(info.message);
          setUploadProgress(info.percent);
          if (info.error) {
            setErrorMessage(info.error);
          }
        },
      });

      onUploadSuccess();
      // On success, reset state and close modal after short delay
      setTimeout(() => {
        setSelectedFiles([]);
        setStepStatus('idle');
        setStatusMessage('');
        setUploadProgress(0);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('[PatientUploadModal] Upload execution error:', err);
      setStepStatus('failed');
      setErrorMessage(err.message || 'Could not complete document upload. Please try again.');
    }
  };

  const isWorking = stepStatus === 'uploading' || stepStatus === 'ocr' || stepStatus === 'ai' || stepStatus === 'saving';

  const docTypeOptions = [
    { value: 'external_doc', label: 'External / Diagnostic Report' },
    { value: 'prescription', label: 'Past Clinical Prescription' },
    { value: 'lab_report', label: 'Laboratory Diagnostic Test' },
    { value: 'imaging_report', label: 'Radiology / X-Ray / Scan' },
    { value: 'discharge_summary', label: 'Hospital Discharge Summary' },
  ];

  return (
    <Dialog isOpen={isOpen} onClose={isWorking ? () => {} : onClose} title="Upload Personal Medical Records" maxWidth="lg">
      <div className="space-y-4 text-xs font-sans text-slate-800">
        <p className="text-slate-500">
          Add past prescriptions, lab test reports, or diagnostic scans from external facilities directly to your personal health passport.
        </p>

        {/* Category Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Document Category:</label>
          <Select
            options={docTypeOptions}
            value={documentType}
            onChange={(v) => setDocumentType(v as any)}
            disabled={isWorking}
          />
        </div>

        {/* File Selection Dropzone (NO UPLOADING STARTS ON SELECT) */}
        <div className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/30 rounded-xl p-5 text-center transition-colors">
          <input
            type="file"
            id="patient-file-upload-input"
            accept="image/*,.pdf"
            multiple
            disabled={isWorking}
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="patient-file-upload-input" className={`block space-y-2 ${isWorking ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-800">
              Click to browse files (PDF, JPG, PNG)
            </div>
            <p className="text-[11px] text-slate-500">Select single or multiple records up to 10MB each</p>
          </label>
        </div>

        {/* Pre-upload Selected Files List with Individual X Remove Button */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                Selected Files Pending Upload ({selectedFiles.length}):
              </span>
              {!isWorking && (
                <button
                  type="button"
                  onClick={handleClearAllFiles}
                  className="text-[11px] text-slate-400 hover:text-red-600 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  {!isWorking && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
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

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {stepStatus === 'failed' && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-red-300 text-red-700 hover:bg-red-100 shrink-0"
                onClick={handleConfirmAndUpload}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Upload
              </Button>
            )}
          </div>
        )}

        {/* REAL Upload & Processing Progress Bar (Appears ONLY AFTER clicking Confirm & Upload) */}
        {isWorking && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg space-y-2">
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

        {/* Success Banner */}
        {stepStatus === 'completed' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isWorking}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleConfirmAndUpload}
            disabled={selectedFiles.length === 0 || isWorking}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            <span>Confirm & Upload Record</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
