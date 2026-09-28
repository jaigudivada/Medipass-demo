import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MainAdminDashboard } from './MainAdminDashboard';
import { HospitalAdminDashboard } from './HospitalAdminDashboard';

export default function AdminDashboard() {
  const { role } = useAuth();

  if (role === 'main_admin' || role === 'admin') {
    return <MainAdminDashboard />;
  }

  if (role === 'hospital_admin') {
    return <HospitalAdminDashboard />;
  }

  return <MainAdminDashboard />;
}
