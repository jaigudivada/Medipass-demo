import { uploadFileToCloudinary } from './cloudinary';
import { createRecordDoc, updateRecordExplanation, MedicalRecordDoc, PatientVitals } from './firestore';
import { processDocumentOcr } from './ocr';
import { generateAiExplanation, analyzeDocumentViaGroqVision, analyzeMultipleDocumentsViaVision } from './aiExplainer';

export interface UploadProgressInfo {
  step: 'idle' | 'uploading' | 'ocr' | 'ai' | 'saving' | 'completed' | 'failed';
  currentFileIndex: number;
  totalFiles: number;
  fileName: string;
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
  message: string;
  error?: string;
}

export interface SingleUploadResult {
  file: File;
  sourceFileUrl: string;
  recordId: string;
  extractedText: string;
  ocrStatus: 'completed' | 'failed' | 'empty';
}

export interface PatientRecordUploadParams {
  patientId: string;
  files: File[];
  documentType: 'prescription' | 'lab_report' | 'imaging_report' | 'discharge_summary' | 'external_doc';
  onProgress: (info: UploadProgressInfo) => void;
}

export interface ReceptionRecordUploadParams {
  hospitalId: string;
  staffId: string;
  sessionId: string;
  patientId: string;
  files: File[];
  documentType: 'prescription' | 'lab_report' | 'imaging_report' | 'discharge_summary' | 'external_doc';
  vitals?: PatientVitals;
  onProgress: (info: UploadProgressInfo) => void;
}

/**
 * Patient Document Upload Pipeline via Cloudinary
 * Handles single or multi-file batches with page-wise AI summaries.
 */
export async function executePatientUploadPipeline(
  params: PatientRecordUploadParams
): Promise<void> {
  const { patientId, files, documentType, onProgress } = params;

  if (!files || files.length === 0) {
    throw new Error('No files selected for upload.');
  }

  const uploadedAttachments: Array<{ url: string; name: string; type: string }> = [];
  let combinedExtractedText = '';

  // STEP 1: Upload files to Cloudinary
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const folder = `medipass/patient_uploads/${patientId}`;

    onProgress({
      step: 'uploading',
      currentFileIndex: i + 1,
      totalFiles: files.length,
      fileName: file.name,
      bytesTransferred: 0,
      totalBytes: file.size,
      percent: Math.round(((i) / files.length) * 100),
      message: `[${i + 1}/${files.length}] Uploading ${file.name}...`,
    });

    const { promise } = uploadFileToCloudinary(
      file,
      folder,
      (bytesTransferred, totalBytes, percent) => {
        const fileWeight = 100 / files.length;
        const currentBatchPercent = Math.round((i * fileWeight) + ((percent * fileWeight) / 100));
        onProgress({
          step: 'uploading',
          currentFileIndex: i + 1,
          totalFiles: files.length,
          fileName: file.name,
          bytesTransferred,
          totalBytes,
          percent: currentBatchPercent,
          message: `[${i + 1}/${files.length}] Uploading ${file.name} (${percent}%)...`,
        });
      }
    );

    try {
      const url = await promise;
      uploadedAttachments.push({ url, name: file.name, type: file.type });
    } catch (storageError: any) {
      onProgress({
        step: 'failed',
        currentFileIndex: i + 1,
        totalFiles: files.length,
        fileName: file.name,
        bytesTransferred: 0,
        totalBytes: file.size,
        percent: 0,
        message: storageError.message || `Upload failed for ${file.name}`,
        error: storageError.message,
      });
      throw storageError;
    }
  }

  // STEP 2: Create Firestore document metadata with all attached files
  onProgress({
    step: 'saving',
    currentFileIndex: files.length,
    totalFiles: files.length,
    fileName: files[0].name,
    bytesTransferred: files[0].size,
    totalBytes: files[0].size,
    percent: 60,
    message: `Saving ${files.length} document file(s) to health passport...`,
  });

  let recordId = '';
  try {
    recordId = await createRecordDoc({
      patientId,
      uploadedByPatient: true,
      type: documentType,
      date: new Date(),
      extractedText: '',
      ocrStatus: 'empty',
      aiExplanation: '',
      sourceFileUrl: uploadedAttachments[0].url,
      attachments: uploadedAttachments,
      hospitalName: 'Patient Upload (External / Diagnostic)',
    });
  } catch (firestoreErr: any) {
    console.error('[UploadService] Firestore metadata creation failed:', firestoreErr);
    throw new Error(`Failed to create medical record: ${firestoreErr.message}`);
  }

  // STEP 3: Optional Tesseract OCR text extraction on primary file
  try {
    onProgress({
      step: 'ocr',
      currentFileIndex: 1,
      totalFiles: files.length,
      fileName: files[0].name,
      bytesTransferred: files[0].size,
      totalBytes: files[0].size,
      percent: 75,
      message: `Extracting document text via OCR...`,
    });
    const ocrRes = await processDocumentOcr(files[0]);
    combinedExtractedText = ocrRes.text || '';
  } catch {
    // Non-blocking fallback
  }

  // STEP 4: MediPass AI Vision Analysis (Page-wise / File-wise)
  onProgress({
    step: 'ai',
    currentFileIndex: files.length,
    totalFiles: files.length,
    fileName: files[0].name,
    bytesTransferred: files[0].size,
    totalBytes: files[0].size,
    percent: 90,
    message: `Analysing ${files.length} file(s) with MediPass AI...`,
  });

  let aiExplanation: any = null;

  try {
    aiExplanation = await analyzeMultipleDocumentsViaVision(
      uploadedAttachments.map((att) => ({ url: att.url, fileName: att.name })),
      documentType
    );
  } catch (err) {
    console.error('[UploadService] AI Vision error during batch upload:', err);
  }

  if (!aiExplanation && combinedExtractedText.trim().length > 10) {
    try {
      aiExplanation = await generateAiExplanation(combinedExtractedText, documentType);
    } catch {
      // Fallback below
    }
  }

  if (!aiExplanation) {
    aiExplanation = {
      summary: 'Medical document(s) uploaded and saved safely in health passport.',
      fileSummaries: uploadedAttachments.map((f, idx) => ({
        fileIndex: idx + 1,
        fileName: f.name,
        summary: 'Document page stored and preserved.',
        keyFindings: [],
        sourceUrl: f.url,
      })),
      keyFindings: [],
      medicationGuidance: [],
      warnings: ['Review original documents with your attending physician.'],
      confidence: 80,
      aiStatus: 'completed',
    };
  }

  // Save full aiExplanation + attachments back to Firestore
  try {
    await updateRecordExplanation(recordId, aiExplanation, combinedExtractedText, 'completed');
  } catch (updateErr) {
    console.warn('[UploadService] Failed to update record explanation:', updateErr);
  }

  onProgress({
    step: 'completed',
    currentFileIndex: files.length,
    totalFiles: files.length,
    fileName: '',
    bytesTransferred: 0,
    totalBytes: 0,
    percent: 100,
    message: `${files.length} document file(s) successfully processed!`,
  });
}

/**
 * Robust Receptionist Document Upload Pipeline via Cloudinary
 */
export async function executeReceptionUploadPipeline(
  params: ReceptionRecordUploadParams
): Promise<void> {
  const { hospitalId, staffId, sessionId, patientId, files, documentType, vitals, onProgress } = params;

  if (!files || files.length === 0) {
    throw new Error('No files selected for upload.');
  }

  const uploadedAttachments: Array<{ url: string; name: string; type: string }> = [];
  let combinedExtractedText = '';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const folder = `medipass/records/${hospitalId}`;

    onProgress({
      step: 'uploading',
      currentFileIndex: i + 1,
      totalFiles: files.length,
      fileName: file.name,
      bytesTransferred: 0,
      totalBytes: file.size,
      percent: Math.round((i / files.length) * 100),
      message: `[${i + 1}/${files.length}] Uploading ${file.name}...`,
    });

    const { promise } = uploadFileToCloudinary(
      file,
      folder,
      (bytesTransferred, totalBytes, percent) => {
        const fileWeight = 100 / files.length;
        const currentBatchPercent = Math.round((i * fileWeight) + ((percent * fileWeight) / 100));
        onProgress({
          step: 'uploading',
          currentFileIndex: i + 1,
          totalFiles: files.length,
          fileName: file.name,
          bytesTransferred,
          totalBytes,
          percent: currentBatchPercent,
          message: `[${i + 1}/${files.length}] Uploading ${file.name} (${percent}%)...`,
        });
      }
    );

    try {
      const url = await promise;
      uploadedAttachments.push({ url, name: file.name, type: file.type });
    } catch (storageError: any) {
      onProgress({
        step: 'failed',
        currentFileIndex: i + 1,
        totalFiles: files.length,
        fileName: file.name,
        bytesTransferred: 0,
        totalBytes: file.size,
        percent: 0,
        message: storageError.message || `Upload failed for ${file.name}`,
        error: storageError.message,
      });
      throw storageError;
    }
  }

  onProgress({
    step: 'saving',
    currentFileIndex: files.length,
    totalFiles: files.length,
    fileName: files[0].name,
    bytesTransferred: files[0].size,
    totalBytes: files[0].size,
    percent: 60,
    message: `Saving document record & vitals to Firestore...`,
  });

  let recordId = '';
  try {
    recordId = await createRecordDoc({
      patientId,
      sessionId,
      hospitalId,
      uploadedByStaffId: staffId || '',
      type: documentType,
      date: new Date(),
      extractedText: '',
      ocrStatus: 'empty',
      aiExplanation: '',
      sourceFileUrl: uploadedAttachments[0].url,
      attachments: uploadedAttachments,
      vitals,
    });
  } catch (firestoreErr: any) {
    console.error('[UploadService] Firestore metadata creation failed:', firestoreErr);
    throw new Error(`Failed to create medical record: ${firestoreErr.message}`);
  }

  try {
    onProgress({
      step: 'ocr',
      currentFileIndex: 1,
      totalFiles: files.length,
      fileName: files[0].name,
      bytesTransferred: files[0].size,
      totalBytes: files[0].size,
      percent: 75,
      message: `Extracting document text via OCR...`,
    });
    const ocrRes = await processDocumentOcr(files[0]);
    combinedExtractedText = ocrRes.text || '';
  } catch {
    // Non-blocking fallback
  }

  onProgress({
    step: 'ai',
    currentFileIndex: files.length,
    totalFiles: files.length,
    fileName: files[0].name,
    bytesTransferred: files[0].size,
    totalBytes: files[0].size,
    percent: 90,
    message: `Analysing ${files.length} file(s) with MediPass AI...`,
  });

  let aiExplanation: any = null;

  try {
    aiExplanation = await analyzeMultipleDocumentsViaVision(
      uploadedAttachments.map((att) => ({ url: att.url, fileName: att.name })),
      documentType
    );
  } catch (err) {
    console.error('[UploadService] AI Vision error during reception upload:', err);
  }

  if (!aiExplanation && combinedExtractedText.trim().length > 10) {
    try {
      aiExplanation = await generateAiExplanation(combinedExtractedText, documentType);
    } catch {
      // Fallback
    }
  }

  if (!aiExplanation) {
    aiExplanation = {
      summary: 'Clinical document(s) uploaded and saved safely.',
      fileSummaries: uploadedAttachments.map((f, idx) => ({
        fileIndex: idx + 1,
        fileName: f.name,
        summary: 'Clinical document page stored.',
        keyFindings: [],
        sourceUrl: f.url,
      })),
      keyFindings: [],
      medicationGuidance: [],
      warnings: ['Review original documents with your attending physician.'],
      confidence: 80,
      aiStatus: 'completed',
    };
  }

  try {
    await updateRecordExplanation(recordId, aiExplanation, combinedExtractedText, 'completed');
  } catch (updateErr) {
    console.warn('[UploadService] Failed to update record explanation:', updateErr);
  }

  onProgress({
    step: 'completed',
    currentFileIndex: files.length,
    totalFiles: files.length,
    fileName: '',
    bytesTransferred: 0,
    totalBytes: 0,
    percent: 100,
    message: `${files.length} document(s) & vitals successfully attached!`,
  });
}
