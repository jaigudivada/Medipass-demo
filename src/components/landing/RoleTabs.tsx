import React from 'react';
import { TabsList, TabsTrigger } from '../ui/Tabs';
import { UserRole } from '../../context/AuthContext';

interface RoleTabsProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleTabs: React.FC<RoleTabsProps> = ({ activeRole, onRoleChange }) => {
  return (
    <TabsList className="mb-2">
      <TabsTrigger value="patient">Patient</TabsTrigger>
      <TabsTrigger value="doctor">Doctor</TabsTrigger>
      <TabsTrigger value="receptionist">Receptionist</TabsTrigger>
      <TabsTrigger value="admin">Admin</TabsTrigger>
    </TabsList>
  );
};
