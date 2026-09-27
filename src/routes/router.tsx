import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from '../pages/LandingPage';
import PatientDashboard from '../pages/patient/PatientDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorPatientDetail from '../pages/doctor/DoctorPatientDetail';
import ReceptionDashboard from '../pages/reception/ReceptionDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import { RequireAuth } from '../components/auth/RequireAuth';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route
        path="/patient"
        element={
          <RequireAuth allowedRoles={['patient']}>
            <PatientDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/doctor"
        element={
          <RequireAuth allowedRoles={['doctor']}>
            <DoctorDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/doctor/patient/:opNumber"
        element={
          <RequireAuth allowedRoles={['doctor']}>
            <DoctorPatientDetail />
          </RequireAuth>
        }
      />

      <Route
        path="/reception"
        element={
          <RequireAuth allowedRoles={['receptionist']}>
            <ReceptionDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/main-admin"
        element={
          <RequireAuth allowedRoles={['main_admin', 'admin']}>
            <AdminDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/hospital-admin"
        element={
          <RequireAuth allowedRoles={['hospital_admin', 'admin']}>
            <AdminDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['main_admin', 'hospital_admin', 'admin']}>
            <AdminDashboard />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

