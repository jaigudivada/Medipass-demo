import React, { useState } from 'react';
import { Tabs, TabsContent } from '../ui/Tabs';
import { RoleTabs } from './RoleTabs';
import { PatientLoginForm } from './PatientLoginForm';
import { StaffLoginForm } from './StaffLoginForm';
import { UserRole } from '../../context/AuthContext';

export const LoginPanel: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('patient');

  return (
    <div className="w-full max-w-md bg-white border border-[#E2E4E9] rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="mb-5 text-left">
        <h2 className="text-xl font-bold tracking-tight text-[#1A1D23]">
          Sign in to MediPass
        </h2>
        <p className="text-xs text-[#525866] mt-1">
          Select your access role below to log into the medical portal.
        </p>
      </div>

      <Tabs value={activeRole} onValueChange={(val) => setActiveRole(val as UserRole)}>
        <RoleTabs activeRole={activeRole} onRoleChange={(r) => setActiveRole(r)} />

        <TabsContent value="patient">
          <PatientLoginForm />
        </TabsContent>

        <TabsContent value="doctor">
          <StaffLoginForm role="doctor" />
        </TabsContent>

        <TabsContent value="receptionist">
          <StaffLoginForm role="receptionist" />
        </TabsContent>

        <TabsContent value="admin">
          <StaffLoginForm role="admin" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
