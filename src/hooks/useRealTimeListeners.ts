import { useEffect, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ListenerConfig<T = any> {
  collectionName: string;
  constraints: QueryConstraint[];
  onData: (data: T[]) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export const useRealTimeListener = <T = any>({
  collectionName,
  constraints,
  onData,
  onError,
  enabled = true,
}: ListenerConfig<T>) => {
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onDataRef.current = onData;
    onErrorRef.current = onError;
  }, [onData, onError]);

  useEffect(() => {
    if (!enabled) return;

    let unsubscribe: Unsubscribe | null = null;
    try {
      const q = query(collection(db, collectionName), ...constraints);

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          onDataRef.current(data);
        },
        (error) => {
          console.error(`[RealTimeListener] Error on ${collectionName}:`, error);
          onErrorRef.current?.(error);
        }
      );
    } catch (error) {
      console.error(`[RealTimeListener] Failed to initialize ${collectionName}:`, error);
      onErrorRef.current?.(error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, enabled, JSON.stringify(constraints.map((c) => c.toString?.() || ''))]);
};

// ---------------------------------------------------------------------------
// Typed Real-Time Hooks
// ---------------------------------------------------------------------------

/**
 * Real-Time Listener for a single hospital document
 */
export const useHospitalDocumentListener = (
  hospitalId: string | null | undefined,
  onData: (hospital: any | null) => void
) => {
  const onDataRef = useRef(onData);

  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    if (!hospitalId) {
      onDataRef.current(null);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'hospitals', hospitalId),
      (snap) => {
        if (snap.exists()) {
          onDataRef.current({ id: snap.id, ...snap.data() });
        } else {
          onDataRef.current(null);
        }
      },
      (err) => {
        console.error('[useHospitalDocumentListener] Error:', err);
        onDataRef.current(null);
      }
    );

    return () => unsub();
  }, [hospitalId]);
};

/**
 * Main Admin: Listen to all hospitals in real-time
 */
export const useHospitalListListener = (
  onData: (hospitals: any[]) => void,
  onError?: (err: any) => void
) => {
  useRealTimeListener({
    collectionName: 'hospitals',
    constraints: [],
    onData,
    onError,
    enabled: true,
  });
};

/**
 * Hospital Admin: Listen to staff roster at their assigned hospital in real-time
 */
export const useHospitalStaffListener = (
  hospitalId: string | null | undefined,
  onData: (staffList: any[]) => void,
  onError?: (err: any) => void
) => {
  useRealTimeListener({
    collectionName: 'staff',
    constraints: hospitalId ? [where('hospitalId', '==', hospitalId)] : [],
    onData,
    onError,
    enabled: !!hospitalId,
  });
};

/**
 * Receptionist & Admin: Listen to active hospital sessions (registered, checked_in, consulted, discharged)
 */
export const useHospitalSessionsListener = (
  hospitalId: string | null | undefined,
  onData: (sessions: any[]) => void,
  onError?: (err: any) => void
) => {
  useRealTimeListener({
    collectionName: 'sessions',
    constraints: hospitalId ? [where('hospitalId', '==', hospitalId)] : [],
    onData,
    onError,
    enabled: !!hospitalId,
  });
};

/**
 * Doctor: Listen to real-time patient queue assigned to doctor
 */
export const useDoctorQueueListener = (
  doctorId: string | null | undefined,
  onData: (queue: any[]) => void,
  onError?: (err: any) => void
) => {
  useRealTimeListener({
    collectionName: 'sessions',
    constraints: doctorId ? [where('doctorId', '==', doctorId)] : [],
    onData,
    onError,
    enabled: !!doctorId,
  });
};

/**
 * Patient: Listen to active visit status in real-time
 */
export const usePatientSessionsListener = (
  patientId: string | null | undefined,
  onData: (sessions: any[]) => void,
  onError?: (err: any) => void
) => {
  useRealTimeListener({
    collectionName: 'sessions',
    constraints: patientId ? [where('patientId', '==', patientId)] : [],
    onData,
    onError,
    enabled: !!patientId,
  });
};

/**
 * Patient & Doctor: Listen to patient's medical records timeline in real-time
 */
export const usePatientRecordsListener = (
  patientId: string | null | undefined,
  onData: (records: any[]) => void,
  onError?: (err: any) => void
) => {
  useRealTimeListener({
    collectionName: 'records',
    constraints: patientId ? [where('patientId', '==', patientId)] : [],
    onData,
    onError,
    enabled: !!patientId,
  });
};
