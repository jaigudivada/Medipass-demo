import React, { useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { CheckInFlow } from '../../components/reception/CheckInFlow';
import { ActiveQueueList } from '../../components/reception/ActiveQueueList';
import { FileManagementPanel } from '../../components/reception/FileManagementPanel';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { initPageAnimations } from '../../lib/animations';
import { getHospitalById, Hospital } from '../../lib/firestore';

export default function ReceptionDashboard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { currentStaff, hospitalId: authHospitalId } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    async function loadData() {
      const targetHospitalId = currentStaff?.hospitalId || authHospitalId;
      if (targetHospitalId) {
        const hosp = await getHospitalById(targetHospitalId);
        setHospital(hosp);
      }
    }
    loadData();
  }, [currentStaff, authHospitalId]);

  useEffect(() => {
    if (containerRef.current) {
      const cleanup = initPageAnimations(containerRef.current);
      return cleanup;
    }
  }, []);

  const hospitalId = hospital?.id || currentStaff?.hospitalId || '';
  const hospitalName = hospital?.name || '';
  const staffId = currentStaff?.id || '';

  return (
    <PageContainer roleName="Receptionist">
      <div ref={containerRef} className="space-y-6">
        
        {/* Banner */}
        <Card className="bg-white border-slate-200 font-sans">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900">Front Desk & Reception Desk</h1>
              <p className="text-xs text-slate-500">
                Verify patient mobile identity, generate transactional OP numbers, manage live OPD queue, and attach clinical documents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              {hospitalName && (
                <span>{hospitalName}</span>
              )}
              {currentStaff && (
                <span className="font-semibold text-slate-800 border-l border-slate-200 pl-3">
                  {currentStaff.name} {currentStaff.department ? `(${currentStaff.department})` : ''}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <CheckInFlow hospitalId={hospitalId} hospitalName={hospitalName} />
            <ActiveQueueList hospitalId={hospitalId} />
          </div>

          <div className="space-y-6">
            <FileManagementPanel hospitalId={hospitalId} staffId={staffId} />
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
