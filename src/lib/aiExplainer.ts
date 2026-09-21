import Groq from 'groq-sdk';
import { getRecordById, updateRecordExplanation } from './firestore';

export interface MedicationGuidance {
  name: string;
  explanation: string;
}

export interface FileSummaryItem {
  fileIndex: number;
  fileName: string;
  summary: string;
  keyFindings: string[];
  medicationGuidance?: MedicationGuidance[];
  warnings?: string[];
  sourceUrl?: string;
}

export interface AiExplanation {
  summary: string;
  fileSummaries?: FileSummaryItem[];
  keyFindings: string[];
  medicationGuidance: MedicationGuidance[];
  warnings: string[];
  confidence: number;
  aiStatus: 'completed' | 'failed' | 'skipped' | 'processing';
  modelUsed?: string;
  error?: string;
}

// Groq SDK — browser mode required for Vite
function getClient(): Groq {
  return new Groq({
    apiKey: (import.meta.env.VITE_GROQ_API_KEY || '').trim(),
    dangerouslyAllowBrowser: true,
  });
}

// Primary vision & text models (Groq)
const VISION_MODEL_PRIMARY   = 'qwen/qwen3.8-27b';
const VISION_MODEL_SECONDARY = 'llama-3.2-11b-vision-preview';
const TEXT_MODEL             = import.meta.env.VITE_GROQ_MODEL || 'qwen/qwen3.8-27b';

// ---------------------------------------------------------------------------
// JSON parser — strips markdown fences, extracts first JSON block
// ---------------------------------------------------------------------------
function parseJson(raw: string): AiExplanation | null {
  if (!raw || raw.trim().length < 5) return null;
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();
  const match = cleaned.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try {
    const p = JSON.parse(match[0]);
    if (!p.summary || typeof p.summary !== 'string') return null;
    return {
      summary: p.summary.trim(),
      keyFindings:        Array.isArray(p.keyFindings)        ? p.keyFindings.map(String)        : [],
      medicationGuidance: Array.isArray(p.medicationGuidance) ? p.medicationGuidance.map((m: any) => ({
        name:        String(m.name || ''),
        explanation: String(m.explanation || ''),
      })) : [],
      warnings:    Array.isArray(p.warnings)    ? p.warnings.map(String)    : [],
      confidence:  typeof p.confidence === 'number' ? p.confidence : 80,
      aiStatus:   'completed',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// JSON schema instruction — appended to every prompt
// ---------------------------------------------------------------------------
const SCHEMA = `
OUTPUT — return ONLY this JSON object, nothing else, no markdown, no preamble:
{
  "summary": "2-3 clear sentences explaining what this document says in plain English",
  "keyFindings": [
    "First specific finding, measurement or diagnosis from the document",
    "Second finding"
  ],
  "medicationGuidance": [
    { "name": "Medicine name and dose", "explanation": "When and how to take it" }
  ],
  "warnings": [
    "Follow-up instruction or precaution from the document"
  ],
  "confidence": 92
}`;

// ---------------------------------------------------------------------------
// VISION ANALYSIS — send image URL directly to Groq vision model
// Best for handwritten + mixed medical documents
// ---------------------------------------------------------------------------
export async function analyzeDocumentViaGroqVision(
  imageUrl: string,
  docCategory?: string
): Promise<AiExplanation | null> {
  const apiKey = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
  if (!apiKey || apiKey.length < 10) {
    console.error('[Vision] VITE_GROQ_API_KEY is missing or too short');
    return null;
  }
  let targetUrl = imageUrl;
  if (targetUrl.toLowerCase().endsWith('.pdf')) {
    targetUrl = targetUrl.replace(/\.pdf$/i, '.jpg');
  }

  const catLabel = docCategory ? docCategory.replace(/_/g, ' ').toUpperCase() : 'MEDICAL DOCUMENT';

  const prompt = `You are an expert medical AI assistant. Carefully read ALL text in this ${catLabel} image.

The image may contain:
- Printed hospital header (patient name, age, OP number, date, department)
- Handwritten clinical notes in English
- Medical abbreviations (OD = right eye, OS = left eye, IOP = eye pressure, NCTP = non-contact tonometer pressure, c/o = complaining of, h/o = history of, VA = visual acuity, UNAIDED = without glasses, AIDED = with glasses, BP = blood pressure, etc.)
- Test measurements and values
- Doctor observations

YOUR TASK:
1. Read ALL printed AND handwritten text visible in the image
2. List every finding, measurement, and clinical note you can see
3. Translate abbreviations into plain English
4. Write a patient-friendly 2-3 sentence summary of what the document says
5. Extract medication names, dosages and instructions if present
6. Note any follow-up advice or precautions mentioned

${SCHEMA}`;

  const client = getClient();

  // Try primary vision model first, then secondary
  for (const model of [VISION_MODEL_PRIMARY, VISION_MODEL_SECONDARY]) {
    try {
      console.log(`[Vision] Trying model: ${model} on URL: ${targetUrl.slice(0, 80)}`);
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: targetUrl } },
            ] as any,
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const raw = completion.choices[0]?.message?.content || '';
      console.log(`[Vision] ${model} responded (${raw.length} chars):`, raw.slice(0, 300));

      const result = parseJson(raw);
      if (result && result.summary.length > 15 && result.summary !== 'Medical document processed successfully.') {
        result.modelUsed = model;
        console.log('[Vision] SUCCESS. Summary:', result.summary.slice(0, 120));
        return result;
      }
      console.warn(`[Vision] ${model} returned unparseable or empty content. Trying next model.`);
    } catch (err: any) {
      console.error(`[Vision] ${model} error:`, err?.message || err);
    }
  }

  console.warn('[Vision] All vision models failed.');
  return null;
}

// ---------------------------------------------------------------------------
// TEXT ANALYSIS — analyse OCR text with llama-3.3-70b
// Only used when OCR extracted meaningful text (not garbage)
// ---------------------------------------------------------------------------
export async function generateAiExplanation(
  text: string,
  docCategory?: string
): Promise<AiExplanation> {
  const apiKey = (import.meta.env.VITE_GROQ_API_KEY || '').trim();

  // Guard: reject if OCR text is too short or obviously garbage
  const cleanText = text.replace(/[^a-zA-Z0-9\s.,:()/\-+%]/g, '').trim();
  if (!text || cleanText.length < 30) {
    return {
      summary: 'The document text could not be extracted clearly by OCR. Click "Run AI Analysis Now" to analyse the image directly with AI Vision.',
      keyFindings: [],
      medicationGuidance: [],
      warnings: ['Use the "Run AI Analysis Now" button to get a proper AI reading of this document.'],
      confidence: 0,
      aiStatus: 'skipped',
      error: 'OCR text insufficient — use Vision retry.',
    };
  }

  const catLabel = docCategory ? docCategory.replace(/_/g, ' ').toUpperCase() : 'MEDICAL DOCUMENT';

  const userPrompt = `You are an expert medical AI assistant reading a ${catLabel}.

OCR-EXTRACTED TEXT FROM DOCUMENT:
---
${text}
---

Some text may be garbled due to OCR limitations on handwriting. Use your medical knowledge to:
1. Interpret and clean up garbled medical text
2. Expand all abbreviations (OD, OS, IOP, c/o, h/o, VA, BP, NCTP etc.)
3. List every finding and measurement mentioned
4. Write a clear patient-friendly 2-3 sentence summary
5. Note any medications and instructions
6. Note any follow-up advice

${SCHEMA}`;

  if (!apiKey || apiKey.length < 10) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && /[a-zA-Z]/.test(l));
    return {
      summary: lines[0] || 'Clinical document preserved. Please review with your doctor.',
      keyFindings: lines.slice(1, 4),
      medicationGuidance: [],
      warnings: ['Review this document with your attending physician.'],
      confidence: 30,
      aiStatus: 'skipped',
      modelUsed: 'local-extractor',
      error: 'VITE_GROQ_API_KEY not configured.',
    };
  }

  try {
    console.log('[Text] Calling llama-3.3-70b with', text.length, 'chars of OCR text');
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '';
    console.log('[Text] Response:', raw.slice(0, 300));

    const result = parseJson(raw);
    if (result && result.summary.length > 15) {
      result.modelUsed = TEXT_MODEL;
      return result;
    }
  } catch (err: any) {
    console.error('[Text] Groq error:', err?.message || err);
  }

  // Graceful offline fallback
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && /[a-zA-Z]/.test(l));
  return {
    summary: lines[0] || 'Clinical document uploaded and preserved.',
    keyFindings: lines.slice(1, 4),
    medicationGuidance: [],
    warnings: ['Please review the full document with your attending physician.'],
    confidence: 35,
    aiStatus: 'failed',
    modelUsed: 'local-extractor',
    error: 'AI temporarily unavailable.',
  };
}

// ---------------------------------------------------------------------------
// RETRY — re-runs full analysis on an existing Firestore record
// ---------------------------------------------------------------------------
export async function retryRecordGroqAnalysis(recordId: string): Promise<AiExplanation> {
  const record = await getRecordById(recordId);
  if (!record) throw new Error('Medical record not found in Firestore.');

  const hasCloudinaryUrl =
    !!record.sourceFileUrl &&
    !record.sourceFileUrl.startsWith('data:') &&
    record.sourceFileUrl.startsWith('http');

  const hasOcrText =
    !!record.extractedText &&
    record.extractedText.replace(/[^a-zA-Z0-9]/g, '').length >= 30;

  if (!hasCloudinaryUrl && !hasOcrText) {
    throw new Error('No valid image URL or OCR text available to re-analyse this record.');
  }

  // Mark as processing immediately so UI shows spinner
  await updateRecordExplanation(recordId, {
    summary: 'AI is reading your document — this takes 5-15 seconds...',
    keyFindings: [],
    medicationGuidance: [],
    warnings: [],
    confidence: 0,
    aiStatus: 'processing',
  });

  let result: AiExplanation | null = null;

  // Step 1: Groq Vision (handles handwriting, mixed printed+handwritten docs)
  if (hasCloudinaryUrl) {
    result = await analyzeDocumentViaGroqVision(record.sourceFileUrl, record.type);
  }

  // Step 2: Text-based analysis (only if Vision failed AND OCR text is meaningful)
  if (!result && hasOcrText) {
    console.log('[Retry] Vision failed, attempting text analysis on stored OCR');
    result = await generateAiExplanation(record.extractedText!, record.type);
  }

  // Step 3: Hardcoded failure state
  if (!result || result.aiStatus === 'failed' && result.confidence < 30) {
    result = {
      summary: 'AI analysis could not be completed at this time. Please try again.',
      keyFindings: [],
      medicationGuidance: [],
      warnings: ['Download and show the original document to your doctor for interpretation.'],
      confidence: 0,
      aiStatus: 'failed',
      error: 'All AI analysis methods failed.',
    };
  }

  await updateRecordExplanation(recordId, result);
  return result;
}

// ---------------------------------------------------------------------------
// MULTI-DOCUMENT / PAGE-WISE VISION ANALYSIS
// Analyzes multiple uploaded files/pages and produces page-by-page explanations
// ---------------------------------------------------------------------------
export async function analyzeMultipleDocumentsViaVision(
  files: Array<{ url: string; fileName: string }>,
  docCategory?: string
): Promise<AiExplanation> {
  const fileSummaries: FileSummaryItem[] = [];
  const allFindings: string[] = [];
  const allMedications: MedicationGuidance[] = [];
  const allWarnings: string[] = [];

  for (let idx = 0; idx < files.length; idx++) {
    const item = files[idx];
    const exp = await analyzeDocumentViaGroqVision(item.url, docCategory);
    if (exp && exp.summary && exp.summary.length > 10) {
      const pageLabel = files.length > 1 ? `File ${idx + 1}: ${item.fileName}` : item.fileName;
      fileSummaries.push({
        fileIndex: idx + 1,
        fileName: pageLabel,
        summary: exp.summary,
        keyFindings: exp.keyFindings || [],
        medicationGuidance: exp.medicationGuidance || [],
        warnings: exp.warnings || [],
        sourceUrl: item.url,
      });

      if (exp.keyFindings) allFindings.push(...exp.keyFindings);
      if (exp.medicationGuidance) allMedications.push(...exp.medicationGuidance);
      if (exp.warnings) allWarnings.push(...exp.warnings);
    }
  }

  if (fileSummaries.length === 0) {
    return {
      summary: 'Medical document(s) uploaded and saved safely to health passport.',
      fileSummaries: [],
      keyFindings: [],
      medicationGuidance: [],
      warnings: ['Review original documents with your attending physician.'],
      confidence: 75,
      aiStatus: 'completed',
    };
  }

  const overallSummary =
    fileSummaries.length === 1
      ? fileSummaries[0].summary
      : `Document Batch Summary (${fileSummaries.length} files attached):\n` +
        fileSummaries.map((f, i) => `• File ${i + 1} (${f.fileName}): ${f.summary}`).join('\n\n');

  return {
    summary: overallSummary,
    fileSummaries,
    keyFindings: Array.from(new Set(allFindings)),
    medicationGuidance: allMedications,
    warnings: Array.from(new Set(allWarnings)),
    confidence: 90,
    aiStatus: 'completed',
  };
}

