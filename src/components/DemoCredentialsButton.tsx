import React, { useState } from 'react';
import { Key, Copy, Check, UserCheck, Shield, Stethoscope, UserCog, User, ChevronDown, Sparkles } from 'lucide-react';

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'main_admin' | 'hospital_admin' | 'doctor' | 'receptionist' | 'patient';
  hospitalName?: string;
  description: string;
  badgeColor: string;
  icon: any;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'main_admin',
    name: 'Super Main Admin',
    email: 'admin@medipass.demo',
    password: 'MediPass@123Main',
    role: 'main_admin',
    description: 'Manage hospitals & hospital admins across the network',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Shield,
  },
  {
    id: 'hospital_admin_fortis',
    name: 'Hospital Admin (Fortis)',
    email: 'admin@fortis.demo',
    password: 'MediPass@123HospAdmin',
    role: 'hospital_admin',
    hospitalName: 'Fortis Healthcare',
    description: 'Manage doctors, receptionists & patients at Fortis',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: UserCog,
  },
  {
    id: 'doctor_apollo',
    name: 'Dr. Rajesh Kumar',
    email: 'dr.rajesh@apollo.demo',
    password: 'MediPass@123Doctor',
    role: 'doctor',
    hospitalName: 'Apollo Health City',
    description: 'Cardiologist: View live queue, consult & use Hindsight memory agent',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Stethoscope,
  },
  {
    id: 'receptionist_apollo',
    name: 'Priya (Receptionist)',
    email: 'priya@apollo.demo',
    password: 'MediPass@123Recep',
    role: 'receptionist',
    hospitalName: 'Apollo Health City',
    description: 'Check in patients, generate OP numbers & upload medical docs',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: UserCheck,
  },
  {
    id: 'patient_demo',
    name: 'Jai Gudivada (Patient)',
    email: 'patient@medipass.demo',
    phone: '+919876543212',
    password: 'MediPass@123Patient',
    role: 'patient',
    description: 'Patient: View personal health passport, live visit status & records timeline',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: User,
  },
];

interface DemoCredentialsButtonProps {
  onSelectDemo?: (account: DemoAccount) => void;
  className?: string;
}

export const DemoCredentialsButton: React.FC<DemoCredentialsButtonProps> = ({
  onSelectDemo,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, account: DemoAccount) => {
    e.stopPropagation();
    const text = account.phone 
      ? `Phone: ${account.phone}\nEmail: ${account.email}\nPassword: ${account.password}`
      : `Email: ${account.email}\nPassword: ${account.password}`;
    navigator.clipboard.writeText(text);
    setCopiedId(account.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (account: DemoAccount) => {
    if (onSelectDemo) {
      onSelectDemo(account);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1A1D23] bg-white border border-[#E2E4E9] rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      >
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        <span>Try Demo Accounts</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white border border-[#E2E4E9] rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  Pre-configured Demo Credentials
                </h4>
                <p className="text-[11px] text-gray-600">Select any role to auto-fill login details</p>
              </div>
              <span className="text-[10px] font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full">
                5 Roles
              </span>
            </div>

            <div className="p-2 space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const IconComponent = acc.icon;
                return (
                  <div
                    key={acc.id}
                    onClick={() => handleSelect(acc)}
                    className="p-3 border border-gray-100 hover:border-blue-200 bg-white hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all duration-150 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-700">
                            {acc.name}
                          </div>
                          {acc.hospitalName && (
                            <div className="text-[10px] text-gray-500">
                              {acc.hospitalName}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${acc.badgeColor}`}>
                        {acc.role.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 mb-2 leading-tight">
                      {acc.description}
                    </p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px]">
                      <div className="font-mono text-gray-500 truncate max-w-[200px]">
                        {acc.email}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, acc)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition"
                          title="Copy credentials"
                        >
                          {copiedId === acc.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(acc);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition"
                        >
                          Fill & Login →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
