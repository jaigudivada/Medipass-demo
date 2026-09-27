/**
 * hindsight.ts — MediPass × Hindsight Memory Integration
 *
 * Powers the Memory-Powered Medical Intelligence Agent.
 * Each patient gets a dedicated Hindsight memory bank that persists across
 * doctor visits and gets smarter with every interaction.
 *
 * Architecture:
 *   retain()  → stores visit notes, treatment outcomes, patterns
 *   recall()  → retrieves relevant past memories for current visit context
 *   reflect() → generates synthesized, memory-grounded clinical insights
 */

import { HindsightClient } from '@vectorize-io/hindsight-client';
import Groq from 'groq-sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientMemory {
  patientId: string;
  patientName: string;
  conditions: string[];
  medications: {
    name: string;
    dosage: string;
    startDate: string;
    status: 'active' | 'discontinued';
    effectiveness?: string;
    sideEffects?: string[];
  }[];
  allergies: string[];
  familyHistory?: string[];
  pastTreatments: {
    date: string;
    condition: string;
    treatment: string;
    outcome: string;
  }[];
  visitCount: number;
  lastVisitDate?: string;
}

export interface AgentInsights {
  insights: string;
  learnedPatterns: string[];
  predictedRisks: string[];
  recommendations: string[];
  memoryUsed: boolean;
}

export interface TreatmentFeedback {
  treatmentSuggested: string;
  doctorFeedback: 'confirmed' | 'modified' | 'rejected';
  result?: string;
  notes?: string;
}

export interface VisitHistory {
  visitNumber: number;
  date: string;
  agentQuality: 'generic' | 'aware' | 'personalized' | 'expert';
  example: string;
}

// ---------------------------------------------------------------------------
// Client initialization
// ---------------------------------------------------------------------------

let _hindsightClient: HindsightClient | null = null;
let _groqClient: ReturnType<typeof getGroqClient> | null = null;

function getEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]).trim();
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return String(process.env[key]).trim();
  }
  return '';
}

function getHindsightClient(): HindsightClient {
  if (_hindsightClient) return _hindsightClient;
  const baseUrl = getEnv('VITE_HINDSIGHT_INSTANCE_URL') || 'https://api.hindsight.vectorize.io';
  const apiKey = getEnv('VITE_HINDSIGHT_API_KEY');
  _hindsightClient = new HindsightClient({ baseUrl, apiKey });
  return _hindsightClient;
}

function getGroqClient() {
  if (_groqClient) return _groqClient;
  _groqClient = new Groq({
    apiKey: getEnv('VITE_GROQ_API_KEY'),
    dangerouslyAllowBrowser: true,
  });
  return _groqClient;
}

/** bankId uniquely identifies each patient's memory bank in Hindsight */
function patientBankId(patientId: string): string {
  return `medipass-patient-${patientId}`;
}

// ---------------------------------------------------------------------------
// Phase 1: Initialize patient's memory bank (Hindsight createBank)
// ---------------------------------------------------------------------------

/**
 * Ensures a named Hindsight memory bank exists for the patient.
 * Safe to call on every visit — idempotent.
 */
export async function initializePatientMemoryBank(
  patientId: string,
  patientName: string
): Promise<void> {
  try {
    const client = getHindsightClient();
    const bankId = patientBankId(patientId);
    await client.createBank(bankId, {
      name: `MediPass Agent — ${patientName}`,
      background: `You are a persistent Medical Intelligence Agent for patient ${patientName} (ID: ${patientId}).
      
Your role: Remember this patient's entire medical history, learn treatment patterns, and provide
personalized clinical insights that improve with every doctor visit.

You have access to:
- Patient's complete medical history across all visits
- Every treatment outcome (what worked, what didn't)
- Learned patterns about this patient's body responses
- Allergies, contraindications, family risk factors
- Doctor's feedback on your past recommendations

Principles:
- Be concise but specific — cite the patient's actual history
- Flag recurring patterns proactively
- Warn about contraindications and allergy risks
- Predict risks based on family history and trend data
- Learn from doctor corrections to improve future recommendations`,
    });
    console.log(`[Hindsight] Memory bank initialized for patient ${patientId}`);
  } catch (err: any) {
    // Bank may already exist — not fatal
    console.warn('[HINDSIGHT DEBUG] createBank warning (may already exist):', err);
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Retain — store visit data in Hindsight memory
// ---------------------------------------------------------------------------

/**
 * Store today's visit notes and documents in permanent Hindsight memory.
 * Called automatically when a doctor uploads/processes documents.
 */
export async function retainVisitInMemory(
  patientId: string,
  visitData: {
    doctorId: string;
    visitNotes: string;
    aiSummary?: string;
    documentType?: string;
    date?: string;
  }
): Promise<void> {
  try {
    const client = getHindsightClient();
    const bankId = patientBankId(patientId);
    const visitDate = visitData.date || new Date().toLocaleDateString('en-IN');

    const memoryContent = `[Visit Record — ${visitDate}]
Doctor: ${visitData.doctorId}
Document Type: ${visitData.documentType || 'Clinical Notes'}

Visit Notes / Symptoms:
${visitData.visitNotes}

${visitData.aiSummary ? `AI Clinical Summary:\n${visitData.aiSummary}` : ''}
[End Visit Record]`;

    await client.retain(bankId, memoryContent, {
      timestamp: new Date(),
      context: `Doctor visit — ${visitDate}`,
      metadata: { patientId, doctorId: visitData.doctorId, type: 'visit' },
    });

    console.log(`[Hindsight] Visit retained in memory for patient ${patientId}`);
  } catch (err: any) {
    console.error('[HINDSIGHT DEBUG] retainVisitInMemory error:', err);
    // Non-fatal — still continue without memory persistence
  }
}

/**
 * Store a document's AI analysis in Hindsight memory.
 * Called from the reception upload pipeline after Groq analysis completes.
 */
export async function retainDocumentInMemory(
  patientId: string,
  document: {
    type: string;
    ocrText: string;
    aiSummary: string;
    keyFindings: string[];
    medications?: { name: string; explanation: string }[];
    warnings?: string[];
    uploadedAt?: string;
  }
): Promise<void> {
  try {
    const client = getHindsightClient();
    const bankId = patientBankId(patientId);
    const uploadDate = document.uploadedAt || new Date().toLocaleDateString('en-IN');

    const memoryContent = `[Medical Document — ${document.type.toUpperCase()} — ${uploadDate}]
AI Summary: ${document.aiSummary}

Key Findings:
${document.keyFindings.map((f) => `• ${f}`).join('\n')}

${
  document.medications && document.medications.length > 0
    ? `Medications:\n${document.medications.map((m) => `• ${m.name}: ${m.explanation}`).join('\n')}`
    : ''
}

${
  document.warnings && document.warnings.length > 0
    ? `Warnings / Follow-up:\n${document.warnings.map((w) => `⚠ ${w}`).join('\n')}`
    : ''
}
[End Document]`;

    await client.retain(bankId, memoryContent, {
      timestamp: new Date(),
      context: `Medical document: ${document.type}`,
      metadata: { patientId, type: 'document', docType: document.type },
    });

    console.log(`[Hindsight] Document retained in memory for patient ${patientId}`);
  } catch (err: any) {
    console.error('[HINDSIGHT DEBUG] retainDocumentInMemory error:', err);
  }
}

/**
 * Store doctor's feedback on a recommendation in Hindsight memory.
 * This is the LEARNING LOOP — agent improves from doctor corrections.
 */
export async function retainTreatmentFeedback(
  patientId: string,
  doctorId: string,
  feedback: TreatmentFeedback
): Promise<void> {
  try {
    const client = getHindsightClient();
    const bankId = patientBankId(patientId);
    const date = new Date().toLocaleDateString('en-IN');

    const feedbackContent = `[Treatment Outcome Learning — ${date}]
Doctor: ${doctorId}
Recommendation Given: ${feedback.treatmentSuggested}
Doctor's Decision: ${feedback.doctorFeedback.toUpperCase()}
${feedback.result ? `Clinical Result: ${feedback.result}` : ''}
${feedback.notes ? `Doctor Notes: ${feedback.notes}` : ''}

LEARNING SIGNAL: ${
      feedback.doctorFeedback === 'confirmed'
        ? 'This recommendation was correct. Use similar logic for future visits.'
        : feedback.doctorFeedback === 'modified'
        ? 'Recommendation needed adjustment. Refine approach for this patient.'
        : 'Recommendation was rejected. Avoid this approach for this patient in future.'
    }
[End Outcome]`;

    await client.retain(bankId, feedbackContent, {
      timestamp: new Date(),
      context: 'Doctor feedback on recommendation',
      metadata: {
        patientId,
        doctorId,
        type: 'feedback',
        outcome: feedback.doctorFeedback,
      },
    });

    console.log(`[Hindsight] Treatment feedback learned for patient ${patientId}`);
  } catch (err: any) {
    console.error('[HINDSIGHT DEBUG] retainTreatmentFeedback error:', err);
  }
}

// ---------------------------------------------------------------------------
// Phase 3: Recall + Analyze — the intelligence engine
// ---------------------------------------------------------------------------

/**
 * Core intelligence function: recall memories + generate clinical insights.
 * This is what makes the agent smarter at every visit.
 */
export async function processVisitWithMemory(
  patientId: string,
  currentVisitNotes: string,
  patientMemory: PatientMemory,
  doctorId: string
): Promise<AgentInsights> {
  let recalledMemories = '';
  let memoryUsed = false;

  // Step 1: Recall relevant memories from Hindsight
  try {
    const client = getHindsightClient();
    const bankId = patientBankId(patientId);

    const recallQuery = `${currentVisitNotes} — allergies, medication responses, treatment outcomes, recurring patterns, family history`;
    const recalled = await client.recall(bankId, recallQuery, { budget: 'mid' });

    if (recalled && typeof recalled === 'object') {
      // Handle different possible shapes of recall response
      const memories =
        (recalled as any).memories ||
        (recalled as any).results ||
        (recalled as any).items ||
        [];
      if (Array.isArray(memories) && memories.length > 0) {
        recalledMemories = memories
          .map((m: any) => m.content || m.text || String(m))
          .join('\n\n');
        memoryUsed = true;
        console.log(`[Hindsight] Recalled ${memories.length} memories for patient ${patientId}`);
      }
    } else if (typeof recalled === 'string' && recalled.length > 10) {
      recalledMemories = recalled;
      memoryUsed = true;
    }
  } catch (err: any) {
    console.warn('[HINDSIGHT DEBUG] recall warning:', err);
    // Continue without memory — agent runs in first-visit mode
  }

  // Step 2: Build rich context for Groq analysis
  const memoryContext = buildMemoryContext(patientMemory, recalledMemories);

  // Step 3: Call Groq with memory-powered context
  const groqInsights = await callGroqWithMemory(
    currentVisitNotes,
    memoryContext,
    patientMemory,
    memoryUsed
  );

  // Step 4: Store this visit in Hindsight for next time
  await retainVisitInMemory(patientId, {
    doctorId,
    visitNotes: currentVisitNotes,
    aiSummary: groqInsights.insights.slice(0, 500),
  });

  return { ...groqInsights, memoryUsed };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildMemoryContext(
  patient: PatientMemory,
  recalledMemories: string
): string {
  const activeMeds = patient.medications
    .filter((m) => m.status === 'active')
    .map((m) => `${m.name} ${m.dosage}`)
    .join(', ');

  const recentTreatments = patient.pastTreatments
    .slice(-5)
    .map((t) => `[${t.date}] ${t.condition}: ${t.treatment} → ${t.outcome}`)
    .join('\n');

  return `=== PATIENT SNAPSHOT ===
Name: ${patient.patientName}
Visit #${patient.visitCount}${patient.lastVisitDate ? ` (Last: ${patient.lastVisitDate})` : ''}

Conditions: ${patient.conditions.join(', ') || 'Not documented'}
Active Medications: ${activeMeds || 'None on record'}
Allergies: ${patient.allergies.join(', ') || 'None documented'}
Family History: ${patient.familyHistory?.join(', ') || 'Not documented'}

Recent Treatment History:
${recentTreatments || 'No past treatments recorded'}

${
  recalledMemories
    ? `=== HINDSIGHT AGENT MEMORY (from past visits) ===\n${recalledMemories}\n`
    : '=== FIRST VISIT (no prior memory) ==='
}`;
}

async function callGroqWithMemory(
  currentVisitNotes: string,
  memoryContext: string,
  patient: PatientMemory,
  memoryUsed: boolean
): Promise<Omit<AgentInsights, 'memoryUsed'>> {
  const groq = getGroqClient();

  const systemPrompt = `You are MediPass — a Medical Intelligence Agent with persistent memory.
You have ${memoryUsed ? `${patient.visitCount} past visits` : 'no prior history'} for this patient in memory.
${memoryUsed ? 'Use your memory to provide personalized, pattern-aware insights.' : 'Provide baseline clinical guidance for first visit.'}

Always respond with valid JSON in this exact structure:
{
  "insights": "2-4 sentences synthesizing memory + current data",
  "learnedPatterns": ["Pattern from memory 1", "Pattern 2"],
  "predictedRisks": ["Risk flag 1 based on history", "Risk flag 2"],
  "recommendations": ["Specific recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Rules:
- Quote specific past data: "In your Jan 2025 visit, lisinopril caused rash"
- Be specific, not generic — use the patient's actual history
- Flag allergy conflicts immediately
- Max 3 patterns, 3 risks, 5 recommendations`;

  const userPrompt = `${memoryContext}

=== TODAY'S VISIT ===
${currentVisitNotes}

Based on ALL available memory and today's presentation, generate your clinical intelligence report.
${memoryUsed ? 'Show how memory from past visits makes your insights more personalized than visit 1.' : ''}`;

  try {
    const completion = await groq.chat.completions.create({
      model: import.meta.env.VITE_GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.15,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(raw);

    return {
      insights: String(parsed.insights || 'Analysis completed.'),
      learnedPatterns: Array.isArray(parsed.learnedPatterns) ? parsed.learnedPatterns : [],
      predictedRisks: Array.isArray(parsed.predictedRisks) ? parsed.predictedRisks : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (err: any) {
    console.error('[Groq] Analysis failed:', err?.message);
    // Graceful fallback
    return {
      insights: `Analysis based on ${memoryUsed ? `${patient.visitCount} past visits` : 'current visit'}: Patient presents with the noted symptoms. Review with clinical judgment.`,
      learnedPatterns: memoryUsed
        ? [`Patient has been seen ${patient.visitCount} times — memory available`]
        : [],
      predictedRisks:
        patient.allergies.length > 0
          ? [`Known allergies on record: ${patient.allergies.join(', ')}`]
          : [],
      recommendations: ['Review current symptoms', 'Consult complete patient history'],
    };
  }
}

// ---------------------------------------------------------------------------
// Phase 4: Demo — Memory Growth Timeline data
// ---------------------------------------------------------------------------

/**
 * Generate visit quality progression for the Memory Growth Timeline component.
 * Maps visit count to agent intelligence level for the demo visualization.
 */
export function getVisitQualityProgression(visitCount: number): VisitHistory[] {
  const examples = [
    {
      quality: 'generic' as const,
      example: 'Based on your symptoms, you might have hypertension. I recommend antihypertensive therapy.',
    },
    {
      quality: 'generic' as const,
      example: 'Patient presents with elevated BP. Standard treatment protocols apply.',
    },
    {
      quality: 'aware' as const,
      example: 'I remember from visit 2 that lisinopril caused rash. Suggesting amlodipine instead.',
    },
    {
      quality: 'personalized' as const,
      example: 'Pattern: BP spikes every 3 months. Based on last treatment, ACE inhibitors work well for you.',
    },
    {
      quality: 'personalized' as const,
      example: 'I notice recurring UTI pattern (3 in 6 months). Recommend prophylactic treatment evaluation.',
    },
    {
      quality: 'expert' as const,
      example: 'Given family history + 5 visits of data: High diabetes risk. Pre-emptive glucose monitoring recommended.',
    },
    {
      quality: 'expert' as const,
      example: 'Memory shows you respond best to morning dosing. Predicting 92% efficacy with current protocol.',
    },
  ];

  const count = Math.min(visitCount, examples.length);
  if (count === 0) return [];

  return Array.from({ length: count }, (_, i) => ({
    visitNumber: i + 1,
    date: new Date(Date.now() - (count - 1 - i) * 30 * 24 * 3600 * 1000).toLocaleDateString(
      'en-IN',
      { month: 'short', year: 'numeric' }
    ),
    agentQuality: examples[i].quality,
    example: examples[i].example,
  }));
}

// ---------------------------------------------------------------------------
// Utility: Check if Hindsight is configured and reachable
// ---------------------------------------------------------------------------

export async function checkHindsightConnection(): Promise<{
  connected: boolean;
  mode: 'cloud' | 'local' | 'unconfigured';
  message: string;
}> {
  const url = getEnv('VITE_HINDSIGHT_INSTANCE_URL');
  const apiKey = getEnv('VITE_HINDSIGHT_API_KEY');

  if (!url) {
    return {
      connected: false,
      mode: 'unconfigured',
      message: 'VITE_HINDSIGHT_INSTANCE_URL not set — memory features disabled',
    };
  }

  const isCloud = url.includes('hindsight.vectorize.io');
  if (isCloud && !apiKey) {
    return {
      connected: false,
      mode: 'cloud',
      message: 'Hindsight Cloud requires an API key — set VITE_HINDSIGHT_API_KEY',
    };
  }

  try {
    const client = getHindsightClient();
    const version = await client.getVersion();
    return {
      connected: true,
      mode: isCloud ? 'cloud' : 'local',
      message: `Hindsight ${version.api_version} connected (${isCloud ? 'cloud' : 'local'})`,
    };
  } catch (err: any) {
    console.error('[HINDSIGHT DEBUG] checkHindsightConnection failed:', err);
    return {
      connected: false,
      mode: isCloud ? 'cloud' : 'local',
      message: `Hindsight unreachable: ${err?.message || 'connection failed'}`,
    };
  }
}
