import React from 'react';
import { LoginPanel } from './LoginPanel';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-white pt-10 pb-16 sm:pt-16 sm:pb-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-8 mb-10 border-b border-[#E2E4E9] js-hero-item">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1A1D23]">MediPass</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span>Portable Health Passport & Access System</span>
          </div>
        </div>

        {/* Hero Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Product Focus */}
          <div className="lg:col-span-7 text-left space-y-5">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1D23] leading-[1.15] js-hero-item">
              Medical records and hospital access management
            </h1>

            <p className="text-base sm:text-lg text-[#525866] max-w-xl leading-relaxed js-hero-item">
              A single verification system for patient check-in, prescription history, and staff desk routing across departments.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-6 text-xs font-medium text-[#525866] js-hero-item">
              <span className="text-[#1A1D23]">Phone OTP Verification</span>
              <span className="text-[#E2E4E9]">•</span>
              <span className="text-[#1A1D23]">Hospital Roster Access</span>
              <span className="text-[#E2E4E9]">•</span>
              <span className="text-[#1A1D23]">OPD Queue Integration</span>
            </div>
          </div>

          {/* Right Column: Hero Embedded Login Panel */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end js-hero-item">
            <LoginPanel />
          </div>
        </div>
      </div>
    </section>
  );
};
