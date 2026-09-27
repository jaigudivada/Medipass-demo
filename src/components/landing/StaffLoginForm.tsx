import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface StaffLoginFormProps {
  role: 'doctor' | 'receptionist' | 'admin';
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
      await loginStaff(emailToUse.trim(), passToUse);
      const routeMap: Record<typeof role, string> = {
        doctor: '/doctor',
        receptionist: '/reception',
        admin: '/admin',
      };
      navigate(routeMap[role]);
    } catch (err: any) {
      console.error('[StaffLoginForm] Login error:', err);

      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase Console.');
        setLoading(false);
        return;
      }

      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('../../lib/firebase');
        const res = await createUserWithEmailAndPassword(auth, emailToUse.trim(), passToUse);
        
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        
        const isMainAdmin = emailToUse.includes('admin@medipass.demo');
        const hospId = emailToUse.includes('apollo') ? 'apollo_hosp_001' : 'fortis_hosp_002';

        await setDoc(
          doc(db, 'staff', res.user.uid),
          {
            authUid: res.user.uid,
            email: emailToUse.trim().toLowerCase(),
            name: emailToUse.split('@')[0].toUpperCase(),
            role: role,
            hospitalId: isMainAdmin ? 'hosp-1' : hospId,
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );

        const routeMap: Record<typeof role, string> = {
          doctor: '/doctor',
          receptionist: '/reception',
          admin: '/admin',
        };
        navigate(routeMap[role]);
        return;
      } catch (createErr: any) {
        console.error('[StaffLoginForm] Auto creation error:', createErr);
        if (createErr.code === 'auth/email-already-in-use') {
          setError('Incorrect password for this account.');
        } else {
          setError(createErr.message || 'Invalid email or password.');
        }
      }
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
    admin: 'Hospital Admin Portal',
  };

  return (
    <div className="space-y-4">
      {/* Role Demo Actions */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
        <div className="text-xs font-semibold text-gray-700">
          Demo Login for {roleTitles[role]}
        </div>

        {role === 'doctor' && (
          <button
            type="button"
            onClick={() => doLogin('dr.rajesh@apollo.demo', 'MediPass@123Doctor')}
            disabled={loading}
            className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-gray-400 rounded-lg transition-all flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="text-xs font-semibold text-gray-900">
                Dr. Rajesh Kumar (Cardiologist)
              </div>
              <div className="text-[11px] text-gray-500">Apollo Health City • dr.rajesh@apollo.demo</div>
            </div>
            <span className="text-xs font-medium text-blue-600">
              Login
            </span>
          </button>
        )}

        {role === 'receptionist' && (
          <button
            type="button"
            onClick={() => doLogin('priya@apollo.demo', 'MediPass@123Recep')}
            disabled={loading}
            className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-gray-400 rounded-lg transition-all flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="text-xs font-semibold text-gray-900">
                Priya Johnson (Receptionist)
              </div>
              <div className="text-[11px] text-gray-500">Apollo Health City • priya@apollo.demo</div>
            </div>
            <span className="text-xs font-medium text-blue-600">
              Login
            </span>
          </button>
        )}

        {role === 'admin' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => doLogin('admin@medipass.demo', 'MediPass@123Main')}
              disabled={loading}
              className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-gray-400 rounded-lg transition-all flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  Super Main Admin
                </div>
                <div className="text-[11px] text-gray-500">Network Admin • admin@medipass.demo</div>
              </div>
              <span className="text-xs font-medium text-blue-600">
                Login
              </span>
            </button>

            <button
              type="button"
              onClick={() => doLogin('admin@fortis.demo', 'MediPass@123HospAdmin')}
              disabled={loading}
              className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-gray-400 rounded-lg transition-all flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  Fortis Hospital Admin
                </div>
                <div className="text-[11px] text-gray-500">Fortis Healthcare • admin@fortis.demo</div>
              </div>
              <span className="text-xs font-medium text-blue-600">
                Login
              </span>
            </button>
          </div>
        )}
      </div>

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
