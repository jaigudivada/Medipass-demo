import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useAuth } from '../../context/AuthContext';
import {
  useHospitalStaffListener,
  useHospitalSessionsListener,
} from '../../hooks/useRealTimeListeners';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { StaffManagement } from './tabs/StaffManagement';
import { PatientsManagement } from './tabs/PatientsManagement';
import { HospitalAdminStats } from './components/HospitalAdminStats';

export const HospitalAdminDashboard: React.FC = () => {
  const { hospitalId } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('staff');

  const targetHospitalId = hospitalId || 'apollo_hosp_001';

  // Real-time listeners for assigned hospital
  useHospitalStaffListener(targetHospitalId, setStaff);
  useHospitalSessionsListener(targetHospitalId, setSessions);

  return (
    <PageContainer roleName="Hospital Administrator">
      <div className="space-y-6">
        
        {/* Real-Time Facility Stats */}
        <HospitalAdminStats staff={staff} sessions={sessions} />

        {/* Tabbed Hospital Management Workspace */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 w-fit">
              <TabsTrigger
                value="staff"
                className="px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                👥 Staff Roster ({staff.length})
              </TabsTrigger>

              <TabsTrigger
                value="patients"
                className="px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                🧑🤝 Patient Directory ({sessions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="staff">
              <StaffManagement
                staff={staff}
                hospitalId={targetHospitalId}
              />
            </TabsContent>

            <TabsContent value="patients">
              <PatientsManagement
                sessions={sessions}
                hospitalId={targetHospitalId}
              />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </PageContainer>
  );
};

export default HospitalAdminDashboard;
