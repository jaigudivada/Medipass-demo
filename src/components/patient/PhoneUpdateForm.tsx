import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { sendOtpToPhone, confirmOtpAndDiscard } from '../../lib/otpVerifier';
import { updatePatientPhone } from '../../lib/firestore';
import { ConfirmationResult } from 'firebase/auth';
import { Phone, ShieldCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface PhoneUpdateFormProps {
  patientId: string;
  currentPhone: string;
  onPhoneUpdated: (newPhone: string) => void;
}

export const PhoneUpdateForm: React.FC<PhoneUpdateFormProps> = ({
  patientId,
  currentPhone,
  onPhoneUpdated,
}) => {
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendOtpToPhone(newPhone.trim(), 'recaptcha-phone-update');
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send verification OTP to new mobile.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otpCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const verified = await confirmOtpAndDiscard(confirmationResult, otpCode.trim());
      if (verified) {
        await updatePatientPhone(patientId, currentPhone, newPhone.trim());
        onPhoneUpdated(newPhone.trim());
        setSuccess('Mobile number successfully verified and updated!');
        setOtpSent(false);
        setNewPhone('');
        setOtpCode('');
      } else {
        setError('Invalid OTP code.');
      }
    } catch (err: any) {
      console.error('Phone update error:', err);
      setError('Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-600" />
          <span>Update Registered Mobile Number (OTP Verified)</span>
        </CardTitle>
        <CardDescription>
          Re-verify identity via SMS OTP to update your mobile phone reference across MediPass.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div id="recaptcha-phone-update"></div>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter new 10-digit mobile number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="text-xs"
                required
              />
              <Button type="submit" variant="default" size="sm" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Verify New Phone'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndUpdate} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" /> Enter 6-Digit Verification OTP
              </span>
              <span className="text-[11px] text-slate-500">Sent to {newPhone}</span>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="6-digit OTP code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="font-mono text-center tracking-widest text-sm font-bold"
                required
              />
              <Button type="submit" variant="default" size="sm" disabled={loading}>
                {loading ? 'Confirming...' : 'Update Phone'}
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
