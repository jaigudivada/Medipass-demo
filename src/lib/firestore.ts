import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Interfaces matching Phase 2 Firestore Schema

export interface Hospital {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  departments: string[];
  status: 'active' | 'inactive';
  createdAt?: any;
}

export interface Staff {
  id: string;
  authUid: string;            // Firebase Auth UID — never displayed in UI
  name: string;
  email: string;
  role: 'doctor' | 'receptionist' | 'admin';
  hospitalId: string;
  specialty?: string;
  department?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  bloodGroup: string;
  allergies: string[];
  createdAt?: any;
}

export interface PatientVitals {
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  weight?: number | null;
}

export interface Session {
  id: string;
  patientId: string;
  hospitalId: string;
  doctorId: string | null;
  opNumber: string;
  status: 'registered' | 'checked_in' | 'consulted' | 'admitted' | 'discharged';
  createdAt?: any;
  checkedInAt?: any;
  consultedAt?: any;
  admittedAt?: any;
  dischargedAt?: any;
  // Denormalized/populated fields for UI presentation without showing internal IDs
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  hospitalName?: string;
}

export interface MedicalRecordDoc {
  id: string;
  patientId: string;
  sessionId?: string;
  hospitalId?: string;
  uploadedByStaffId?: string;
  uploadedByPatient?: boolean;
  type: 'prescription' | 'lab_report' | 'imaging_report' | 'discharge_summary' | 'external_doc';
  date: any;
  extractedText: string;
  ocrStatus?: 'completed' | 'failed' | 'empty';
  aiExplanation: string | any; // parsed structured object or string
  sourceFileUrl: string;
  attachments?: Array<{ url: string; name: string; type?: string }>;
  vitals?: PatientVitals;
  createdAt?: any;
  // Populated fields for UI
  hospitalName?: string;
  doctorName?: string;
}

// -------------------------------------------------------------
// HOSPITALS
// -------------------------------------------------------------
export async function getHospitals(): Promise<Hospital[]> {
  const snap = await getDocs(collection(db, 'hospitals'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hospital));
}

export async function getHospitalById(id: string): Promise<Hospital | null> {
  if (!id) return null;
  const snap = await getDoc(doc(db, 'hospitals', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Hospital;
}

export async function addHospital(data: Omit<Hospital, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'hospitals'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHospital(id: string, data: Partial<Hospital>): Promise<void> {
  await updateDoc(doc(db, 'hospitals', id), data);
}

export async function toggleHospitalStatus(id: string, currentStatus: 'active' | 'inactive'): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  await updateDoc(doc(db, 'hospitals', id), { status: newStatus });
}

export async function deleteHospital(id: string): Promise<void> {
  await deleteDoc(doc(db, 'hospitals', id));
}

// -------------------------------------------------------------
// STAFF
// -------------------------------------------------------------
export async function getStaff(): Promise<Staff[]> {
  const snap = await getDocs(collection(db, 'staff'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff));
}

/**
 * Resolves a staff document by the Firebase Auth UID stored in the `authUid` field.
 * Used by AuthContext immediately after onAuthStateChanged fires for staff roles.
 */
export async function getStaffByAuthUid(authUid: string): Promise<Staff | null> {
  if (!authUid) return null;
  const q = query(collection(db, 'staff'), where('authUid', '==', authUid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Staff;
}

export async function getDoctorsByHospital(hospitalId: string): Promise<Staff[]> {
  const q = query(
    collection(db, 'staff'),
    where('hospitalId', '==', hospitalId),
    where('role', '==', 'doctor'),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Staff));
}

export async function addStaff(data: Omit<Staff, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'staff'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStaff(id: string, data: Partial<Staff>): Promise<void> {
  await updateDoc(doc(db, 'staff', id), data);
}

export async function toggleStaffStatus(id: string, currentStatus: 'active' | 'inactive'): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  await updateDoc(doc(db, 'staff', id), { status: newStatus });
}

export async function deleteStaff(id: string): Promise<void> {
  await deleteDoc(doc(db, 'staff', id));
}

// -------------------------------------------------------------
// PATIENTS & PHONE INDEXING
// -------------------------------------------------------------
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && !phone.startsWith('+')) return `+${digits}`;
  return phone.trim();
}

export async function getPatientByPhone(phone: string): Promise<Patient | null> {
  const normPhone = normalizePhone(phone);
  const indexSnap = await getDoc(doc(db, 'patientsByPhone', normPhone));
  if (!indexSnap.exists()) return null;
  
  const patientId = indexSnap.data().patientId;
  if (!patientId) return null;

  const patientSnap = await getDoc(doc(db, 'patients', patientId));
  if (!patientSnap.exists()) return null;

  return { id: patientSnap.id, ...patientSnap.data() } as Patient;
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  if (!patientId) return null;
  const snap = await getDoc(doc(db, 'patients', patientId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Patient;
}

export async function createPatientWithPhoneIndex(data: {
  name: string;
  phone: string;
  age: number;
  bloodGroup: string;
  allergies: string[];
}): Promise<Patient> {
  const normPhone = normalizePhone(data.phone);

  return await runTransaction(db, async (tx) => {
    const indexRef = doc(db, 'patientsByPhone', normPhone);
    const indexSnap = await tx.get(indexRef);

    if (indexSnap.exists()) {
      throw new Error(`Patient with phone number ${normPhone} already exists.`);
    }

    const patientRef = doc(collection(db, 'patients'));
    const patientDocData = {
      name: data.name,
      phone: normPhone,
      age: data.age,
      bloodGroup: data.bloodGroup,
      allergies: data.allergies || [],
      createdAt: serverTimestamp(),
    };

    tx.set(patientRef, patientDocData);
    tx.set(indexRef, { patientId: patientRef.id });

    return { id: patientRef.id, ...patientDocData } as Patient;
  });
}

export async function updatePatientPhone(
  patientId: string,
  oldPhone: string,
  newPhone: string
): Promise<void> {
  const normOld = normalizePhone(oldPhone);
  const normNew = normalizePhone(newPhone);

  await runTransaction(db, async (tx) => {
    const newIndexRef = doc(db, 'patientsByPhone', normNew);
    const newIndexSnap = await tx.get(newIndexRef);
    if (newIndexSnap.exists()) {
      throw new Error(`Phone number ${normNew} is already registered to another patient.`);
    }

    const oldIndexRef = doc(db, 'patientsByPhone', normOld);
    const patientRef = doc(db, 'patients', patientId);

    tx.delete(oldIndexRef);
    tx.set(newIndexRef, { patientId });
    tx.update(patientRef, { phone: normNew });
  });
}

// -------------------------------------------------------------
// SESSIONS & VISITS
// -------------------------------------------------------------
export async function getActiveSessionByPatient(patientId: string): Promise<Session | null> {
  const q = query(
    collection(db, 'sessions'),
    where('patientId', '==', patientId),
    where('status', 'in', ['registered', 'checked_in', 'consulted', 'admitted'])
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Session;
}

export async function getSessionByOpNumber(opNumber: string): Promise<Session | null> {
  const q = query(collection(db, 'sessions'), where('opNumber', '==', opNumber));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Session;
}

export async function createSessionDoc(sessionData: Omit<Session, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'sessions'), {
    ...sessionData,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSessionStatus(
  sessionId: string,
  newStatus: 'registered' | 'checked_in' | 'consulted' | 'admitted' | 'discharged',
  doctorId?: string
): Promise<void> {
  const updates: any = { status: newStatus };
  if (newStatus === 'checked_in') updates.checkedInAt = serverTimestamp();
  if (newStatus === 'consulted') updates.consultedAt = serverTimestamp();
  if (newStatus === 'admitted') updates.admittedAt = serverTimestamp();
  if (newStatus === 'discharged') updates.dischargedAt = serverTimestamp();
  if (doctorId) updates.doctorId = doctorId;

  await updateDoc(doc(db, 'sessions', sessionId), updates);
}

// -------------------------------------------------------------
// RECORDS & FILE MANAGEMENT
// -------------------------------------------------------------
export async function getRecordsByPatient(patientId: string): Promise<MedicalRecordDoc[]> {
  const q = query(
    collection(db, 'records'),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecordDoc));
}

export async function getRecordById(recordId: string): Promise<MedicalRecordDoc | null> {
  if (!recordId) return null;
  const snap = await getDoc(doc(db, 'records', recordId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MedicalRecordDoc;
}

export async function createRecordDoc(data: Omit<MedicalRecordDoc, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'records'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRecordExplanation(
  recordId: string,
  aiExplanation: any,
  extractedText?: string,
  ocrStatus?: 'completed' | 'failed' | 'empty'
): Promise<void> {
  const ref = doc(db, 'records', recordId);
  const updatePayload: Record<string, any> = { aiExplanation };
  if (extractedText !== undefined) updatePayload.extractedText = extractedText;
  if (ocrStatus !== undefined) updatePayload.ocrStatus = ocrStatus;
  await updateDoc(ref, updatePayload);
}


// -------------------------------------------------------------
// REAL-TIME LISTENERS
// -------------------------------------------------------------
export function subscribeToHospitalSessions(
  hospitalId: string,
  onUpdate: (sessions: Session[]) => void
) {
  const q = query(
    collection(db, 'sessions'),
    where('hospitalId', '==', hospitalId),
    where('status', 'in', ['registered', 'checked_in', 'consulted', 'admitted'])
  );

  return onSnapshot(q, async (snap) => {
    const rawSessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
    
    // Resolve patient & doctor names for UI display without leaking doc IDs
    const resolved = await Promise.all(
      rawSessions.map(async (s) => {
        let patientName = 'Patient';
        let patientPhone = '';
        let doctorName = 'Unassigned';

        if (s.patientId) {
          const p = await getPatientById(s.patientId);
          if (p) {
            patientName = p.name;
            patientPhone = p.phone;
          }
        }
        if (s.doctorId) {
          const docSnap = await getDoc(doc(db, 'staff', s.doctorId));
          if (docSnap.exists()) {
            doctorName = docSnap.data().name;
          }
        }

        return {
          ...s,
          patientName,
          patientPhone,
          doctorName,
        };
      })
    );

    onUpdate(resolved);
  });
}

export function subscribeToDoctorQueue(
  hospitalId: string,
  doctorId: string,
  onUpdate: (sessions: Session[]) => void
) {
  const q = query(
    collection(db, 'sessions'),
    where('hospitalId', '==', hospitalId),
    where('doctorId', '==', doctorId),
    where('status', 'in', ['checked_in', 'consulted'])
  );

  return onSnapshot(q, async (snap) => {
    const rawSessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));

    const resolved = await Promise.all(
      rawSessions.map(async (s) => {
        let patientName = 'Patient';
        let patientPhone = '';
        if (s.patientId) {
          const p = await getPatientById(s.patientId);
          if (p) {
            patientName = p.name;
            patientPhone = p.phone;
          }
        }
        return {
          ...s,
          patientName,
          patientPhone,
        };
      })
    );

    onUpdate(resolved);
  });
}

export function subscribeToPatientRecords(
  patientId: string,
  onUpdate: (records: MedicalRecordDoc[]) => void
) {
  const q = query(
    collection(db, 'records'),
    where('patientId', '==', patientId)
  );

  return onSnapshot(
    q,
    async (snap) => {
      const rawRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecordDoc));
      
      // Resolve hospital names for UI display
      const resolved = await Promise.all(
        rawRecords.map(async (r) => {
          let hospitalName = 'Medical Center';
          if (r.hospitalId) {
            try {
              const h = await getHospitalById(r.hospitalId);
              if (h) hospitalName = h.name;
            } catch (err) {
              console.warn('[Firestore] Hospital lookup error:', err);
            }
          }
          return { ...r, hospitalName };
        })
      );

      // Sort descending by date/createdAt locally
      resolved.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });

      onUpdate(resolved);
    },
    (err) => {
      console.warn('[Firestore] subscribeToPatientRecords warning:', err);
      onUpdate([]);
    }
  );
}

export function subscribeToActivePatientSession(
  patientId: string,
  onUpdate: (session: Session | null) => void
) {
  const q = query(
    collection(db, 'sessions'),
    where('patientId', '==', patientId),
    where('status', 'in', ['registered', 'checked_in', 'consulted', 'admitted'])
  );

  return onSnapshot(
    q,
    async (snap) => {
      if (snap.empty) {
        onUpdate(null);
        return;
      }
      const docSnap = snap.docs[0];
      const s = { id: docSnap.id, ...docSnap.data() } as Session;
      
      let hospitalName = 'Hospital';
      let doctorName = 'Assigned Doctor';

      if (s.hospitalId) {
        try {
          const h = await getHospitalById(s.hospitalId);
          if (h) hospitalName = h.name;
        } catch (err) {
          console.warn('[Firestore] Hospital lookup error:', err);
        }
      }
      if (s.doctorId) {
        try {
          const dSnap = await getDoc(doc(db, 'staff', s.doctorId));
          if (dSnap.exists()) doctorName = dSnap.data().name;
        } catch (err) {
          console.warn('[Firestore] Doctor lookup error:', err);
        }
      }

      onUpdate({ ...s, hospitalName, doctorName });
    },
    (err) => {
      console.warn('[Firestore] subscribeToActivePatientSession warning:', err);
      onUpdate(null);
    }
  );
}
