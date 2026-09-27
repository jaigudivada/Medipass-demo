# MediPass — Idea Submission PRD (v3 — Demo-Scoped Edition)



## 1. Idea title
**MediPass — Portable Health Passport**

## 2. One-liner
A role-based health record system where the patient owns the history, the hospital front desk handles the paperwork, the doctor sees a clean read-only timeline with zero search access, and AI only ever talks to the patient.

## 3. Problem
Two problems, not one. (1) A patient's records are scattered across providers with no portability. (2) The obvious fix — "give doctors an app to upload/search patient data" — creates a privacy and trust problem of its own: any doctor with an account can browse any patient, any AI in that hospital-facing tool can hallucinate into a chart. Most digital-record pitches solve (1) and ignore (2).

## 4. Solution — the workflow
1. **Check-in:** Patient shows their phone number at the desk; a one-time code generated inside their own MediPass app is what the receptionist enters — nothing is texted, nothing leaves the patient's device to prove identity.
2. **Queue:** Entering that code routes the patient's unlocked profile straight to the assigned doctor's live queue.
3. **Consultation:** The doctor sees the chronological record — view only, no upload, no edit, no search bar. They can't look up anyone who isn't in their queue. The visit itself stays low-tech on purpose: a paper prescription, same as today.
4. **Checkout:** The patient hands that paper prescription and any new report to the receptionist, who scans/uploads it and closes the session.
5. **Explain:** The moment a new record lands, the patient's own app — and only the patient's app — runs it through an AI explainer: plain-English dosage, what a lab value means, what to watch for. The hospital-facing portals never touch AI.
6. **Own it:** The patient's longitudinal timeline updates, shareable outside the hospital network via a time-boxed QR when needed.

## 5. Roles
| Role | Can do | Cannot do |
|---|---|---|
| **Patient** (mobile app) | View full timeline, get AI plain-English explanations, generate check-in code, share/revoke externally | Edit clinical records |
| **Receptionist** (web portal) | Verify check-in code, push patient to doctor's queue, upload/scan documents at checkout, close session | See AI explanations, search patients outside their hospital |
| **Doctor** (web portal) | View the checked-in patient's chronological record | Upload, edit, search, browse anyone not currently in their queue, see any AI output |
| **Admin** (us, the dev team) | Manage hospital and staff accounts, monitor sessions | — |

## 6. What the prototype demonstrates (demo-scoped, not the real build)
This is a **clickable, mocked front-end** — good enough to film, not a production system:
- All four views (Patient, Reception, Doctor, Admin) in one app, switched with a "Viewing as" toggle instead of real login.
- Data lives in shared in-memory state, seeded with one mock hospital, one doctor, one receptionist, one patient and a few pre-loaded records — no database, no persistence beyond the session.
- The check-in → queue → consult → checkout loop plays out entirely client-side: a code generated on the "patient" screen, entered on the "reception" screen, which pushes the patient into a queue the "doctor" screen reads from.
- The doctor's screen has no search bar and no upload/edit control at all — left out, not just hidden, since that's the whole point of the pitch.
- Two things are genuinely real, not mocked: OCR (Tesseract.js reading an actual scanned/uploaded document) and the AI explainer (a real API call), because those are what make the video convincing.
- What it does **not** demonstrate at this stage: real access control, offline behaviour, Office Kit, or anything requiring a backend — all of that is real for the actual 30-hour build, not for this submission.

## 7. Tech stack (one line) — demo build
Vite + React + Tailwind, single static app (deployed to Vercel), no backend, no database, no auth — all state in-memory and seeded with mock data; Tesseract.js for real client-side OCR; one hosted LLM API call for the AI explainer.

*(The real build's stack — Supabase, RLS, Realtime, role-gated auth — stays as specified in the 30-Hour Build PRD and is what actually gets built during the event.)*

## 8. Novelty / differentiation
Not "AI reads your medical documents" — that's table stakes now. The claim is the **access-control design**: a clinical system where the two people with the most institutional power over a patient's data (receptionist, doctor) have the least AI exposure and the narrowest query surface, by construction, while the patient — who has the least institutional power — gets the most AI help and the most control (revoke, external sharing). That inversion is the pitch line — say it in the video even though the underlying enforcement (RLS) isn't built yet at this stage.

## 9. Privacy & safety line (say this explicitly)
"The doctor sees exactly the patients checked in for them, today, and nothing else — not a search bar, not a directory. AI never writes to a chart and never appears on a clinical screen. The only person MediPass explains anything to is the patient."

## 10. Ready-to-paste description (submission form)
> MediPass is a role-based health record system built around a real hospital handoff, not just a document locker. At check-in, the patient shares a code generated inside their own app; that routes their record to the doctor's live queue for the visit — read-only, with no search bar, so a doctor only ever sees who's actually checked in for them. Consultations stay low-tech: a paper prescription, same as today. At checkout, the receptionist scans that prescription and any new reports into the patient's profile — and only then does AI get involved, generating a plain-English explanation that appears exclusively in the patient's own app. The result: a system where the people with institutional access have the least AI exposure and the narrowest reach, and the patient — who has the least power in a normal hospital visit — ends up with the most control: a full timeline and time-boxed, revocable sharing outside the hospital.

*(~130 words — trim for a hard character cap.)*

## 11. Submission checklist
- [ ] **Idea title** — MediPass — Portable Health Passport
- [ ] **Description** — paste block above
- [ ] **Prototype URL** — deployed mocked demo link (Vercel); the role switcher makes all four portals reachable from one URL
- [ ] **Repo link** — public GitHub repo for this demo build
- [ ] **Deck/document** — lead with the check-in → queue → consult → checkout → explain flow as a diagram; it's your strongest single slide. Make clear (one line, no need to dwell on it) that the full RBAC/cloud backend is the 30-hour build deliverable, and this is a concept demo
- [ ] **YouTube video** — 2–3 min screen recording walking the role switcher through the full loop; rehearse the exact click order before recording so nothing stalls on camera

## 12. Open question, carried over
Whether a local/open-source model is required to qualify or just earns bonus points is still ambiguous in the rules. It doesn't affect this demo stage either way — Tesseract.js is already local and open-source. It matters more for the real build's stack choice (hosted LLM vs. laptop-hosted open model via Office Kit) — see the 30-Hour Build PRD §5.
