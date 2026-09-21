import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../../lib/firebase';
import { getPatientByPhone, createPatientWithPhoneIndex } from '../../lib/firestore';

export const PatientLoginForm: React.FC = () => {
  // Raw 10-digit number without country code
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // New patient registration state
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regAllergies, setRegAllergies] = useState('');

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  // Enforce digits only for 10-digit Indian mobile number rule (+91 ##########)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (val.startsWith('+91')) {
      val = val.slice(3);
    }

    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
    setError(null);
  };

  const isPhoneValid = phoneNumber.length === 10;
  const formattedFullPhone = `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;

  // Clear reCAPTCHA element properly
  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // ignore
      }
      window.recaptchaVerifier = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      setError('Please enter a valid 10-digit mobile number (+91 ##########).');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMsg(null);

    const rawE164 = `+91${phoneNumber}`;

    try {
      resetRecaptcha();

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        'expired-callback': () => {
          setError('reCAPTCHA verification expired. Please send OTP again.');
        },
      });

      const result = await signInWithPhoneNumber(auth, rawE164, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
      setInfoMsg(`OTP code sent via SMS to +91 ${phoneNumber}`);
    } catch (err: any) {
      console.error('[Firebase Auth] Phone OTP error:', err);
      resetRecaptcha();
      setError(err?.message || 'Firebase failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (!confirmationResult) {
      setError('No active Firebase confirmation session. Please request a new OTP.');
      setStep('phone');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmationResult.confirm(otpCode);
      
      // Check if patient record exists in Firestore
      const patient = await getPatientByPhone(`+91${phoneNumber}`);
      if (patient) {
        await refreshAuth();
        navigate('/patient');
      } else {
        // New patient! Move to register step
        setStep('register');
      }
    } catch (err: any) {
      console.error('[Firebase Auth] OTP Verification error:', err);
      setError(err?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setError('Full name is required.');
      return;
    }
    const ageNum = parseInt(regAge, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      setError('Please enter a valid age.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allergiesList = regAllergies
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await createPatientWithPhoneIndex({
        name: regName.trim(),
        phone: `+91${phoneNumber}`,
        age: ageNum,
        bloodGroup: regBloodGroup,
        allergies: allergiesList,
      });

      await refreshAuth();
      navigate('/patient');
    } catch (err: any) {
      console.error('[PatientRegistration] Error creating profile:', err);
      setError(err?.message || 'Failed to create patient profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Container for Firebase Recaptcha */}
      <div id="recaptcha-container"></div>

      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="patient-phone" className="text-xs font-semibold text-[#1A1D23] uppercase tracking-wider block mb-1.5">
              Mobile Phone (+91 Rule)
            </label>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-bold text-[#1A1D23] select-none">
                +91
              </span>
              <input
                id="patient-phone"
                type="tel"
                placeholder="98765 43210"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className={`w-full pl-12 pr-3.5 py-2.5 bg-white border ${
                  error ? 'border-red-500' : 'border-[#E2E4E9]'
                } rounded-xl text-sm font-medium text-[#1A1D23] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all`}
                required
              />
            </div>

            <div className="flex items-center justify-between mt-1.5 text-xs text-[#525866]">
              <span>Format: +91 ##########</span>
              <span className={phoneNumber.length === 10 ? 'text-[#0D9488] font-semibold' : ''}>
                {phoneNumber.length}/10 digits
              </span>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading || !isPhoneValid}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E4E9] flex items-center justify-between text-xs text-[#1A1D23]">
            <div>
              <span className="text-[#525866] block">OTP sent via SMS to:</span>
              <span className="font-bold">{formattedFullPhone}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setError(null);
                setInfoMsg(null);
                setConfirmationResult(null);
              }}
              className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          <div>
            <Input
              label="6-Digit SMS OTP Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              maxLength={6}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              required
            />
          </div>

          {infoMsg && <p className="text-xs text-[#0D9488] font-medium">{infoMsg}</p>}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading || otpCode.length < 6}
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </Button>
        </form>
      )}

      {step === 'register' && (
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800">
            <p className="font-semibold">First Time Sign In</p>
            <p>Please complete your basic profile details to register your portable health pass.</p>
          </div>

          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Age"
              type="number"
              placeholder="e.g. 32"
              value={regAge}
              onChange={(e) => setRegAge(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-[#1A1D23] uppercase tracking-wider block mb-1.5">
                Blood Group
              </label>
              <select
                value={regBloodGroup}
                onChange={(e) => setRegBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E4E9] rounded-xl text-sm font-medium text-[#1A1D23] focus:outline-none focus:border-[#2563EB]"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Allergies (comma separated, optional)"
            type="text"
            placeholder="e.g. Penicillin, Peanuts"
            value={regAllergies}
            onChange={(e) => setRegAllergies(e.target.value)}
          />

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading || !regName.trim() || !regAge}
          >
            {loading ? 'Creating Profile...' : 'Complete Profile & Continue'}
          </Button>
        </form>
      )}
    </div>
  );
};

declare global {
  interface Window {
    recaptchaVerifier: any;
    grecaptcha: any;
  }
}

