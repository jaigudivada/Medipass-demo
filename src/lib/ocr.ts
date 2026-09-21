import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  status: 'completed' | 'failed' | 'empty';
  error?: string;
}

export async function processDocumentOcr(
  imageSource: File | string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<OcrResult> {
  try {
    const result = await Tesseract.recognize(
      imageSource,
      'eng',
      {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            onProgress(Math.round(m.progress * 100), `Extracting document text (${Math.round(m.progress * 100)}%)`);
          } else if (onProgress) {
            onProgress(20, m.status);
          }
        }
      }
    );

    const text = result?.data?.text ? result.data.text.trim() : '';
    if (text.length > 0) {
      return { text, status: 'completed' };
    }
    return { text: '', status: 'empty' };
  } catch (err: any) {
    console.warn("Tesseract OCR processing notice (original document remains preserved):", err);
    return { text: '', status: 'failed', error: err?.message || 'OCR processing skipped' };
  }
}
