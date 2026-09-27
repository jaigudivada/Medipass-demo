# MediPass — Complete User Hierarchy, Demo Credentials & Real-Time Workflow Plan
**Production-Ready Implementation for Multi-Level Admin System**

---

## Part 1: User Hierarchy & Permissions Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEDIPASS USER HIERARCHY                      │
└─────────────────────────────────────────────────────────────────┘

                          MAIN ADMIN (Super Admin)
                                  │
                    Can: Create hospitals, Create hospital admins
                    Cannot: Manage staff, Check in patients
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              HOSPITAL 1                   HOSPITAL 2
         Hospital Admin Panel           Hospital Admin Panel
                    │                           │
         Can: Add/remove doctors,      Can: Add/remove doctors,
         Add/remove receptionists,    Add/remove receptionists,
         Manage patients in hospital  Manage patients in hospital
                    │                           │
        ┌───────────┼───────────┐      ┌───────────┼───────────┐
        │           │           │      │           │           │
     DOCTOR    RECEPTIONIST  PATIENT DOCTOR   RECEPTIONIST  PATIENT
   (Hospital 1)              (Hosp 1) (Hosp 2)              (Hosp 2)
        │           │           │      │           │           │
   Can:View queue   Can:Check in Can:View own  Can:View queue Can:Check in Can:View own
   Consult patients Register    records      Consult patients Register   records
   Access Hindsight patients    Download     Access Hindsight patients   Download
   memory           Upload docs  docs        memory           Upload docs docs
                    Manage docs


FIRESTORE COLLECTIONS STRUCTURE:

users/
  - userId (Firebase Auth UID)
  - email
  - role: 'main_admin' | 'hospital_admin' | 'doctor' | 'receptionist' | 'patient'
  - assignedHospitalId: (for hospital_admin, doctor, receptionist)
  - createdAt
  - status: 'active' | 'inactive'

hospitals/
  - hospitalId
  - name
  - address
  - contactNumber
  - email
  - departments: string[]
  - hospitalAdminId: reference to users/{hospitalAdminId}
  - createdBy: main_admin_id
  - status: 'active' | 'inactive'
  - createdAt

staff/ (Doctor + Receptionist unified)
  - staffId
  - authUid: Firebase Auth UID
  - name
  - email
  - role: 'doctor' | 'receptionist'
  - hospitalId: reference to hospitals/{hospitalId}
  - specialty: (doctors only)
  - department: (receptionists only)
  - status: 'active' | 'inactive'
  - createdBy: hospital_admin_id
  - createdAt

patients/
  - patientId (auto-generated, NOT phone)
  - name
  - phone (mutable, unique via patientsByPhone)
  - age
  - bloodGroup
  - allergies: string[]
  - createdAt

patientsByPhone/
  - {phone}: patientId (uniqueness index)

sessions/
  - sessionId
  - patientId
  - hospitalId
  - doctorId
  - opNumber: string (APO-260927-001)
  - status: 'registered' | 'checked_in' | 'consulted' | 'discharged'
  - createdAt

records/
  - recordId
  - patientId
  - sessionId
  - hospitalId
  - uploadedByStaffId
  - type: 'prescription' | 'lab_report' | 'imaging_report' | 'discharge_summary'
  - sourceFileUrl
  - ocr: { extractedText, status, confidence }
  - explanation: { summary, keyFindings, patientGuidance, confidence }
  - createdAt
```

---

## Part 2: Demo Credentials System

### Feature: "Try Demo" Button on Login Page

**Design:** Small floating button on LoginPage that shows modal with pre-filled demo credentials.

```
┌─────────────────────────────────────────────────┐
│  LOGIN PAGE                                     │
│                                                 │
│  [Try Demo ▼] (dropdown button, top-right)      │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ DEMO ACCOUNTS (Dropdown Menu):           │   │
│  ├──────────────────────────────────────────┤   │
│  │ 👨‍💼 Main Admin                            │   │
│  │ 👨‍⚕️  Doctor (Apollo Hospital)            │  │
│  │ 👩‍💻 Receptionist (Apollo Hospital)          │  │
│  │ 👤  Hospital Admin (Fortis Healthcare)   │  │
│  │ 🧑‍🦰 Patient (Demo Patient)                 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Email:    admin@medipass.demo                │
│  Password: ••••••••                           │
│  [Copy to Clipboard] [Login with Demo]       │
└─────────────────────────────────────────────────┘
```

### File: `src/components/DemoCredentialsButton.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const DEMO_ACCOUNTS = {
  main_admin: {
    name: 'Main Admin',
    email: 'admin@medipass.demo',
    password: 'MediPass@123Main',
    role: 'main_admin',
    description: 'Can create hospitals and hospital admins',
  },
  doctor_apollo: {
    name: 'Dr. Rajesh (Apollo Hospital)',
    email: 'dr.rajesh@apollo.demo',
    password: 'MediPass@123Doctor',
    role: 'doctor',
    hospitalId: 'apollo_hosp_001',
    description: 'Can view queue and consult patients',
  },
  receptionist_apollo: {
    name: 'Priya (Apollo Receptionist)',
    email: 'priya@apollo.demo',
    password: 'MediPass@123Recep',
    role: 'receptionist',
    hospitalId: 'apollo_hosp_001',
    description: 'Can check in patients and upload documents',
  },
  hospital_admin_fortis: {
    name: 'Admin Fortis Healthcare',
    email: 'admin@fortis.demo',
    password: 'MediPass@123HospAdmin',
    role: 'hospital_admin',
    hospitalId: 'fortis_hosp_002',
    description: 'Can manage staff and patients at Fortis',
  },
  patient: {
    name: 'Jai Gudivada (Patient)',
    email: 'patient@medipass.demo',
    password: 'MediPass@123Patient',
    role: 'patient',
    description: 'Can view personal health records',
  },
};

export const DemoCredentialsButton: React.FC<{
  onSelectDemo: (credentials: any) => void;
}> = ({ onSelectDemo }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyToClipboard = (email: string, password: string) => {
    const text = `Email: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(email);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelectDemo = (account: any) => {
    onSelectDemo(account);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 gap-2"
        >
          🎭 Try Demo
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Quick Demo Accounts
          </p>

          {Object.entries(DEMO_ACCOUNTS).map(([key, account]: any) => (
            <div
              key={key}
              className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition"
              onClick={() => handleSelectDemo(account)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{account.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {account.role.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                {account.description}
              </p>

              <div className="bg-gray-100 rounded p-2 mb-2 text-xs">
                <div>Email: {account.email}</div>
                <div>Password: {account.password}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyToClipboard(account.email, account.password);
                  }}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  {copied === account.email ? '✓ Copied' : 'Copy'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDemo(account);
                  }}
                  className="text-xs px-2 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded ml-auto"
                >
                  Fill & Login →
                </button>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### File: `src/pages/LoginPage.tsx` (Updated)

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DemoCredentialsButton } from '../components/DemoCredentialsButton';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'patient'>('staff');
  const [error, setError] = useState('');
  const { loginStaff, loginPatient } = useAuth();
  const navigate = useNavigate();

  const handleDemoSelect = (credentials: any) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setRole(credentials.role === 'patient' ? 'patient' : 'staff');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (role === 'patient') {
        await loginPatient(email);  // Phone-based for patients
      } else {
        await loginStaff(email, password);  // Email/password for staff
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <DemoCredentialsButton onSelectDemo={handleDemoSelect} />

      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">MediPass</h1>
          <p className="text-gray-600 mt-2">Portable Health Passport</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRole('staff')}
            className={`flex-1 py-2 rounded font-medium transition ${
              role === 'staff'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Staff Login
          </button>
          <button
            onClick={() => setRole('patient')}
            className={`flex-1 py-2 rounded font-medium transition ${
              role === 'patient'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Patient Login
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {role === 'patient' ? 'Phone Number' : 'Email'}
            </label>
            <input
              type={role === 'patient' ? 'tel' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'patient' ? '+91 XXXXX XXXXX' : 'you@example.com'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {role === 'staff' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {role === 'patient' ? 'Send OTP' : 'Login'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          💡 Tip: Click "Try Demo" button to auto-fill test credentials
        </p>
      </div>
    </div>
  );
};
```

---

## Part 3: Mock Data Seed

### File: `src/scripts/seedMockData.ts`

```typescript
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Run this ONCE to seed mock data.
 * Command: node -r ts-node/register src/scripts/seedMockData.ts
 */

const MOCK_DATA = {
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
      role: 'main_admin',
      email: 'admin@medipass.demo',
      password: 'MediPass@123Main',
      name: 'Main Admin',
      status: 'active',
    },
    {
      role: 'hospital_admin',
      email: 'admin@apollo.demo',
      password: 'MediPass@123HospAdmin',
      name: 'Apollo Hospital Admin',
      hospitalId: 'apollo_hosp_001',
      status: 'active',
    },
    {
      role: 'hospital_admin',
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
    {
      role: 'patient',
      email: 'patient@medipass.demo',
      password: 'MediPass@123Patient',
      name: 'Jai Gudivada',
      phone: '+919876543212',
      age: 28,
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      status: 'active',
    },
  ],

  patients: [
    {
      patientId: 'patient_001',
      name: 'Jai Gudivada',
      phone: '+919876543212',
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

async function seedData() {
  console.log('🌱 Starting mock data seed...\n');

  try {
    // 1. Create hospitals
    console.log('📍 Seeding hospitals...');
    for (const hospital of MOCK_DATA.hospitals) {
      await setDoc(doc(db, 'hospitals', hospital.id), {
        ...hospital,
        createdAt: new Date(),
      });
      console.log(`   ✓ Created hospital: ${hospital.name}`);
    }

    // 2. Create users (Firebase Auth + Firestore)
    console.log('\n👥 Seeding users...');
    for (const user of MOCK_DATA.users) {
      try {
        const authUser = await createUserWithEmailAndPassword(
          auth,
          user.email,
          user.password
        );

        const userData: any = {
          uid: authUser.user.uid,
          email: user.email,
          role: user.role,
          name: user.name,
          status: user.status,
          createdAt: new Date(),
        };

        if (user.hospitalId) userData.hospitalId = user.hospitalId;
        if (user.specialty) userData.specialty = user.specialty;
        if (user.department) userData.department = user.department;

        await setDoc(doc(db, 'users', authUser.user.uid), userData);

        console.log(`   ✓ Created user: ${user.email} (${user.role})`);
        await signOut(auth);
      } catch (err: any) {
        console.log(
          `   ⚠ User ${user.email} might already exist: ${err.message}`
        );
      }
    }

    // 3. Create patients
    console.log('\n🧑‍🤝 Seeding patients...');
    for (const patient of MOCK_DATA.patients) {
      await setDoc(doc(db, 'patients', patient.patientId), {
        ...patient,
        createdAt: new Date(),
      });

      // Create phone index
      await setDoc(
        doc(db, 'patientsByPhone', patient.phone),
        { patientId: patient.patientId }
      );

      console.log(`   ✓ Created patient: ${patient.name}`);
    }

    console.log('\n✅ Mock data seed complete!');
    console.log('\nDemo Credentials:');
    console.log('─'.repeat(50));
    MOCK_DATA.users.forEach((user) => {
      console.log(`\n${user.role.toUpperCase()}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });
    console.log('─'.repeat(50));
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData();
```

**Run mock data seed:**
```bash
npm run seed
```

Add to `package.json`:
```json
{
  "scripts": {
    "seed": "ts-node src/scripts/seedMockData.ts"
  }
}
```

---

## Part 4: Real-Time Workflow Architecture

### Workflow Diagram (ASCII Canvas)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      MEDIPASS REAL-TIME WORKFLOW                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: MAIN ADMIN PANEL                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Main Admin Dashboard]                                                       │
│    └─ View all hospitals (real-time stats)                                   │
│       ├─ Hospital 1 (Apollo): 2 active admins, 5 doctors, 20 patients       │
│       ├─ Hospital 2 (Fortis): 1 active admin, 3 doctors, 15 patients       │
│       └─ [+ Add New Hospital] Button                                         │
│                                                                               │
│  [Create Hospital Workflow]                                                   │
│    ├─ Form: Name, Address, Contact, Departments                            │
│    ├─ Auto-generate hospital admin account                                 │
│    ├─ Store in Firestore: hospitals/{hospitalId}                          │
│    └─ Email hospital admin with login credentials                          │
│                                                                               │
│  [Create Hospital Admin Workflow]                                            │
│    ├─ Select hospital from dropdown                                        │
│    ├─ Form: Name, Email, Password                                         │
│    ├─ Create Firebase Auth user                                           │
│    ├─ Store in Firestore: users/{uid}                                     │
│    │   {role: 'hospital_admin', hospitalId: 'apollo_hosp_001'}           │
│    └─ Real-time listener: Listen to new hospital_admin creations          │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: HOSPITAL ADMIN PANEL                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Hospital Dashboard - Real-Time Stats]                                      │
│    ├─ Hospital Name: Apollo Health City                                     │
│    ├─ Active Doctors: 5 (real-time count)                                   │
│    ├─ Active Receptionists: 3 (real-time count)                            │
│    ├─ Today's Patients: 12 (real-time count)                               │
│    └─ Listener: Firestore onSnapshot on staff/ where hospitalId == 'X'     │
│                                                                               │
│  [Manage Doctors Tab]                                                        │
│    ├─ List: All doctors at this hospital (real-time)                       │
│    │   ├─ Dr. Rajesh (Cardiology) - Status: Active                         │
│    │   ├─ Dr. Anita (Orthopedics) - Status: Active                         │
│    │   └─ [+ Add New Doctor]                                               │
│    │                                                                         │
│    ├─ [Add Doctor Workflow]                                                │
│    │   ├─ Form: Name, Email, Password, Specialty                          │
│    │   ├─ Create Firebase Auth user (email/password)                      │
│    │   ├─ Create Firestore doc: staff/{staffId}                           │
│    │   │   {authUid, role: 'doctor', hospitalId, specialty}              │
│    │   ├─ Real-time update: All hospital admins see new doctor            │
│    │   └─ Email doctor with login credentials                            │
│    │                                                                         │
│    └─ [Edit Doctor Status]                                                 │
│        ├─ Click Active/Inactive toggle                                     │
│        ├─ Update staff/{staffId} status field                              │
│        └─ Real-time listener updates immediately                           │
│                                                                               │
│  [Manage Receptionists Tab]                                                  │
│    ├─ (Same workflow as doctors)                                            │
│    ├─ Form includes: Name, Email, Password, Department                    │
│    └─ Listener: onSnapshot on staff/ where hospitalId == 'X'              │
│                                                                               │
│  [Manage Patients Tab]                                                       │
│    ├─ List: All patients checked in at this hospital (today)               │
│    │   ├─ Jai Gudivada - OP #APO-260927-001 - Status: Consulted           │
│    │   ├─ Divya Menon - OP #APO-260927-002 - Status: Checked In           │
│    │   └─ Arjun Singh - OP #APO-260927-003 - Status: Registered           │
│    │                                                                         │
│    ├─ Search Patient: By name, phone, OP number                            │
│    │   ├─ Query: patients/ where name LIKE 'X'                             │
│    │   └─ Results show: Name, Phone, Age, Blood Group, Allergies          │
│    │                                                                         │
│    └─ Listener: onSnapshot on sessions/ where hospitalId == 'X'            │
│        └─ Real-time queue updates                                           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: RECEPTIONIST PANEL                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Check-In Workflow] (Real-Time)                                             │
│    ├─ Step 1: Receptionist enters patient phone number                    │
│    ├─ Step 2: System queries patientsByPhone/{phone}                      │
│    │   ├─ If exists: Load patient details (name, age, allergies)          │
│    │   └─ If new: Show inline registration form                           │
│    ├─ Step 3: Select doctor from dropdown (hospital staff list)           │
│    │   └─ Listener: Real-time staff list filtered to this hospital       │
│    ├─ Step 4: Generate OP number (transactional: APO-260927-001)         │
│    ├─ Step 5: Create session doc:                                         │
│    │   {patientId, hospitalId, doctorId, opNumber, status: 'checked_in'} │
│    └─ Real-time result: Doctor's queue updates instantly                 │
│                                                                               │
│  [Upload Documents Workflow] (Real-Time)                                     │
│    ├─ Step 1: Select patient from active queue                            │
│    ├─ Step 2: Select document category (prescription, lab, etc.)         │
│    ├─ Step 3: Upload file                                                │
│    ├─ Step 4: Tesseract OCR (client-side)                                │
│    ├─ Step 5: Groq AI analysis                                           │
│    ├─ Step 6: Store in Firestore: records/{recordId}                    │
│    │   {patientId, sessionId, ocr, explanation}                        │
│    └─ Real-time result: Patient dashboard updates instantly              │
│                                                                               │
│  [Queue Management] (Real-Time)                                              │
│    ├─ View: All active sessions for this hospital (real-time)            │
│    ├─ Listener: onSnapshot on sessions/ where hospitalId == 'X'          │
│    ├─ Shows: Patient name, OP number, Check-in time, Doctor assigned    │
│    └─ Actions: Mark checked_in, assign doctor, move to next             │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 4: DOCTOR PANEL                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Doctor Queue] (Real-Time)                                                  │
│    ├─ Listener: onSnapshot on sessions/ where doctorId == X               │
│    ├─ Shows: List of assigned patients, status, time waiting              │
│    │   ├─ Jai Gudivada - OP #001 - Waiting: 5 min - [View]              │
│    │   ├─ Divya Menon - OP #002 - Waiting: 12 min - [View]             │
│    │   └─ Arjun Singh - OP #003 - Waiting: 1 min - [View]              │
│    └─ Click patient → Open Patient Detail Panel                           │
│                                                                               │
│  [Patient Detail Panel] (Real-Time)                                          │
│    ├─ Patient info: Name, Age, Blood Group, Allergies                    │
│    ├─ Medical history: Past conditions, medications                      │
│    ├─ Hindsight memory: Agent suggestions based on past visits           │
│    ├─ Today's records: All uploaded documents (OCR + Groq summary)      │
│    ├─ Action: [Start Consultation]                                       │
│    │   └─ Update session status: 'checked_in' → 'consulted'             │
│    │   └─ Real-time listener notifies receptionist queue                │
│    └─ Action: [End Consultation]                                         │
│        └─ Mark as 'discharged'                                           │
│        └─ Real-time listener notifies receptionist                       │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 5: PATIENT PANEL                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Patient Dashboard] (Real-Time)                                             │
│    ├─ Current visit: Status badge (Registered / Checked In / Consulted)  │
│    ├─ OP number, doctor assigned, time waiting                           │
│    ├─ Medical records timeline (all past visits)                         │
│    ├─ Listener: onSnapshot on sessions/ where patientId == X             │
│    ├─ Listener: onSnapshot on records/ where patientId == X              │
│    └─ Shows: Uploaded documents with AI-generated summaries             │
│                                                                               │
│  [View Personal Records]                                                     │
│    ├─ Timeline of all past visits                                        │
│    ├─ Each visit shows: Date, doctor, chief complaint, diagnosis        │
│    ├─ For each visit: Link to uploaded documents                        │
│    ├─ Documents show: Original file + AI summary (not raw OCR)         │
│    └─ Download: Original documents                                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║                        REAL-TIME LISTENERS SUMMARY                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║ Main Admin:          onSnapshot(hospitals/)                                 ║
║ Hospital Admin:      onSnapshot(staff/ where hospitalId == X)              ║
║                      onSnapshot(sessions/ where hospitalId == X)           ║
║ Receptionist:        onSnapshot(sessions/ where hospitalId == X)          ║
║                      onSnapshot(staff/ where hospitalId == X)              ║
║ Doctor:              onSnapshot(sessions/ where doctorId == X)            ║
║                      onSnapshot(records/ where sessionId == X)             ║
║ Patient:             onSnapshot(sessions/ where patientId == X)           ║
║                      onSnapshot(records/ where patientId == X)             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 5: Real-Time Listener Implementation

### File: `src/hooks/useRealTimeListeners.ts`

```typescript
import { useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ListenerConfig {
  collectionName: string;
  constraints: QueryConstraint[];
  onData: (data: any[]) => void;
  onError?: (error: any) => void;
}

export const useRealTimeListener = ({
  collectionName,
  constraints,
  onData,
  onError,
}: ListenerConfig) => {
  useEffect(() => {
    try {
      const q = query(collection(db, collectionName), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          onData(data);
        },
        (error) => {
          console.error(`Listener error on ${collectionName}:`, error);
          onError?.(error);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error(`Failed to set up listener for ${collectionName}:`, error);
      onError?.(error);
    }
  }, [collectionName, constraints, onData, onError]);
};

// Usage examples:
// ─────────────

// Hospital Admin: Listen to staff at their hospital
export const useHospitalStaffListener = (hospitalId: string, onData: any) => {
  return useRealTimeListener({
    collectionName: 'staff',
    constraints: [where('hospitalId', '==', hospitalId)],
    onData,
  });
};

// Receptionist: Listen to sessions at their hospital
export const useHospitalSessionsListener = (hospitalId: string, onData: any) => {
  return useRealTimeListener({
    collectionName: 'sessions',
    constraints: [where('hospitalId', '==', hospitalId)],
    onData,
  });
};

// Doctor: Listen to their assigned patients queue
export const useDoctorQueueListener = (doctorId: string, onData: any) => {
  return useRealTimeListener({
    collectionName: 'sessions',
    constraints: [where('doctorId', '==', doctorId)],
    onData,
  });
};

// Patient: Listen to their own sessions and records
export const usePatientSessionsListener = (patientId: string, onData: any) => {
  return useRealTimeListener({
    collectionName: 'sessions',
    constraints: [where('patientId', '==', patientId)],
    onData,
  });
};

export const usePatientRecordsListener = (patientId: string, onData: any) => {
  return useRealTimeListener({
    collectionName: 'records',
    constraints: [where('patientId', '==', patientId)],
    onData,
  });
};
```

---

## Part 6: Firestore Security Rules (Updated for Hierarchy)

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuth() { return request.auth != null; }
    
    function getUser() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function getUserRole() { return getUser().role; }
    function getUserHospitalId() { return getUser().hospitalId; }
    
    // Hospitals: readable by all authenticated; writable by main_admin only
    match /hospitals/{hospitalId} {
      allow read: if isAuth();
      allow write: if isAuth() && getUserRole() == 'main_admin';
    }
    
    // Users: Each user can read their own; main_admin and hospital_admin see their scope
    match /users/{userId} {
      allow read: if isAuth() && (
        request.auth.uid == userId ||
        getUserRole() == 'main_admin' ||
        (getUserRole() == 'hospital_admin' && 
         (get(/databases/$(database)/documents/users/$(userId)).data.hospitalId == getUserHospitalId() ||
          userId == request.auth.uid))
      );
      
      allow create: if isAuth() && (
        (getUserRole() == 'main_admin') ||
        (getUserRole() == 'hospital_admin' && 
         request.resource.data.hospitalId == getUserHospitalId())
      );
    }
    
    // Staff: filtered by hospital
    match /staff/{staffId} {
      allow read: if isAuth() && (
        resource.data.hospitalId == getUserHospitalId() ||
        getUserRole() == 'main_admin'
      );
      
      allow create, update: if isAuth() && (
        (getUserRole() == 'hospital_admin' && 
         request.resource.data.hospitalId == getUserHospitalId())
      );
    }
    
    // Patients: hospital admins and staff can see if checked in at their hospital
    match /patients/{patientId} {
      allow read: if isAuth();
      allow create: if isAuth() && getUserRole() == 'receptionist';
    }
    
    // Sessions: hospital-scoped access
    match /sessions/{sessionId} {
      allow read: if isAuth() && (
        resource.data.hospitalId == getUserHospitalId() ||
        request.auth.phoneNumber == get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.phone
      );
      
      allow create: if isAuth() && getUserRole() == 'receptionist';
    }
    
    // Records: hospital-scoped + patient-only explanation
    match /records/{recordId} {
      allow read: if isAuth() && (
        resource.data.hospitalId == getUserHospitalId() ||
        request.auth.phoneNumber == get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.phone
      );
      
      allow create: if isAuth() && getUserRole() == 'receptionist';
    }
  }
}
```

---

## Part 7: Component Structure

```
src/
  ├── pages/
  │   ├── LoginPage.tsx (with DemoCredentialsButton)
  │   ├── admin/
  │   │   ├── MainAdminDashboard.tsx
  │   │   │   ├── HospitalsTab.tsx
  │   │   │   ├── CreateHospitalModal.tsx
  │   │   │   └── CreateHospitalAdminModal.tsx
  │   │   │
  │   │   └── HospitalAdminDashboard.tsx
  │   │       ├── StaffTab.tsx
  │   │       │   ├── DoctorsList.tsx (real-time)
  │   │       │   ├── AddDoctorModal.tsx
  │   │       │   ├── ReceptionistsList.tsx (real-time)
  │   │       │   └── AddReceptionistModal.tsx
  │   │       │
  │   │       ├── PatientsTab.tsx (real-time)
  │   │       │   ├── PatientSearchBar.tsx
  │   │       │   ├── PatientList.tsx
  │   │       │   └── PatientDetailsPanel.tsx
  │   │       │
  │   │       └── DashboardStats.tsx (real-time counters)
  │   │
  │   ├── reception/
  │   │   ├── ReceptionDashboard.tsx
  │   │   ├── CheckInFlow.tsx (Step 1-5)
  │   │   ├── QueueManagement.tsx (real-time)
  │   │   └── DocumentUpload.tsx
  │   │
  │   ├── doctor/
  │   │   ├── DoctorDashboard.tsx
  │   │   ├── DoctorQueue.tsx (real-time)
  │   │   ├── PatientDetailPanel.tsx
  │   │   └── HindsightAgentPanel.tsx
  │   │
  │   └── patient/
  │       ├── PatientDashboard.tsx
  │       ├── CurrentVisitStatus.tsx (real-time)
  │       └── MedicalRecordsTimeline.tsx
  │
  ├── components/
  │   ├── DemoCredentialsButton.tsx
  │   └── ui/ (shadcn/ui components)
  │
  └── hooks/
      └── useRealTimeListeners.ts
```

---

## Part 8: Implementation Checklist

**Phase 1: Setup & Mock Data**
- [ ] Create Firestore collections (hospitals, staff, patients, sessions, records)
- [ ] Run `npm run seed` to populate demo data
- [ ] Verify demo credentials work in LoginPage

**Phase 2: Demo Credentials System**
- [ ] Build DemoCredentialsButton component
- [ ] Add "Try Demo" button to LoginPage
- [ ] Test: Click demo account → form pre-fills → login works

**Phase 3: Main Admin Panel**
- [ ] Build MainAdminDashboard
- [ ] Add CreateHospital modal
- [ ] Add CreateHospitalAdmin modal
- [ ] Test: Create hospital → appears in list

**Phase 4: Hospital Admin Panel**
- [ ] Build HospitalAdminDashboard
- [ ] Real-time staff list (use useHospitalStaffListener)
- [ ] Add Doctor modal (creates auth + Firestore)
- [ ] Add Receptionist modal
- [ ] Test: Add doctor → appears in list, doctor can login

**Phase 5: Receptionist & Check-in Flow**
- [ ] Build CheckInFlow (steps 1-5)
- [ ] Real-time queue updates (useHospitalSessionsListener)
- [ ] Document upload integration
- [ ] Test: Check in patient → appears in doctor's queue

**Phase 6: Doctor Panel**
- [ ] Build DoctorQueue with real-time listener
- [ ] Build PatientDetailPanel
- [ ] Integrate Hindsight agent panel
- [ ] Test: Queue updates in real-time as receptionist checks in patients

**Phase 7: Patient Panel**
- [ ] Build PatientDashboard with real-time listeners
- [ ] Show current visit status
- [ ] Display medical records timeline
- [ ] Test: Patient sees visit status update as doctor progresses

**Phase 8: Security Rules**
- [ ] Deploy updated Firestore Security Rules
- [ ] Test: Hospital admin can't see other hospital's staff
- [ ] Test: Doctor can't see other doctor's queue
- [ ] Test: Receptionist can't access admin panel

**Phase 9: Full End-to-End Test**
- [ ] Main admin creates hospital
- [ ] Main admin creates hospital admin
- [ ] Hospital admin creates doctor + receptionist
- [ ] Receptionist checks in patient
- [ ] Doctor sees patient in queue (real-time)
- [ ] Patient sees visit status update (real-time)

---

## Quick Start Demo

```bash
# 1. Install dependencies
npm install

# 2. Seed mock data
npm run seed

# 3. Start dev server
npm run dev

# 4. Open browser, login with demo credentials
# Main Admin:
#   Email: admin@medipass.demo
#   Password: MediPass@123Main

# Click "Try Demo" button to see all available accounts
```

---

## Success Criteria

✅ Demo credentials work for all 5 user roles
✅ Main admin can create hospitals
✅ Hospital admin can manage staff at their hospital only
✅ Receptionist can check in patients (shows in doctor's queue instantly)
✅ Doctor sees queue updates in real-time
✅ Patient sees visit status updates in real-time
✅ Security rules enforce hospital isolation
✅ No mock data leaks into real workflows
✅ All real-time listeners work without lag
✅ UI clearly shows hierarchy (tabs, modals, permission-based visibility)

