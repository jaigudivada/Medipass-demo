import { runTransaction, doc } from 'firebase/firestore';
import { db } from './firebase';

export async function generateTransactionalOpNumber(
  hospitalId: string,
  hospitalName: string
): Promise<string> {
  // Derive prefix from hospital name (e.g., "Apollo Specialty" -> "APO")
  const words = hospitalName.trim().split(/\s+/);
  let prefix = 'HOSP';
  if (words.length >= 2) {
    prefix = (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 3) {
    prefix = words[0].substring(0, 3).toUpperCase();
  }

  // YYMMDD timestamp string
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  return await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, 'hospitals', hospitalId, 'counters', 'opCounter');
    const counterSnap = await transaction.get(counterRef);

    let nextSequence = 1;
    if (counterSnap.exists()) {
      const data = counterSnap.data();
      nextSequence = (data.lastSequence || 0) + 1;
    }

    transaction.set(counterRef, { lastSequence: nextSequence }, { merge: true });

    const paddedSeq = String(nextSequence).padStart(3, '0');
    const opNumber = `${prefix}-${dateStr}-${paddedSeq}`;

    return opNumber;
  });
}
