import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface StaffLoginFormProps {
  role: 'doctor' | 'receptionist' | 'admin';
}

export const StaffLoginForm: React.FC<StaffLoginFormProps> = ({ role }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { loginStaff } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      await loginStaff(email.trim(), password);
      const routeMap: Record<typeof role, string> = {
        doctor: '/doctor',
        receptionist: '/reception',
        admin: '/admin',
      };
      navigate(routeMap[role]);
    } catch (err: any) {
      console.error('[StaffLoginForm] Login error:', err);

      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase Console. Enable Email/Password in Firebase Console -> Authentication -> Sign-in method.');
        setLoading(false);
        return;
      }

      // For Admin role: if user doesn't exist in Firebase Auth yet, auto-create it on first sign in!
      if (role === 'admin') {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('../../lib/firebase');
          await createUserWithEmailAndPassword(auth, email.trim(), password);
          navigate('/admin');
          return;
        } catch (createErr: any) {
          console.error('[StaffLoginForm] Auto admin creation error:', createErr);
          if (createErr.code === 'auth/operation-not-allowed') {
            setError('Email/Password sign-in is disabled in Firebase Console. Enable Email/Password under Authentication -> Sign-in method in Firebase Console.');
          } else if (createErr.code === 'auth/email-already-in-use') {
            setError('Incorrect password for this Admin account.');
          } else {
            setError(createErr.message || 'Failed to authenticate Admin account.');
          }
          return;
        }
      }

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roleTitles: Record<typeof role, string> = {
    doctor: 'Doctor Portal',
    receptionist: 'Desk Reception Portal',
    admin: 'Hospital Admin Portal',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
  );
};

