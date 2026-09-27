import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useHospitalListListener } from '../../hooks/useRealTimeListeners';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { HospitalsManagement } from './tabs/HospitalsManagement';
import { HospitalAdminsManagement } from './tabs/HospitalAdminsManagement';
import { MainAdminStats } from './components/MainAdminStats';

export const MainAdminDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('hospitals');

  // Real-time listener for all hospitals across network
  useHospitalListListener(setHospitals);

  return (
    <PageContainer roleName="Main System Administrator">
      <div className="space-y-6">
        
        {/* Real-Time Stats Overview */}
        <MainAdminStats hospitals={hospitals} />

        {/* Tabbed Management Workspace */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 w-fit">
              <TabsTrigger
                value="hospitals"
                className="px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                📍 Hospital Facilities ({hospitals.length})
              </TabsTrigger>
              <TabsTrigger
                value="admins"
                className="px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                👨💼 Hospital Administrators
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hospitals">
              <HospitalsManagement hospitals={hospitals} />
            </TabsContent>

            <TabsContent value="admins">
              <HospitalAdminsManagement hospitals={hospitals} />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </PageContainer>
  );
};

export default MainAdminDashboard;
