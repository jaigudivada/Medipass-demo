import React, { useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { DoctorQueue } from '../../components/doctor/DoctorQueue';
import { PatientRecordViewer } from '../../components/doctor/PatientRecordViewer';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { initPageAnimations } from '../../lib/animations';
import { getHospitalById, Hospital } from '../../lib/firestore';

export default function DoctorDashboard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { currentStaff, hospitalId: authHospitalId } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [selectedOpNumber, setSelectedOpNumber] = useState<string | null>(null);

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
  const doctorId = currentStaff?.id || '';

  return (
    <PageContainer roleName="Doctor">
      <div ref={containerRef} className="space-y-6">
        
        {/* Banner */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900">OPD Physician Consultation Desk</h1>
              <p className="text-xs text-slate-500">
                View today's assigned OPD patients, evaluate records, and manage consultation workflow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              {hospital && (
                <span>{hospital.name}</span>
              )}
              {currentStaff && (
                <span className="font-semibold text-slate-800 border-l border-slate-200 pl-3">
                  {currentStaff.name} {currentStaff.specialty ? `(${currentStaff.specialty})` : ''}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <div>
          {selectedOpNumber ? (
            <PatientRecordViewer
              opNumber={selectedOpNumber}
              onBack={() => setSelectedOpNumber(null)}
            />
          ) : (
            <DoctorQueue
              hospitalId={hospitalId}
              doctorId={doctorId}
              onSelectPatient={(opNumber) => setSelectedOpNumber(opNumber)}
            />
          )}
        </div>

      </div>
    </PageContainer>
  );
}
