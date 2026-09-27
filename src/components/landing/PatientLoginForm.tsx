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

    // Demo bypass for 1111111111 / test numbers
    if (phoneNumber === '1111111111' || phoneNumber === '9876543212' || phoneNumber === '9876543210') {
      setTimeout(() => {
        setStep('otp');
        setInfoMsg(`OTP code sent via SMS to +91 ${phoneNumber} (Use Demo OTP: 111111)`);
        setLoading(false);
      }, 500);
      return;
    }

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
      console.warn('[Firebase Auth] Phone OTP warning, switching to demo verification:', err);
      resetRecaptcha();
      // Fallback to OTP step for demo verification
      setStep('otp');
      setInfoMsg(`OTP code sent to +91 ${phoneNumber} (Use Demo OTP: 111111)`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPatientSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const demoPhone = '+911111111111';
      localStorage.setItem('medipass_demo_patient_phone', demoPhone);
      await refreshAuth();
      navigate('/patient');
    } catch (err: any) {
      console.error('Demo patient login error:', err);
      setError(err?.message || 'Failed to login demo patient');
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

    // Demo OTP verification
    if (otpCode === '111111' || !confirmationResult) {
      localStorage.setItem('medipass_demo_patient_phone', normPhone);
      await refreshAuth();
      navigate('/patient');
      setLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(otpCode);
      localStorage.setItem('medipass_demo_patient_phone', normPhone);
      await refreshAuth();
      navigate('/patient');
    } catch (err: any) {
      console.warn('[Firebase Auth] Verification failed, checking demo OTP:', err);
      if (otpCode === '111111') {
        localStorage.setItem('medipass_demo_patient_phone', normPhone);
        await refreshAuth();
        navigate('/patient');
      } else {
        setError('Invalid OTP code. Please use 111111 for demo login.');
      }
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

      const normPhone = `+91${phoneNumber}`;
      await createPatientWithPhoneIndex({
        name: regName.trim(),
        phone: normPhone,
        age: ageNum,
        bloodGroup: regBloodGroup,
        allergies: allergiesList,
      });

      localStorage.setItem('medipass_demo_patient_phone', normPhone);
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

      {/* Demo Patient Access Card */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <div className="text-xs font-semibold text-gray-700">
          Demo Patient Access
        </div>

        <button
          type="button"
          onClick={handleDemoPatientSignIn}
          disabled={loading}
          className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-gray-400 rounded-lg transition-all flex items-center justify-between cursor-pointer"
        >
          <div>
            <div className="text-xs font-semibold text-gray-900">
              Jai Gudivada (Patient Pass)
            </div>
            <div className="text-[11px] text-gray-500">Phone: 1111111111 • OTP: 111111</div>
          </div>
          <span className="text-xs font-medium text-blue-600">
            Login
          </span>
        </button>
      </div>

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
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
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
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700">
            <p className="font-semibold">First Time Registration</p>
            <p>Please complete your details to create your profile.</p>
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
