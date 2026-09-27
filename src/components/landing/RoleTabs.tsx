import React from 'react';
import { TabsList, TabsTrigger } from '../ui/Tabs';
import { UserRole } from '../../context/AuthContext';

interface RoleTabsProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleTabs: React.FC<RoleTabsProps> = () => {
  return (
    <TabsList className="mb-4 flex flex-wrap gap-1 bg-[#F8F9FA] p-1 border border-[#E2E4E9] rounded-xl w-full">
      <TabsTrigger value="patient" className="text-xs font-semibold px-2.5 py-1.5 flex-1">Patient</TabsTrigger>
      <TabsTrigger value="doctor" className="text-xs font-semibold px-2.5 py-1.5 flex-1">Doctor</TabsTrigger>
      <TabsTrigger value="receptionist" className="text-xs font-semibold px-2.5 py-1.5 flex-1">Receptionist</TabsTrigger>
      <TabsTrigger value="main_admin" className="text-xs font-semibold px-2.5 py-1.5 flex-1">Main Admin</TabsTrigger>
      <TabsTrigger value="hospital_admin" className="text-xs font-semibold px-2.5 py-1.5 flex-1">Hospital Admin</TabsTrigger>
    </TabsList>
  );
};

