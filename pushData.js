import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBd0z0vDIEllSRcLX7kupMYO1aAbj72CDs",
  authDomain: "medipass-admin.firebaseapp.com",
  projectId: "medipass-admin",
  storageBucket: "medipass-admin.firebasestorage.app",
  messagingSenderId: "58161930294",
  appId: "1:58161930294:web:16846f1b671805db877897",
  measurementId: "G-J44L9CYHM5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const hospitals = [
  { id: 'hosp-1', name: 'Apollo Health City', city: 'Hyderabad', code: 'APO-HYD-01' },
  { id: 'hosp-2', name: 'Fortis Healthcare', city: 'Bengaluru', code: 'FOR-BLR-02' },
  { id: 'hospitalsmedipass', name: 'MediPass General Hospital', city: 'Hyderabad', code: 'MED-HYD-00' }
];

const staff = [
  { id: 'doc-1', name: 'Dr. Rajesh Sharma', role: 'doctor', hospitalId: 'hosp-1', specialty: 'Senior Cardiology', cabin: 'OPD Room 304' },
  { id: 'doc-2', name: 'Dr. Ananya Rao', role: 'doctor', hospitalId: 'hosp-1', specialty: 'Internal Medicine', cabin: 'OPD Room 108' },
  { id: 'rec-1', name: 'Priya Verma', role: 'receptionist', hospitalId: 'hosp-1', deskId: 'Desk A-2' }
];

const patient = {
  id: 'pat-84920',
  name: 'Rahul Mehra',
  age: 34,
  gender: 'Male',
  bloodGroup: 'O+',
  phone: '+91 98765 43210',
  email: 'rahul.mehra@example.com',
  emergencyContact: 'Anjali Mehra (Wife) - +91 98765 12345',
  allergies: ['Penicillin (Mild Rash)'],
  chronicConditions: ['Mild Essential Hypertension']
};

const records = [
  {
    id: 'rec-101',
    date: '2026-09-15',
    timestamp: '10:30 AM',
    title: 'Cardiology Consultation & Lipid Evaluation',
    type: 'Prescription',
    hospitalName: 'Apollo Health City',
    doctorName: 'Dr. Rajesh Sharma',
    department: 'Cardiology',
    vitals: { bp: '138/88 mmHg', heartRate: '76 bpm', temp: '98.4 °F', spO2: '99%' },
    rawText: `APOLLO HEALTH CITY - HYDERABAD\nPATIENT: Rahul Mehra | AGE: 34 | BLOOD GROUP: O+\nDATE: 15-SEP-2026 | DEPT: Cardiology\nDOCTOR: Dr. Rajesh Sharma (Reg: TS-48291)\n\nDIAGNOSIS: Mild Essential Hypertension & Hyperlipidemia\n\nPRESCRIPTION MEDICATIONS:\n1. Telmisartan 40mg - 1 tablet Daily in Morning after breakfast (30 days)\n2. Atorvastatin 10mg - 1 tablet Daily at Bedtime (30 days)\n3. Pantoprazole 40mg - 1 tablet Daily 30 mins Before Breakfast (14 days)\n\nLAB RESULTS & VITALS:\n- Blood Pressure: 138/88 mmHg\n- Heart Rate: 76 bpm\n- Total Serum Cholesterol: 228 mg/dL (High, ref < 200)\n- Fasting Blood Sugar: 94 mg/dL (Normal)\n\nCLINICAL ADVICE:\n- Reduce dietary sodium intake (<2g/day)\n- 30-45 minutes brisk daily walking\n- Re-check Lipid Profile & Electrolytes in 6 weeks.`,
    summary: 'Diagnosed with Mild Essential Hypertension and elevated Serum Cholesterol. Prescribed Telmisartan 40mg and Atorvastatin 10mg.',
    medications: [
      { name: 'Telmisartan', dosage: '40mg', frequency: 'Once daily (Morning)', duration: '30 days' },
      { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily (Bedtime)', duration: '30 days' },
      { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily (Before Breakfast)', duration: '14 days' }
    ],
    aiExplanation: {
      summary: "Your doctor noticed your blood pressure (138/88) and cholesterol levels (228 mg/dL) are slightly higher than normal. They have started you on protective medications to maintain heart and vascular health.",
      medicationGuidance: [
        { name: "Telmisartan 40mg", explanation: "Relaxes blood vessels to maintain blood pressure within a target range. Take daily after breakfast." },
        { name: "Atorvastatin 10mg", explanation: "Helps lower LDL cholesterol to protect arterial health. Take at bedtime." },
        { name: "Pantoprazole 40mg", explanation: "Protects your stomach lining. Take 30 minutes before breakfast." }
      ],
      keyTakeaways: [
        "Reduce dietary sodium intake below 2g daily.",
        "Maintain 30-45 minutes of daily physical walking.",
        "Schedule a follow-up lipid panel in 6 weeks."
      ],
      warnings: ["Seek immediate medical advice if experiencing severe dizziness or muscle pain."]
    },
    documentUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'rec-100',
    date: '2026-06-20',
    timestamp: '02:15 PM',
    title: 'Annual Comprehensive Lab Panel',
    type: 'Lab Report',
    hospitalName: 'Apollo Health City',
    doctorName: 'Dr. Ananya Rao',
    department: 'Internal Medicine',
    vitals: { bp: '122/80 mmHg', heartRate: '72 bpm', temp: '98.6 °F', spO2: '98%' },
    rawText: `APOLLO PATHOLOGY LABS\nPATIENT: Rahul Mehra | DATE: 20-JUN-2026\nHbA1c: 5.6% (Normal)\nCBC: WBC 6.8 k/uL, RBC 4.9 M/uL, Platelets 240 k/uL\nVitamin D3: 18.4 ng/mL (Deficient < 30 ng/mL)\nThyroid TSH: 2.1 mIU/L (Normal)`,
    summary: 'Routine annual blood panel showing normal HbA1c and thyroid function, but deficient Vitamin D3 levels.',
    medications: [
      { name: 'Cholecalciferol (Vit D3)', dosage: '60,000 IU', frequency: 'Once weekly for 8 weeks', duration: '2 months' }
    ],
    aiExplanation: {
      summary: "Your annual blood panel is overall very healthy with normal blood sugar (HbA1c) and blood cell counts. The primary finding is deficient Vitamin D3.",
      medicationGuidance: [
        { name: "Cholecalciferol 60K", explanation: "High-dose Vitamin D supplement to rebuild bone and immune vitamin stores. Take once weekly." }
      ],
      keyTakeaways: [
        "Vitamin D3 level is 18.4 ng/mL (normal range > 30 ng/mL).",
        "Maintain 15 minutes of morning sunlight exposure."
      ],
      warnings: []
    },
    documentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80'
  }
];

const sessions = [
  {
    id: 'q-seed-1',
    patientId: 'pat-84920',
    patientName: 'Rahul Mehra',
    patientAge: 34,
    patientGender: 'Male',
    bloodGroup: 'O+',
    checkInTime: '10:15 AM',
    code: 'MP-8492',
    doctorId: 'doc-1',
    doctorName: 'Dr. Rajesh Sharma',
    status: 'waiting',
    reason: 'Routine Cardiology Follow-up & Vitals'
  }
];

async function seedDatabase() {
  console.log('Pushing data into Firestore database (medipass-admin)...');

  for (const h of hospitals) {
    const { id, ...data } = h;
    await setDoc(doc(db, 'hospitals', id), data);
    console.log(`Pushed hospital: ${id}`);
  }

  for (const s of staff) {
    const { id, ...data } = s;
    await setDoc(doc(db, 'staff', id), data);
    console.log(`Pushed staff: ${id}`);
  }

  const { id: patId, ...patData } = patient;
  await setDoc(doc(db, 'patients', patId), patData);
  console.log(`Pushed patient: ${patId}`);

  for (const r of records) {
    const { id, ...data } = r;
    await setDoc(doc(db, 'records', id), data);
    console.log(`Pushed record: ${id}`);
  }

  for (const sess of sessions) {
    const { id, ...data } = sess;
    await setDoc(doc(db, 'sessions', id), data);
    console.log(`Pushed session: ${id}`);
  }

  console.log('✅ SUCCESS: All data pushed to Firestore database!');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Error seeding database:', err);
  process.exit(1);
});
