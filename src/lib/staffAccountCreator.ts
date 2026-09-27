import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  signOut,
} from 'firebase/auth';
import { firebaseConfig } from './firebase';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const CREATOR_APP_NAME = 'staff-account-creator';

/**
 * Creates or updates a staff member and their Firebase Auth credentials
 * using an isolated secondary Firebase App instance.
 *
 * If editing an existing staff member (id is provided), updates their Firestore doc
 * and provisions/updates their Firebase Auth account if a password is supplied.
 */
export async function saveStaffAccount(data: {
  id?: string | null;
  name: string;
  email: string;
  password?: string;
  role: 'doctor' | 'receptionist' | 'admin' | 'main_admin' | 'hospital_admin';
  hospitalId: string;
  specialty?: string;
  department?: string;
}): Promise<string> {
  let creatorApp = getApps().find((a) => a.name === CREATOR_APP_NAME);
  if (!creatorApp) {
    creatorApp = initializeApp(firebaseConfig, CREATOR_APP_NAME);
  }

  const creatorAuth = getAuth(creatorApp);
  let newUid: string | null = null;

  try {
    if (data.password && data.password.trim().length >= 6) {
      try {
        const credential = await createUserWithEmailAndPassword(
          creatorAuth,
          data.email.trim(),
          data.password
        );
        newUid = credential.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          // Auth user already exists for this email
        } else {
          throw authErr;
        }
      }
    }

    const staffPayload: Record<string, any> = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      hospitalId: data.hospitalId,
      status: 'active',
    };

    if (newUid) {
      staffPayload.authUid = newUid;
    }

    if (data.specialty !== undefined) {
      staffPayload.specialty = data.specialty.trim();
    }
    if (data.department !== undefined) {
      staffPayload.department = data.department.trim();
    }

    if (data.id) {
      const docRef = doc(db, 'staff', data.id);
      await updateDoc(docRef, staffPayload);
      return data.id;
    } else {
      staffPayload.createdAt = serverTimestamp();
      const ref = await addDoc(collection(db, 'staff'), staffPayload);
      return ref.id;
    }
  } finally {
    try {
      await signOut(creatorAuth);
    } catch {
      // ignore
    }
  }
}

export async function createStaffAccount(data: {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'receptionist' | 'admin' | 'main_admin' | 'hospital_admin';
  hospitalId: string;
  specialty?: string;
  department?: string;
}): Promise<string> {
  return saveStaffAccount(data);
}

