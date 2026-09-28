import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import {
  useHospitalStaffListener,
  useHospitalSessionsListener,
  useHospitalDocumentListener,
} from '../../hooks/useRealTimeListeners';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { StaffManagement } from './tabs/StaffManagement';
import { PatientsManagement } from './tabs/PatientsManagement';
import { HospitalAdminStats } from './components/HospitalAdminStats';

export const HospitalAdminDashboard: React.FC = () => {
  const { hospitalId } = useAuth();
  const [hospital, setHospital] = useState<any | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('staff');

  const targetHospitalId = hospitalId;

  // Real-time listeners for assigned hospital
  useHospitalDocumentListener(targetHospitalId, setHospital);
  useHospitalStaffListener(targetHospitalId, setStaff);
  useHospitalSessionsListener(targetHospitalId, setSessions);

  return (
    <PageContainer roleName="Hospital Administrator">
      <div className="space-y-6">
        
        {/* Banner */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900">Hospital Administration Portal</h1>
              <p className="text-xs text-slate-500">
                Manage staff accounts, credentials, and track live clinical sessions for {hospital?.name || 'your hospital facility'}.
              </p>
            </div>

            {hospital && (
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span>{hospital.name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    hospital.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {hospital.status || 'active'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

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
