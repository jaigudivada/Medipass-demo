import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { ConfirmationResult } from 'firebase/auth';
import {
  getPatientByPhone,
  createPatientWithPhoneIndex,
  getActiveSessionByPatient,
  getDoctorsByHospital,
  createSessionDoc,
  updateSessionStatus,
  Patient,
  Staff,
  Session,
} from '../../lib/firestore';
import { sendOtpToPhone, confirmOtpAndDiscard } from '../../lib/otpVerifier';
import { generateTransactionalOpNumber } from '../../lib/opNumber';
import { UserCheck, Phone, CheckCircle2, AlertCircle, Clock, RefreshCw, UserPlus, Stethoscope } from 'lucide-react';

interface CheckInFlowProps {
  hospitalId: string;
  hospitalName: string;
  onSessionCreated?: (session: Session) => void;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({
  hospitalId,
  hospitalName,
  onSessionCreated,
}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient Registration State (if phone not found)
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('');
  const [regAllergies, setRegAllergies] = useState('');

  // Active visit existing check
  const [existingSession, setExistingSession] = useState<Session | null>(null);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  // OTP Verification State
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Cooldown & Expiration timer
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Doctor selection & OP Number generation state
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [generatedOpNumber, setGeneratedOpNumber] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<Session | null>(null);

  useEffect(() => {
    let interval: any;
    if (cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Load available active doctors for this hospital
  useEffect(() => {
    if (hospitalId) {
      getDoctorsByHospital(hospitalId).then((docs) => {
        setDoctors(docs);
        if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
        }
      });
    }
  }, [hospitalId]);

  // Handle phone check
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError(null);
    setShowRegisterForm(false);
    setExistingSession(null);
    setConfirmationResult(null);
    setOtpSent(false);
    setOtpVerified(false);
    setSessionSuccess(null);

    try {
      const patient = await getPatientByPhone(phone);
      if (!patient) {
        // Patient doesn't exist -> Prompt register first
        setShowRegisterForm(true);
        setLoading(false);
        return;
      }

      setCurrentPatient(patient);

      // Check for existing active session
      const activeVisit = await getActiveSessionByPatient(patient.id);
      if (activeVisit) {
        setExistingSession(activeVisit);
        setLoading(false);
        return;
      }

      // No active session -> Send OTP
      await triggerOtpSend(patient.phone);
    } catch (err: any) {
      console.error('Check phone error:', err);
      setError(err.message || 'Failed to check phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger sending OTP
  const triggerOtpSend = async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await sendOtpToPhone(phoneNumber, 'recaptcha-container');
      setConfirmationResult(result);
      setOtpSent(true);
      setCooldownSeconds(30);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP to patient mobile.');
    } finally {
      setLoading(false);
    }
  };

  // Handle patient registration
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regAge.trim()) {
      setError('Please provide patient name and age.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allergiesList = regAllergies
        ? regAllergies.split(',').map((a) => a.trim()).filter(Boolean)
        : [];

      const newPatient = await createPatientWithPhoneIndex({
        name: regName.trim(),
        phone: phone.trim(),
        age: parseInt(regAge.trim(), 10) || 0,
        bloodGroup: regBloodGroup,
        allergies: allergiesList,
      });

      setCurrentPatient(newPatient);
      setShowRegisterForm(false);

      // Send OTP to new patient
      await triggerOtpSend(newPatient.phone);
    } catch (err: any) {
      console.error('Register patient error:', err);
      setError(err.message || 'Failed to register patient.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otpCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const verified = await confirmOtpAndDiscard(confirmationResult, otpCode.trim());
      if (verified) {
        setOtpVerified(true);
        setOtpSent(false);

        // Transactionally generate OP Number
        const opNumber = await generateTransactionalOpNumber(hospitalId, hospitalName);
        setGeneratedOpNumber(opNumber);
      } else {
        setError('Invalid or expired OTP code.');
      }
    } catch (err: any) {
      console.error('OTP verify error:', err);
      setError('Invalid or expired code. Please verify the 6-digit code read by the patient.');
    } finally {
      setLoading(false);
    }
  };

  // Complete check-in session creation with doctor assignment
  const handleFinalCheckIn = async () => {
    if (!currentPatient || !generatedOpNumber) return;

    setLoading(true);
    setError(null);

    try {
      const sessionId = await createSessionDoc({
        patientId: currentPatient.id,
        hospitalId: hospitalId,
        doctorId: selectedDoctorId || null,
        opNumber: generatedOpNumber,
        status: 'checked_in',
        checkedInAt: new Date(),
      });

      const assignedDoc = doctors.find((d) => d.id === selectedDoctorId);

      const created: Session = {
        id: sessionId,
        patientId: currentPatient.id,
        hospitalId,
        doctorId: selectedDoctorId || null,
        opNumber: generatedOpNumber,
        status: 'checked_in',
        patientName: currentPatient.name,
        patientPhone: currentPatient.phone,
        doctorName: assignedDoc ? assignedDoc.name : 'Unassigned',
      };

      setSessionSuccess(created);
      if (onSessionCreated) onSessionCreated(created);
    } catch (err: any) {
      console.error('Check-in creation error:', err);
      setError(err.message || 'Failed to complete patient check-in.');
    } finally {
      setLoading(false);
    }
  };

  const doctorOptions = doctors.map((doc) => ({
    value: doc.id,
    label: `${doc.name} — ${doc.specialty || 'General'}`,
  }));

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>Patient Check-In & Identity OTP Verification</span>
        </CardTitle>
        <CardDescription>
          Enter patient's registered mobile number to verify active visits via OTP and assign to doctor queue.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Invisible Recaptcha Container */}
        <div id="recaptcha-container"></div>

        {/* Step 1: Mobile Search Form */}
        {!otpSent && !otpVerified && !showRegisterForm && !existingSession && !sessionSuccess && (
          <form onSubmit={handleCheckPhone} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  type="text"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 text-sm"
                  required
                />
              </div>
              <Button type="submit" variant="default" size="sm" disabled={loading}>
                {loading ? 'Checking...' : 'Check In Patient'}
              </Button>
            </div>
          </form>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form if Patient not found */}
        {showRegisterForm && (
          <form onSubmit={handleRegisterPatient} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>New Patient Registration</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Name</label>
                <Input
                  type="text"
                  placeholder="Enter patient full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Age (Years)</label>
                <Input
                  type="number"
                  placeholder="Enter age in years"
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Blood Group</label>
                <Select
                  options={[
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                  ]}
                  value={regBloodGroup}
                  onChange={setRegBloodGroup}
                  placeholder="Select blood group..."
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Known Allergies (comma separated)</label>
                <Input
                  type="text"
                  placeholder="Enter known allergies (if any)"
                  value={regAllergies}
                  onChange={(e) => setRegAllergies(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRegisterForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={loading}>
                {loading ? 'Creating Record...' : 'Register & Send OTP'}
              </Button>
            </div>
          </form>
        )}

        {/* Existing Active Visit Alert */}
        {existingSession && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Existing Active Visit Found
              </span>
              <Badge variant="outline" className="border-amber-300 text-amber-800">
                {existingSession.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-amber-800">
              Patient <strong>{currentPatient?.name}</strong> already has an active visit token today.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-slate-700 space-y-1">
              <div><strong>OP Number:</strong> <span className="font-mono font-bold text-blue-600">{existingSession.opNumber}</span></div>
              <div><strong>Hospital:</strong> {hospitalName}</div>
              <div><strong>Status:</strong> {existingSession.status}</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-1"
              onClick={() => {
                setExistingSession(null);
                setPhone('');
              }}
            >
              Back to Check-In Search
            </Button>
          </div>
        )}

        {/* Step 2: OTP Entry Form */}
        {otpSent && !otpVerified && (
          <form onSubmit={handleVerifyOtp} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Enter Patient's 6-Digit Mobile OTP
              </span>
              <span className="text-[11px] text-slate-500">Sent to {currentPatient?.phone}</span>
            </div>

            <p className="text-xs text-slate-600">
              Ask patient <strong>{currentPatient?.name}</strong> to read aloud the 6-digit OTP sent to their mobile.
            </p>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter 6-digit OTP code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="font-mono text-center tracking-widest text-base font-bold"
                required
              />
              <Button type="submit" variant="default" size="sm" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Code expires in 5 minutes</span>
              <button
                type="button"
                disabled={cooldownSeconds > 0 || loading}
                onClick={() => currentPatient && triggerOtpSend(currentPatient.phone)}
                className="text-blue-600 hover:underline disabled:text-slate-400 font-medium inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {cooldownSeconds > 0 ? `Resend OTP (${cooldownSeconds}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Verified OTP & Doctor Queue Assignment */}
        {otpVerified && generatedOpNumber && !sessionSuccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-blue-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Identity Verified for {currentPatient?.name} ({currentPatient?.age} yrs, {currentPatient?.bloodGroup})</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-1 text-slate-700">
              <div><strong>Generated OP Number:</strong> <span className="font-mono font-bold text-blue-600 text-sm ml-1">{generatedOpNumber}</span></div>
              <div><strong>Patient Contact:</strong> {currentPatient?.phone}</div>
              {currentPatient?.allergies && currentPatient.allergies.length > 0 && (
                <div className="text-amber-700 font-medium">
                  <strong>Allergies:</strong> {currentPatient.allergies.join(', ')}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-slate-800 block flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                Select OPD Doctor:
              </label>
              {doctorOptions.length > 0 ? (
                <Select
                  options={doctorOptions}
                  value={selectedDoctorId}
                  onChange={setSelectedDoctorId}
                  placeholder="Select doctor..."
                />
              ) : (
                <p className="text-red-600 text-xs">No active doctors configured for this hospital.</p>
              )}
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full mt-2"
              disabled={loading || !selectedDoctorId}
              onClick={handleFinalCheckIn}
            >
              {loading ? 'Creating Visit...' : 'Complete Check-In & Generate Pass'}
            </Button>
          </div>
        )}

        {/* Final Success Banner */}
        {sessionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs text-emerald-900">
            <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Patient Checked In & Dispatched to Queue</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1 text-slate-800">
              <div><strong>Patient:</strong> {sessionSuccess.patientName} ({sessionSuccess.patientPhone})</div>
              <div><strong>Assigned Doctor:</strong> {sessionSuccess.doctorName}</div>
              <div><strong>OP Number:</strong> <span className="font-mono font-bold text-blue-600 text-sm ml-1">{sessionSuccess.opNumber}</span></div>
              <div><strong>Status:</strong> <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">Checked In</Badge></div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setSessionSuccess(null);
                setOtpVerified(false);
                setGeneratedOpNumber(null);
                setPhone('');
              }}
            >
              Check In Another Patient
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
