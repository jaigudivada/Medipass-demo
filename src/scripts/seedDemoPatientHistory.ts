import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

// Load env vars into process.env before loading any modules
loadEnvFile();

const DEMO_PATIENT_ID = 'patient_001';
const DEMO_PATIENT_NAME = 'Jai Gudivada';
const DOCTOR_ID = 'dr.rajesh@apollo.demo';
const HOSPITAL_ID = 'apollo_hosp_001';

export async function seedDemoPatientHistory() {
  console.log('🌱 Starting Demo Patient Memory Seeding for Hindsight Agent...\n');
  console.log(`Patient: ${DEMO_PATIENT_NAME} (${DEMO_PATIENT_ID})`);
  console.log(`Target: ${process.env.VITE_HINDSIGHT_INSTANCE_URL || 'https://api.hindsight.vectorize.io'}\n`);

  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, doc, setDoc, collection, addDoc } = await import('firebase/firestore');
    const { getAuth, signInWithEmailAndPassword, signOut } = await import('firebase/auth');
    const { firebaseConfig } = await import('../lib/firebase.js');
    const {
      initializePatientMemoryBank,
      retainVisitInMemory,
      retainDocumentInMemory,
      retainTreatmentFeedback,
    } = await import('../lib/hindsight.js');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Sign in as admin to pass Firestore rules if possible
    try {
      await signInWithEmailAndPassword(auth, 'admin@medipass.demo', 'MediPass@123Main');
    } catch {
      // ignore auth error for script
    }

    // 1. Initialize Memory Bank
    console.log('Step 1: Initializing Hindsight memory bank...');
    await initializePatientMemoryBank(DEMO_PATIENT_ID, DEMO_PATIENT_NAME);
    console.log('   ✓ Memory bank initialized successfully.\n');

    // 2. Visit 1 (2 months ago): Initial Hypertension Diagnosis
    console.log('Step 2: Seeding Visit 1 (2 months ago — Hypertension Diagnosis & Lisinopril)...');
    await retainVisitInMemory(DEMO_PATIENT_ID, {
      doctorId: DOCTOR_ID,
      visitNotes: `Patient Jai Gudivada presents with recurring headaches and elevated blood pressure (148/92 mmHg). Family history of cardiovascular hypertension. Diagnosed with Stage 1 Essential Hypertension. Prescribed Lisinopril 10mg orally once daily. Advised low-sodium diet and follow-up in 4 weeks.`,
      aiSummary: 'Stage 1 Hypertension diagnosed. Lisinopril 10mg daily initiated.',
      documentType: 'Clinical OPD Notes',
      date: '10 May 2025',
    });

    await retainDocumentInMemory(DEMO_PATIENT_ID, {
      type: 'prescription',
      ocrText: 'Rx: Lisinopril 10mg Tablets. Take 1 tablet daily in the morning with water. Qty: 30. Refills: 1. Dr. Rajesh Kumar, Cardiology.',
      aiSummary: 'Initial prescription for Lisinopril 10mg daily for BP management.',
      keyFindings: ['Elevated BP 148/92 mmHg', 'Started Lisinopril 10mg daily'],
      medications: [{ name: 'Lisinopril 10mg', explanation: 'ACE Inhibitor for blood pressure reduction' }],
      uploadedAt: '10 May 2025',
    });
    console.log('   ✓ Visit 1 retained in Hindsight memory.\n');

    // 3. Visit 2 (6 weeks ago): Lisinopril Side Effect / Rash -> Switch to Amlodipine
    console.log('Step 3: Seeding Visit 2 (6 weeks ago — Lisinopril Allergic Rash -> Switch to Amlodipine)...');
    await retainVisitInMemory(DEMO_PATIENT_ID, {
      doctorId: DOCTOR_ID,
      visitNotes: `Patient returns complaining of a itchy skin rash on chest and arms and persistent dry cough starting 10 days after Lisinopril initiation. BP today 142/88 mmHg. Physical exam confirms allergic dermatological reaction to ACE inhibitor. ACTION: Discontinued Lisinopril immediately. Switched patient to Amlodipine 5mg once daily (Calcium Channel Blocker).`,
      aiSummary: 'Lisinopril adverse reaction: allergic rash & dry cough. Discontinued Lisinopril. Started Amlodipine 5mg daily.',
      documentType: 'Clinical OPD Follow-up Notes',
      date: '20 June 2025',
    });

    // Record treatment feedback: Doctor REJECTED Lisinopril continuation due to rash
    await retainTreatmentFeedback(DEMO_PATIENT_ID, DOCTOR_ID, {
      treatmentSuggested: 'Continue Lisinopril at reduced dosage',
      doctorFeedback: 'rejected',
      result: 'Discontinued due to allergic skin rash and dry cough',
      notes: 'Patient allergic to Lisinopril (ACE Inhibitors). Do NOT prescribe Lisinopril or ACE inhibitor class in future.',
    });
    console.log('   ✓ Visit 2 retained & Lisinopril rejection feedback recorded in Hindsight.\n');

    // 4. Visit 3 (3 weeks ago): Excellent BP Control on Amlodipine
    console.log('Step 4: Seeding Visit 3 (3 weeks ago — Amlodipine Response & BP Control)...');
    await retainVisitInMemory(DEMO_PATIENT_ID, {
      doctorId: DOCTOR_ID,
      visitNotes: `Follow-up visit for hypertension evaluation. Patient reports feeling great on Amlodipine 5mg daily. Rash completely resolved after stopping Lisinopril. BP today 122/80 mmHg (well-controlled). No ankle edema, no side effects reported. Patient tolerates Calcium Channel Blockers exceptionally well.`,
      aiSummary: 'Hypertension well controlled on Amlodipine 5mg. Lisinopril rash resolved. Patient tolerates Amlodipine excellently.',
      documentType: 'Clinical Progress Notes',
      date: '25 July 2025',
    });

    // Record treatment feedback: Doctor CONFIRMED Amlodipine 5mg treatment
    await retainTreatmentFeedback(DEMO_PATIENT_ID, DOCTOR_ID, {
      treatmentSuggested: 'Amlodipine 5mg daily for hypertension',
      doctorFeedback: 'confirmed',
      result: 'BP controlled at 122/80 mmHg, zero side effects',
      notes: 'Amlodipine 5mg is highly effective and well tolerated for Jai Gudivada.',
    });
    console.log('   ✓ Visit 3 retained & Amlodipine confirmation feedback recorded in Hindsight.\n');

    // 5. Update Firestore patient record with full history (idempotent-safe)
    console.log('Step 5: Updating Firestore database record for patient_001...');
    try {
      await setDoc(
        doc(db, 'patients', DEMO_PATIENT_ID),
        {
          id: DEMO_PATIENT_ID,
          name: DEMO_PATIENT_NAME,
          phone: '+919876543212',
          age: 28,
          bloodGroup: 'O+',
          allergies: ['Penicillin', 'Lisinopril (Skin Rash & Dry Cough)'],
          conditions: ['Stage 1 Essential Hypertension (Controlled)'],
          visitCount: 4,
          lastVisitDate: '25 July 2025',
          medications: [
            {
              name: 'Amlodipine',
              dosage: '5mg daily',
              startDate: '20 June 2025',
              status: 'active',
              effectiveness: 'Excellent (BP 122/80)',
            },
            {
              name: 'Lisinopril',
              dosage: '10mg daily',
              startDate: '10 May 2025',
              status: 'discontinued',
              sideEffects: ['Skin rash', 'Dry cough'],
            },
          ],
          pastTreatments: [
            {
              date: '10 May 2025',
              condition: 'Stage 1 Hypertension',
              treatment: 'Lisinopril 10mg daily',
              outcome: 'Caused allergic rash & dry cough',
            },
            {
              date: '20 June 2025',
              condition: 'Hypertension + Lisinopril Rash',
              treatment: 'Switched to Amlodipine 5mg daily',
              outcome: 'Rash resolved, BP improved',
            },
            {
              date: '25 July 2025',
              condition: 'Hypertension Follow-up',
              treatment: 'Continued Amlodipine 5mg daily',
              outcome: 'Well-controlled (122/80 mmHg)',
            },
          ],
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log('   ✓ Firestore patient profile updated.\n');
    } catch (fsErr: any) {
      console.warn('   ⚠ Firestore update warning (non-fatal):', fsErr?.message || fsErr);
    }

    console.log('================================================================');
    console.log('✅ DEMO PATIENT HISTORY SEED COMPLETE!');
    console.log('================================================================');
    console.log('Now when you log in as Dr. Rajesh Kumar (dr.rajesh@apollo.demo)');
    console.log('and open Jai Gudivada (patient_001), clicking "Analyze Visit with');
    console.log('Memory" will recall this exact Lisinopril -> Amlodipine history');
    console.log('and provide personalized, pattern-aware clinical guidance!');
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Demo patient memory seeding failed:', error);
    process.exit(1);
  }
}

seedDemoPatientHistory();
