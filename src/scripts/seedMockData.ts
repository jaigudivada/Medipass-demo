import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const MOCK_DATA = {
  hospitals: [
    {
      id: 'apollo_hosp_001',
      name: 'Apollo Health City',
      address: '123 Health Street, Hyderabad',
      contactNumber: '+91 9876543210',
      email: 'contact@apollohealth.in',
      departments: ['General Medicine', 'Cardiology', 'Orthopedics'],
      status: 'active',
    },
    {
      id: 'fortis_hosp_002',
      name: 'Fortis Healthcare',
      address: '456 Hospital Road, Hyderabad',
      contactNumber: '+91 9876543211',
      email: 'contact@fortis.in',
      departments: ['Pediatrics', 'Gastroenterology', 'Neurology'],
      status: 'active',
    },
  ],

  users: [
    {
      role: 'admin',
      email: 'admin@medipass.demo',
      password: 'MediPass@123Main',
      name: 'Super Main Admin',
      status: 'active',
    },
    {
      role: 'admin',
      email: 'admin@apollo.demo',
      password: 'MediPass@123HospAdmin',
      name: 'Apollo Hospital Admin',
      hospitalId: 'apollo_hosp_001',
      status: 'active',
    },
    {
      role: 'admin',
      email: 'admin@fortis.demo',
      password: 'MediPass@123HospAdmin',
      name: 'Fortis Hospital Admin',
      hospitalId: 'fortis_hosp_002',
      status: 'active',
    },
    {
      role: 'doctor',
      email: 'dr.rajesh@apollo.demo',
      password: 'MediPass@123Doctor',
      name: 'Dr. Rajesh Kumar',
      hospitalId: 'apollo_hosp_001',
      specialty: 'Cardiology',
      status: 'active',
    },
    {
      role: 'doctor',
      email: 'dr.priya@fortis.demo',
      password: 'MediPass@123Doctor',
      name: 'Dr. Priya Sharma',
      hospitalId: 'fortis_hosp_002',
      specialty: 'Pediatrics',
      status: 'active',
    },
    {
      role: 'receptionist',
      email: 'priya@apollo.demo',
      password: 'MediPass@123Recep',
      name: 'Priya Johnson',
      hospitalId: 'apollo_hosp_001',
      department: 'Reception',
      status: 'active',
    },
    {
      role: 'receptionist',
      email: 'rahul@fortis.demo',
      password: 'MediPass@123Recep',
      name: 'Rahul Verma',
      hospitalId: 'fortis_hosp_002',
      department: 'Reception',
      status: 'active',
    },
  ],

  patients: [
    {
      patientId: 'patient_001',
      name: 'Jai Gudivada',
      phone: '+919876543212',
      email: 'patient@medipass.demo',
      password: 'MediPass@123Patient',
      age: 28,
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
    },
    {
      patientId: 'patient_002',
      name: 'Divya Menon',
      phone: '+919876543213',
      age: 35,
      bloodGroup: 'A+',
      allergies: ['Aspirin'],
    },
    {
      patientId: 'patient_003',
      name: 'Arjun Singh',
      phone: '+919876543214',
      age: 42,
      bloodGroup: 'B+',
      allergies: [],
    },
  ],
};

export async function seedDemoDataToFirestore() {
  console.log('🌱 Starting mock data seed...');

  try {
    // 1. Create hospitals
    for (const hospital of MOCK_DATA.hospitals) {
      await setDoc(
        doc(db, 'hospitals', hospital.id),
        {
          ...hospital,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`   ✓ Hospital: ${hospital.name}`);
    }

    // 2. Create staff users in Firestore
    for (const u of MOCK_DATA.users) {
      let uid = `demo_uid_${u.email.replace(/[@.]/g, '_')}`;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, u.email, u.password);
        uid = userCred.user.uid;
        await signOut(auth);
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          try {
            const userCred = await signInWithEmailAndPassword(auth, u.email, u.password);
            uid = userCred.user.uid;
            await signOut(auth);
          } catch (loginErr) {
            console.warn(`Could not login existing user ${u.email}`);
          }
        }
      }

      const staffDocData: any = {
        authUid: uid,
        name: u.name,
        email: u.email.toLowerCase(),
        role: u.role,
        status: u.status,
        createdAt: new Date().toISOString(),
      };
      if (u.hospitalId) staffDocData.hospitalId = u.hospitalId;
      if (u.specialty) staffDocData.specialty = u.specialty;
      if (u.department) staffDocData.department = u.department;

      const staffDocRef = doc(db, 'staff', uid);
      await setDoc(staffDocRef, staffDocData, { merge: true });
      console.log(`   ✓ Staff user: ${u.name} (${u.role})`);
    }

    // 3. Create patients
    for (const p of MOCK_DATA.patients) {
      await setDoc(
        doc(db, 'patients', p.patientId),
        {
          id: p.patientId,
          name: p.name,
          phone: p.phone,
          age: p.age,
          bloodGroup: p.bloodGroup,
          allergies: p.allergies,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, 'patientsByPhone', p.phone),
        { patientId: p.patientId },
        { merge: true }
      );
      console.log(`   ✓ Patient: ${p.name}`);
    }

    console.log('✅ Mock data seed complete!');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
}

// Execute if run directly via Node/ts-node
if (typeof require !== 'undefined' && require.main === module) {
  seedDemoDataToFirestore();
}
