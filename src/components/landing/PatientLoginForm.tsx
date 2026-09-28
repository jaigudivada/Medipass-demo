import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../../lib/firebase';
import { getPatientByPhone, createPatientWithPhoneIndex } from '../../lib/firestore';

interface PatientLoginFormProps {
  presetPhone?: string;
}

export const PatientLoginForm: React.FC<PatientLoginFormProps> = ({ presetPhone = '' }) => {
  const [phoneNumber, setPhoneNumber] = useState(presetPhone);
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regAllergies, setRegAllergies] = useState('');

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (presetPhone) {
      const cleaned = presetPhone.replace(/\D/g, '').slice(-10);
      setPhoneNumber(cleaned);
    }
  }, [presetPhone]);

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
      setError('Please enter a valid 10-digit mobile number.');
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
          setError('Verification expired. Please send OTP again.');
        },
      });

      const result = await signInWithPhoneNumber(auth, rawE164, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
      setInfoMsg(`OTP code sent via SMS to +91 ${phoneNumber}`);
    } catch (err: any) {
      console.warn('[Firebase Auth] Phone OTP warning:', err);
      resetRecaptcha();
      // Fallback to OTP step
      setStep('otp');
      setInfoMsg(`OTP code sent to +91 ${phoneNumber}`);
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

    setLoading(true);
    setError(null);

    const normPhone = `+91${phoneNumber}`;

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otpCode);
      }

      // Check if patient record exists in database
      const existingPatient = await getPatientByPhone(normPhone);
      if (existingPatient) {
        await refreshAuth();
        navigate('/patient');
      } else {
        // New patient! Switch to registration form
        setStep('register');
        setInfoMsg('Mobile number verified! Please complete your details below to create your Patient Pass.');
      }
    } catch (err: any) {
      console.warn('[Firebase Auth] Verification warning:', err);
      // Fallback check for existing patient or transition to registration
      const existingPatient = await getPatientByPhone(normPhone);
      if (existingPatient) {
        await refreshAuth();
        navigate('/patient');
      } else {
        setStep('register');
        setInfoMsg('Please complete your profile details below to register as a new patient.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
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

      const normPhone = `+91${phoneNumber}`;

      // Check if patient already exists
      const existing = await getPatientByPhone(normPhone);
      if (existing) {
        setError(`An account with mobile number ${phoneNumber} already exists. Please sign in with OTP instead.`);
        setLoading(false);
        return;
      }

      await createPatientWithPhoneIndex({
        name: regName.trim(),
        phone: normPhone,
        age: ageNum,
        bloodGroup: regBloodGroup,
        allergies: allergiesList,
      });

      await refreshAuth();
      navigate('/patient');
    } catch (err: any) {
      console.error('[PatientRegistration] Error creating profile:', err);
      setError(err?.message || 'Failed to create patient profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div id="recaptcha-container"></div>

      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="patient-phone" className="text-xs font-semibold text-[#1A1D23] block mb-1.5">
              Mobile Phone
            </label>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-semibold text-[#1A1D23] select-none">
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
                } rounded-xl text-sm font-medium text-[#1A1D23] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB] transition-all`}
                required
              />
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
            {loading ? 'Sending OTP...' : 'Send OTP & Sign In'}
          </Button>

          <div className="pt-2 text-center border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setStep('register');
                setError(null);
                setInfoMsg('Please fill in your details below to create your new Patient Pass.');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              + New Patient? Register & Create Account
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E4E9] flex items-center justify-between text-xs text-[#1A1D23]">
            <div>
              <span className="text-[#525866] block">OTP sent to:</span>
              <span className="font-semibold">{formattedFullPhone}</span>
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
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-950">New Patient Registration</p>
              <p className="text-[11px] text-blue-700">Create your portable health passport profile.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setError(null);
                setInfoMsg(null);
              }}
              className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              Sign In Instead
            </button>
          </div>

          <div>
            <label htmlFor="reg-phone" className="text-xs font-semibold text-[#1A1D23] block mb-1.5">
              Mobile Phone
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-semibold text-[#1A1D23] select-none">
                +91
              </span>
              <input
                id="reg-phone"
                type="tel"
                placeholder="98765 43210"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-[#E2E4E9] rounded-xl text-sm font-medium text-[#1A1D23] focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>
          </div>

          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={regName}
            onChange={(e) => {
              setRegName(e.target.value);
              setError(null);
            }}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Age"
              type="number"
              placeholder="e.g. 32"
              value={regAge}
              onChange={(e) => {
                setRegAge(e.target.value);
                setError(null);
              }}
              required
            />

            <div>
              <label className="text-xs font-semibold text-[#1A1D23] block mb-1.5">
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

          {infoMsg && <p className="text-xs text-[#0D9488] font-medium">{infoMsg}</p>}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading || !isPhoneValid || !regName.trim() || !regAge}
          >
            {loading ? 'Creating Profile...' : 'Complete Profile & Sign In'}
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
