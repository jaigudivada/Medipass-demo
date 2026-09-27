import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from '../pages/LandingPage';
import PatientDashboard from '../pages/patient/PatientDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorPatientDetail from '../pages/doctor/DoctorPatientDetail';
import ReceptionDashboard from '../pages/reception/ReceptionDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import MainAdminDashboard from '../pages/admin/MainAdminDashboard';
import HospitalAdminDashboard from '../pages/admin/HospitalAdminDashboard';
import { RequireAuth } from '../components/auth/RequireAuth';
import { useAuth } from '../context/AuthContext';

export default function AppRoutes() {
  const { currentPatient, currentStaff, role } = useAuth();
  const isLoggedIn = !!currentPatient || !!currentStaff;

  return (
    <Routes>
      {/* Public Landing & Login */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Main Admin Route */}
      <Route
        path="/admin/main"
        element={
          <RequireAuth allowedRoles={['main_admin', 'admin']}>
            <MainAdminDashboard />
          </RequireAuth>
        }
      />

      {/* Hospital Admin Route */}
      <Route
        path="/admin/hospital"
        element={
          <RequireAuth allowedRoles={['hospital_admin', 'admin']}>
            <HospitalAdminDashboard />
          </RequireAuth>
        }
      />

      {/* General Admin Route */}
      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['main_admin', 'hospital_admin', 'admin']}>
            <AdminDashboard />
          </RequireAuth>
        }
      />

      {/* Staff Routes */}
      <Route
        path="/reception"
        element={
          <RequireAuth allowedRoles={['receptionist']}>
            <ReceptionDashboard />
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

      {/* Patient Route */}
      <Route
        path="/patient"
        element={
          <RequireAuth allowedRoles={['patient']}>
            <PatientDashboard />
          </RequireAuth>
        }
      />

      {/* Catch-all: Redirect based on role or to login */}
      <Route
        path="*"
        element={
          isLoggedIn && role ? (
            <Navigate
              to={
                {
                  main_admin: '/admin/main',
                  hospital_admin: '/admin/hospital',
                  admin: '/admin',
                  doctor: '/doctor',
                  receptionist: '/reception',
                  patient: '/patient',
                }[role] || '/'
              }
              replace
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}
