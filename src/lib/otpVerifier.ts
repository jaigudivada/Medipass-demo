import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, signOut } from 'firebase/auth';
import { firebaseConfig } from './firebase';

// Isolated Firebase App instance for Patient OTP Verification
const otpApp = getApps().find((a) => a.name === 'otp-verifier')
  ?? initializeApp(firebaseConfig, 'otp-verifier');

export const otpAuth = getAuth(otpApp);

export async function sendOtpToPhone(
  phoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<ConfirmationResult> {
  // Clear any existing recaptcha instance if needed
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.warn('Recaptcha clear error:', e);
    }
  }

  const verifier = new RecaptchaVerifier(otpAuth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired');
    }
  });

  (window as any).recaptchaVerifier = verifier;

  // Format phone number to international if not already
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
  }

  const confirmationResult = await signInWithPhoneNumber(otpAuth, formattedPhone, verifier);
  return confirmationResult;
}

export async function confirmOtpAndDiscard(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<boolean> {
  try {
    const userCredential = await confirmationResult.confirm(code);
    if (userCredential && userCredential.user) {
      // IMMEDIATELY sign out of the isolated otpAuth session so primary auth is never affected
      await signOut(otpAuth);
      return true;
    }
    return false;
  } catch (error) {
    // Standard sign out cleanup on failure as well
    try {
      await signOut(otpAuth);
    } catch {}
    throw error;
  }
}
