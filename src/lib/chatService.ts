import Groq from 'groq-sdk';
import { recallPatientMemories, getHindsightClientExported as getHindsightClient, patientBankId } from './hindsight';
import { getPatientById } from './firestore';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function getChatResponse(patientId: string, userMessage: string, history: Message[]) {
  try {
    // 1. Retrieve relevant memories from Hindsight
    const memories = await recallPatientMemories(patientId, userMessage);

    // 2. Get patient basic context from Firestore
    const patient = await getPatientById(patientId);
    const patientContext = patient
      ? `Patient Name: ${patient.name}, Age: ${patient.age}, Blood Group: ${patient.bloodGroup}, Allergies: ${patient.allergies.join(', ') || 'None'}`
      : 'Basic patient profile not found.';

    // 3. Construct the System Prompt (Medical Safety First)
    const systemPrompt = `You are the MediPass AI Assistant, a longitudinal medical memory agent.
Your purpose is to help patients understand their health reports, prescriptions, and medical history using your persistent memory.

CRITICAL SAFETY RULES:
1. NEVER provide a medical diagnosis.
2. NEVER suggest specific medication dosages.
3. If the user mentions severe symptoms (e.g., chest pain, difficulty breathing, severe bleeding), IMMEDIATELY advise them to call emergency services or visit the nearest ER.
4. Distinguish between patient-stated facts ("The patient mentioned they have...") and AI-generated summaries.
5. If you don't know the answer based on the provided records and memory, honestly state that you don't know and advise the patient to consult their doctor.

CONTEXT:
${patientContext}

LONG-TERM MEMORY (Relevant past interactions):
${memories || 'No relevant past memories found.'}

You are a supportive, professional, and empathetic assistant. Keep responses concise and easy to understand.`;

    // 4. Build the message array for Groq (Context Window Management)
    // We keep only the last 15 messages to avoid exceeding the LLM context window
    const truncatedHistory = history.slice(-15);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...truncatedHistory,
      { role: 'user', content: userMessage },
    ];

    // 5. Call Groq LLM
    const completion = await groq.chat.completions.create({
      model: import.meta.env.VITE_GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: messages,
      temperature: 0.3,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I am sorry, I could not generate a response. Please try again.';

    // 6. Asynchronously retain useful information in Hindsight
    // We use a robust error handler to ensure memory failures are logged properly
    retainConversationMemory(patientId, userMessage, aiResponse).catch(err => {
      console.error('[ChatService] Critical Error retaining conversation memory:', err);
    });

    return aiResponse;
  } catch (error) {
    console.error('[ChatService] Error in getChatResponse:', error);
    return 'I encountered an error processing your request. Please try again in a moment.';
  }
}

async function retainConversationMemory(patientId: string, userMessage: string, aiResponse: string) {
  try {
    const client = getHindsightClient();
    const bankId = patientBankId(patientId);

    // We use the AI to determine if this exchange contains something worth remembering long-term
    const extractionPrompt = `Analyze the following patient-AI exchange and extract only key longitudinal medical facts (e.g., new symptoms, confirmed allergies, patient-stated preferences, follow-up concerns).
    If nothing useful for long-term memory is found, respond with "NONE".

    User: ${userMessage}
    AI: ${aiResponse}

    Format: [FACT]: <detailed fact>`;

    const completion = await groq.chat.completions.create({
      model: import.meta.env.VITE_GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: [{ role: 'system', content: extractionPrompt }],
      temperature: 0.1,
    });

    const extraction = completion.choices[0]?.message?.content || 'NONE';

    if (extraction !== 'NONE' && extraction.length > 5) {
      await client.retain(bankId, extraction, {
        timestamp: new Date(),
        context: 'Patient chat interaction',
        metadata: { type: 'conversation_memory' },
      });
      console.log('[ChatService] Retained new memory from conversation');
    }
  } catch (err) {
    console.error('[ChatService] Memory retention failed:', err);
  }
}
