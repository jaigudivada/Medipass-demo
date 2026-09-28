import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface StaffLoginFormProps {
  role: 'doctor' | 'receptionist' | 'main_admin' | 'hospital_admin' | 'admin';
  presetEmail?: string;
  presetPassword?: string;
}

export const StaffLoginForm: React.FC<StaffLoginFormProps> = ({
  role,
  presetEmail = '',
  presetPassword = '',
}) => {
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState(presetPassword);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { loginStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (presetEmail) setEmail(presetEmail);
    if (presetPassword) setPassword(presetPassword);
  }, [presetEmail, presetPassword]);

  const doLogin = async (emailToUse: string, passToUse: string) => {
    setLoading(true);
    setError(null);
    setEmail(emailToUse);
    setPassword(passToUse);

    try {
      const staffMember = await loginStaff(emailToUse.trim(), passToUse);
      const userRole = staffMember?.role || role;

      const routeMap: Record<string, string> = {
        doctor: '/doctor',
        receptionist: '/reception',
        main_admin: '/admin/main',
        hospital_admin: '/admin/hospital',
        admin: '/admin/main',
      };
      navigate(routeMap[userRole] || '/admin/main', { replace: true });
    } catch (err: any) {
      console.error('[StaffLoginForm] Login error:', err);

      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase Console.');
        setLoading(false);
        return;
      }
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    doLogin(email, password);
  };

  const roleTitles: Record<typeof role, string> = {
    doctor: 'Doctor Portal',
    receptionist: 'Desk Reception Portal',
    main_admin: 'Main Admin Portal',
    hospital_admin: 'Hospital Admin Portal',
    admin: 'Admin Portal',
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label={`${roleTitles[role]} Email`}
          type="email"
          placeholder="name@hospital.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          required
        />

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
};
