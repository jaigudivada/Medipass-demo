import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { AppFooter } from '../components/layout/AppFooter';
import { useAuth } from '../context/AuthContext';
import { initPageAnimations } from '../lib/animations';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { role, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      const routeMap: Record<string, string> = {
        patient: '/patient',
        doctor: '/doctor',
        receptionist: '/reception',
        main_admin: '/admin/main',
        hospital_admin: '/admin/hospital',
        admin: '/admin/main',
      };
      if (routeMap[role]) {
        navigate(routeMap[role], { replace: true });
      }
    }
  }, [isAuthenticated, role, isLoading, navigate]);

  useEffect(() => {
    if (containerRef.current) {
      const cleanup = initPageAnimations(containerRef.current);
      return cleanup;
    }
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-[#1A1D23] font-sans selection:bg-[#2563EB]/10">
      <HeroSection />
      <HowItWorksSection />
      <AppFooter />
    </div>
  );
}
