import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  Staff,
  Patient,
  getStaffByAuthUid,
  getPatientByPhone,
} from '../lib/firestore';

export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'admin';

export interface UserSession {
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  id?: string;
  hospitalId?: string;
}

export interface AuthContextType {
  firebaseUser: User | null;
  currentStaff: Staff | null;
  currentPatient: Patient | null;
  user: UserSession | null;
  role: UserRole | null;
  hospitalId: string | null;
  isHospitalInactive: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginStaff: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isHospitalInactive, setIsHospitalInactive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const resolveUserRole = async (user: User | null) => {
    if (!user) {
      setCurrentStaff(null);
      setCurrentPatient(null);
      setIsHospitalInactive(false);
      setIsLoading(false);
      return;
    }

    try {
      if (user.phoneNumber) {
        // Patient logged in via Phone OTP
        const patient = await getPatientByPhone(user.phoneNumber);
        setCurrentPatient(patient);
        setCurrentStaff(null);
        setIsHospitalInactive(false);
      } else if (user.email) {
        // Staff logged in via Email/Password
        const staff = await getStaffByAuthUid(user.uid);
        if (staff) {
          if (staff.status === 'inactive') {
            await firebaseSignOut(auth);
            setCurrentStaff(null);
            setCurrentPatient(null);
            setIsHospitalInactive(false);
            throw new Error('This account has been deactivated by an administrator.');
          }
          setCurrentStaff(staff);
          setCurrentPatient(null);
        } else {
          // Check if staff record exists matching user.email without authUid set yet
          const { collection, query, where, getDocs, updateDoc, addDoc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');

          const q = query(collection(db, 'staff'), where('email', '==', user.email.toLowerCase()));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const existingDoc = snap.docs[0];
            await updateDoc(existingDoc.ref, { authUid: user.uid });
            const updatedStaff = { id: existingDoc.id, ...existingDoc.data(), authUid: user.uid } as Staff;
            setCurrentStaff(updatedStaff);
            setCurrentPatient(null);
          } else if (user.email.includes('admin') || user.email.includes('hospital')) {
            // Auto-provision initial Admin staff document
            const newStaffData: Omit<Staff, 'id'> = {
              authUid: user.uid,
              name: 'System Administrator',
              email: user.email.toLowerCase(),
              role: 'admin',
              hospitalId: 'hosp-1',
              status: 'active',
            };
            const ref = await addDoc(collection(db, 'staff'), newStaffData);
            setCurrentStaff({ id: ref.id, ...newStaffData });
            setCurrentPatient(null);
          } else {
            setCurrentStaff(null);
            setCurrentPatient(null);
          }
        }
      }
    } catch (err) {
      console.error('[AuthContext] Error resolving role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await resolveUserRole(user);
    });

    return () => unsubscribe();
  }, []);

  // Real-time tracking of hospital active status for non-admin staff members
  useEffect(() => {
    if (!currentStaff || currentStaff.role === 'admin' || !currentStaff.hospitalId) {
      setIsHospitalInactive(false);
      return;
    }

    let unsub: () => void = () => {};

    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      import('../lib/firebase').then(({ db }) => {
        unsub = onSnapshot(doc(db, 'hospitals', currentStaff.hospitalId), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setIsHospitalInactive(data.status === 'inactive');
          } else {
            setIsHospitalInactive(true);
          }
        });
      });
    });

    return () => unsub();
  }, [currentStaff]);

  const loginStaff = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await resolveUserRole(res.user);
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await firebaseSignOut(auth);
    setFirebaseUser(null);
    setCurrentStaff(null);
    setCurrentPatient(null);
    setIsHospitalInactive(false);
    setIsLoading(false);
  };

  const refreshAuth = async () => {
    if (auth.currentUser) {
      await resolveUserRole(auth.currentUser);
    }
  };

  // Derive legacy user session object for backward compatibility
  let userSession: UserSession | null = null;
  let role: UserRole | null = null;

  if (currentStaff) {
    role = currentStaff.role;
    userSession = {
      role: currentStaff.role,
      name: currentStaff.name,
      email: currentStaff.email,
      id: currentStaff.id,
      hospitalId: currentStaff.hospitalId,
    };
  } else if (currentPatient) {
    role = 'patient';
    userSession = {
      role: 'patient',
      name: currentPatient.name,
      phone: currentPatient.phone,
      id: currentPatient.id,
    };
  }

  const hospitalId = currentStaff?.hospitalId || null;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentStaff,
        currentPatient,
        user: userSession,
        role,
        hospitalId,
        isHospitalInactive,
        isLoading,
        isAuthenticated: !!firebaseUser,
        loginStaff,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

