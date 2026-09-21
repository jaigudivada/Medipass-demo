import React from 'react';
import { ShieldCheck, UserCheck, FileText } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: UserCheck,
      step: '01',
      title: 'Identity Check-In',
      description: 'Patients verify via phone OTP; hospital staff sign in with registered email credentials.',
    },
    {
      icon: FileText,
      step: '02',
      title: 'Records & Prescriptions',
      description: 'Access consolidated medical records, lab panels, and active medications in one place.',
    },
    {
      icon: ShieldCheck,
      step: '03',
      title: 'Desk & OPD Routing',
      description: 'Receptionists manage check-ins and doctors review queue status during consultation.',
    },
  ];

  return (
    <section className="py-14 bg-[#F8F9FA] border-t border-b border-[#E2E4E9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 js-reveal">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1D23]">
            How MediPass operates
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="js-reveal bg-white p-6 rounded-2xl border border-[#E2E4E9] shadow-xs flex flex-col text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#2563EB] flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#525866]">{s.step}</span>
                </div>
                <h3 className="text-base font-bold text-[#1A1D23] mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-[#525866] leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
