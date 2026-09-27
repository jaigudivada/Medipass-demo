import React, { useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { HospitalManagement } from '../../components/admin/HospitalManagement';
import { DoctorManagement } from '../../components/admin/DoctorManagement';
import { ReceptionistManagement } from '../../components/admin/ReceptionistManagement';
import { Card, CardContent } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { initPageAnimations } from '../../lib/animations';

export default function AdminDashboard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('hospitals');

  useEffect(() => {
    if (containerRef.current) {
      const cleanup = initPageAnimations(containerRef.current);
      return cleanup;
    }
  }, []);

  return (
    <PageContainer roleName="Administrator">
      <div ref={containerRef} className="space-y-6">
        
        {/* Banner */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900">Hospital System Administration</h1>
              <p className="text-xs text-slate-500">
                Manage hospital directories, physician rosters, reception staff assignments, and facility status toggles.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 w-fit">
              <TabsTrigger
                value="hospitals"
                className="px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Hospitals Directory
              </TabsTrigger>

              <TabsTrigger
                value="doctors"
                className="px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Physicians Roster
              </TabsTrigger>

              <TabsTrigger
                value="receptionists"
                className="px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Reception Staff
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hospitals">
              <HospitalManagement />
            </TabsContent>

            <TabsContent value="doctors">
              <DoctorManagement />
            </TabsContent>

            <TabsContent value="receptionists">
              <ReceptionistManagement />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </PageContainer>
  );
}
