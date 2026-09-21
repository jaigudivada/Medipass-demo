# MediPass — Phase 2 PRD (v2 — OTP Check-In, OP Numbers, Internal IDs)
**Supersedes MediPass_Phase2_PRD.md. Real Firestore only, no mock data. Builds on Phase 1 auth/routing.**

---

## What changed from v1, and why

v1 used a patient-generated 6-digit code and phone-as-document-ID. Both were replaced after review:
- **Check-in is now receptionist-initiated, OTP-verified** — the receptionist enters the patient's mobile number; the system sends an OTP; the patient reads it back to the receptionist. This is real identity verification, not a token-matching game.
- **Patient IDs are internally generated, never the phone number** — phone numbers change; database keys shouldn't.
- **Every visit gets an OP/Visit Number** — the human-facing reference for that specific visit, separate from the patient's permanent identity.
- **Internal IDs (`patientId`, `hospitalId`, `sessionId`, etc.) are never shown to any user, anywhere** — UI only ever displays names, phone numbers, hospital names, doctor names/specialties, and OP numbers.

---

## Firestore Schema

```
hospitals/
  {hospitalId}
    name: string
    address: string
    contactNumber: string
    email: string
    departments: array[string]
    status: 'active' | 'inactive'
    createdAt: timestamp

  hospitals/{hospitalId}/counters/opCounter
    lastSequence: number          -- incremented in a transaction on each new visit

staff/
  {staffId}
    name: string
    email: string
    role: 'doctor' | 'receptionist' | 'admin'
    hospitalId: reference to hospitals/{hospitalId}
    specialty: string (doctors only)
    department: string (receptionists only, optional)
    status: 'active' | 'inactive'
    createdAt: timestamp

patients/
  {patientId}                     -- auto-generated ID, e.g. via addDoc, NEVER the phone number
    name: string
    phone: string                 -- mutable field, NOT the document ID
    age: number
    bloodGroup: string
    allergies: array[string]
    createdAt: timestamp

patientsByPhone/
  {phone}                         -- uniqueness index, phone number AS the doc ID here only
    patientId: reference to patients/{patientId}
    -- written in the same transaction as patient creation; security rule
    -- rejects patient creation if this doc already exists for that phone

sessions/
  {sessionId}
    patientId: reference to patients/{patientId}
    hospitalId: reference to hospitals/{hospitalId}
    doctorId: reference to staff/{staffId} (nullable until assigned)
    opNumber: string              -- e.g. "APO-260921-014", generated transactionally
    status: 'registered' | 'checked_in' | 'consulted' | 'admitted' | 'discharged'
    createdAt: timestamp
    checkedInAt: timestamp (nullable)
    consultedAt: timestamp (nullable)
    admittedAt: timestamp (nullable)
    dischargedAt: timestamp (nullable)

records/
  {recordId}
    patientId: reference to patients/{patientId}
    sessionId: reference to sessions/{sessionId}
    hospitalId: reference to hospitals/{hospitalId}
    uploadedByStaffId: reference to staff/{staffId}
    type: 'prescription' | 'lab_report' | 'imaging_report' | 'discharge_summary'
    date: timestamp
    extractedText: string
    aiExplanation: string          -- patient-only, never returned to staff queries
    sourceFileUrl: string          -- Firebase Storage download URL
    vitals: {                      -- all optional, visit-specific
      bloodPressure: string | null
      heartRate: number | null
      temperature: number | null
      spo2: number | null
      weight: number | null
    }
    createdAt: timestamp
```

**Never expose `patientId`, `hospitalId`, `staffId`, `sessionId`, `recordId`, or any Firestore doc ID in the UI, in a URL a user sees, in a QR code, or in a downloaded file.** Use `opNumber` for visit identification and route params where a visit needs to be referenced in a URL (e.g. `/doctor/patient/:opNumber` resolved server-side to the underlying session, not `/doctor/patient/:sessionId`).

---

## OTP Check-In Flow — Critical Implementation Detail

**Do not use the receptionist's primary Firebase Auth session to run patient OTP verification.** Standard `signInWithPhoneNumber` + `confirm()` signs the *current browser session* in as that phone number — which would sign the receptionist out of their own account and into the patient's. This is not acceptable.

**Correct implementation:** initialize a **second, isolated Firebase App instance** used only for patient OTP verification, entirely separate from the receptionist's primary auth session:

```
// lib/otpVerifier.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

const otpApp = getApps().find(a => a.name === 'otp-verifier')
  ?? initializeApp(firebaseConfig, 'otp-verifier');
const otpAuth = getAuth(otpApp);

// send OTP, confirm OTP, then IMMEDIATELY sign out of otpAuth —
// this instance's session is discarded, the receptionist's primary
// auth (default app) is never touched.
```

Flow:
1. Receptionist enters patient mobile number → click "Check In Patient"
2. System queries `patientsByPhone/{phone}` — if no patient exists, show a short "Register Patient" form first (name, age, blood group) to create one, then proceed
3. System checks `sessions` for this patient with status in `['registered','checked_in','consulted','admitted']` — if found, show the existing visit (OP number, status, doctor) instead of sending a new OTP
4. If no active visit: send OTP via the isolated `otp-verifier` app instance
5. Receptionist enters the OTP the patient reads aloud
6. On successful confirm: immediately sign out of `otp-verifier`, create the session, generate the OP number (see below), let receptionist pick a doctor
7. OTP expires after 5 minutes; a "Resend OTP" button becomes available after a 30-second cooldown; show a clear "Invalid or expired code" state on failure

---

## OP/Visit Number Generation — Must Be Transactional

Generate the number inside a Firestore transaction against `hospitals/{hospitalId}/counters/opCounter`:

```
runTransaction(db, async (tx) => {
  const counterRef = doc(db, 'hospitals', hospitalId, 'counters', 'opCounter');
  const counterSnap = await tx.get(counterRef);
  const next = (counterSnap.data()?.lastSequence ?? 0) + 1;
  tx.set(counterRef, { lastSequence: next }, { merge: true });
  const opNumber = `${hospitalCode}-${todayYYMMDD}-${String(next).padStart(3,'0')}`;
  // then create the session doc with this opNumber, in the same transaction
});
```

This prevents two simultaneous check-ins from ever generating the same OP number.

---

## Visit Lifecycle & Who Controls It

```
registered → checked_in → consulted → discharged
                              └──→ admitted → discharged
```

| Transition | Who | Mechanism |
|---|---|---|
| → registered | Receptionist | Patient record exists, no active session yet |
| registered → checked_in | Receptionist | After OTP verify + doctor assignment |
| checked_in → consulted | **Doctor** (narrow exception) | Auto-set when doctor opens "View Records" for this patient |
| consulted → admitted | Receptionist | Manual button, based on doctor's verbal instruction |
| consulted/admitted → discharged | Receptionist | Manual button, closes the visit |

**Security rule for the doctor's one write permission:** a doctor may update `sessions.status` from `'checked_in'` to `'consulted'` only, only on a session where `sessions.doctorId == request.auth.uid`, and touching no other field on the document. No other status transition, and no other field, is writable by a doctor role, ever.

---

## File Management (Receptionist Portal)

Receptionist can: scan (camera capture), upload (file picker — image or PDF), view, download, and attach documents to the correct patient + session.

**Upload sequence — order matters:**
```
1. File selected/scanned
2. Upload to Firebase Storage → wait for completion
3. Get downloadURL
4. Run Tesseract.js OCR on the file (client-side) → extractedText
5. Call AI explainer API with extractedText → aiExplanation
6. Only now: create the Firestore `records` document, with sourceFileUrl,
   extractedText, aiExplanation, and any vitals entered
```
Never create the Firestore doc before step 2 completes — a record with a missing/broken file reference is worse than no record.

**Optional vitals form** shown alongside upload (all fields optional): Blood Pressure, Heart Rate, Temperature, SpO2, Weight. Stored on the `records` doc for that visit — not on the patient's permanent profile.

---

## Permissions by Role

| Action | Patient | Doctor | Receptionist | Admin |
|---|---|---|---|---|
| View own/assigned records | ✓ (own only) | ✓ (checked-in patients only) | ✓ (own hospital only) | ✓ (all) |
| Download records | ✓ | ✗ (view only) | ✓ | ✓ |
| Upload/scan records | ✗ | ✗ | ✓ | ✗ |
| See AI explanation | ✓ | ✗ | ✗ | ✗ |
| Search patients | ✗ | ✗ (queue only, no search) | ✓ (own hospital) | ✓ (all) |
| Update session status | ✗ | consulted only | full control | — |
| Manage hospitals/staff | ✗ | ✗ | ✗ | ✓ |
| Update own phone number | ✓ (self, via OTP re-verify) | — | can correct at check-in (via OTP re-verify) | — |

All of the above must be enforced in **Firestore Security Rules**, not only in frontend query logic — hospital isolation in particular must be rule-enforced, since a manually crafted request could otherwise bypass a frontend filter.

---

## Admin Portal

Sections: **Hospitals**, **Doctors**, **Receptionists** (tabs or sidebar).

- **Hospitals:** add, edit, view, set Active/Inactive. No destructive delete when historical sessions/records reference the hospital — inactive status only.
- **Doctors:** add, edit, assign to hospital + specialty, Active/Inactive toggle. Only active doctors at a given hospital appear in that hospital's receptionist doctor-selection dropdown.
- **Receptionists:** add, edit, assign to hospital + department, Active/Inactive toggle.
- All forms create/update the Firestore docs described in the schema above — no separate password management here; assume staff set their own password via Firebase Auth on first login (out of scope to build a custom flow for this).

---

## Dashboard Layouts (per role)

### Patient Dashboard (`/patient`)
- Header, current visit status card (if an active session exists: OP number, hospital, doctor, status), longitudinal timeline of past records
- Tap a record → detail panel: extracted text, AI explanation, vitals (if recorded), "View Original" (download allowed), hospital/doctor names resolved from IDs
- A way to update their own phone number (re-verified via OTP through the same isolated app-instance pattern)

### Receptionist Dashboard (`/reception`)
- "Check In Patient" flow (mobile number → active-visit check → OTP → doctor select → OP number generated)
- Active Queue: sessions for this hospital, with status, OP number, patient name, assigned doctor; buttons to advance status (Admitted, Discharged)
- File management panel: scan/upload/view/download documents against the current session

### Doctor Dashboard (`/doctor`)
- Today's Queue: cards showing patient name, age, OP number, check-in time, status — scoped by `hospitalId + doctorId`
- Click a patient → "View Records" button → navigates to a read-only patient detail view (opens on the OP number route, not a raw doc ID)
- Detail view: demographics, full timeline (read-only), vitals per visit, "View Original" per record (view only, no download button)
- Opening this view is what triggers the `checked_in → consulted` transition
- No search bar, no upload, no edit, anywhere on this dashboard

### Admin Dashboard (`/admin`)
- Tabs: Hospitals / Doctors / Receptionists, each with list + add/edit forms + Active/Inactive toggle, as described above

---

## Design System (all dashboards)

- **Light theme only.**
- **Exactly 3 accent colors**, used consistently: one primary (main actions/active states), one secondary (secondary actions/links), one neutral-highlight (status badges, subtle emphasis). No gradients.
- **Typography:** one clean sans-serif for body/UI text (e.g. Inter), optionally a second, slightly distinct weight/family for headings if it improves hierarchy — no more than two font families total, both easy to scan quickly on a clinical dashboard.
- **shadcn/ui** for all interactive elements (Tabs, Select, Dialog, Button, Input, Table) — no raw HTML form elements.
- **GSAP + ScrollTrigger**, reused from Phase 1's `animations.ts` module: subtle entrance animations on each dashboard's load (fade + slight upward translate, staged), and scroll-reveal for any content below the fold. No heavy motion, no parallax, no bounce/elastic easing. Respect `prefers-reduced-motion`.
- Each dashboard is its own route/page (`/patient`, `/doctor`, `/reception`, `/admin`) — not a single page with a view switcher.
- Minimal, professional, clinical — no decorative copy, no placeholder text left in shipped UI, no tech-stack labels visible anywhere.

---

## File Structure

```
src/
  lib/
    firestore.ts            -- typed CRUD/query functions for every collection
    otpVerifier.ts           -- isolated Firebase app instance for OTP send/confirm
    opNumber.ts               -- transactional OP number generation
    ocr.ts                    -- Tesseract.js wrapper
    aiExplainer.ts             -- AI API call, reads key from env var
    animations.ts              -- carried from Phase 1, GSAP/ScrollTrigger setup

  pages/
    patient/PatientDashboard.tsx
    doctor/DoctorDashboard.tsx
    doctor/DoctorPatientDetail.tsx
    reception/ReceptionDashboard.tsx
    admin/AdminDashboard.tsx

  components/
    patient/VisitStatusCard.tsx
    patient/HealthTimeline.tsx
    patient/RecordDetailPanel.tsx
    patient/PhoneUpdateForm.tsx
    doctor/DoctorQueue.tsx
    doctor/PatientRecordViewer.tsx
    reception/CheckInFlow.tsx
    reception/ActiveQueueList.tsx
    reception/FileManagementPanel.tsx
    reception/VitalsForm.tsx
    admin/HospitalManagement.tsx
    admin/DoctorManagement.tsx
    admin/ReceptionistManagement.tsx
    ui/                        -- shadcn/ui primitives, LoadingSpinner, ErrorMessage

  context/
    AuthContext.tsx             -- carried from Phase 1
```

---

## Build Order

1. Firestore schema setup (manual seed: one hospital, one active doctor, one active receptionist)
2. `lib/firestore.ts` — all CRUD/query functions, typed
3. `lib/otpVerifier.ts` — isolated app instance, send/confirm/discard pattern
4. `lib/opNumber.ts` — transactional counter logic
5. Receptionist Dashboard — check-in flow end to end (mobile → active-visit check → OTP → doctor assignment → OP number), then queue + status controls, then file management + vitals
6. Doctor Dashboard — queue, patient detail view, consulted auto-transition, view-only records
7. Patient Dashboard — visit status card, timeline, record detail, phone update
8. Admin Dashboard — Hospitals / Doctors / Receptionists CRUD + Active/Inactive
9. Firestore Security Rules — hospital isolation, role-based read/write, the narrow doctor consulted-transition rule, `patientsByPhone` uniqueness enforcement
10. Real-time listeners (`onSnapshot`) wired into all four dashboards
11. GSAP entrance/scroll animations — last, once static layouts are approved

## Do NOT include

- Mock data or seed data hardcoded in application code (manual Firestore seeding for testing is fine)
- Phone number as any Firestore document ID
- Any internal ID (`patientId`, `sessionId`, etc.) visible anywhere in the UI, a URL, a QR code, or a downloaded file
- A doctor with any write permission beyond the single narrow `consulted` transition described above
- Destructive hospital deletion when historical data references it
- Offline mode, sync, or conflict resolution
