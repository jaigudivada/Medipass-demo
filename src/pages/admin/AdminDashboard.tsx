import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MainAdminDashboard } from './MainAdminDashboard';
import { HospitalAdminDashboard } from './HospitalAdminDashboard';

export default function AdminDashboard() {
  const { role, user } = useAuth();
  const userEmail = user?.email || '';

  const isMainAdmin =
    role === 'main_admin' ||
    userEmail.includes('admin@medipass.demo') ||
    userEmail.includes('admin');

  if (isMainAdmin && !userEmail.includes('apollo') && !userEmail.includes('fortis')) {
    return <MainAdminDashboard />;
  }

  return <HospitalAdminDashboard />;
}
