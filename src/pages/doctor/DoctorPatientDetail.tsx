import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PatientRecordViewer } from '../../components/doctor/PatientRecordViewer';

export default function DoctorPatientDetail() {
  const { opNumber } = useParams<{ opNumber: string }>();
  const navigate = useNavigate();

  return (
    <PageContainer roleName="Doctor">
      {opNumber ? (
        <PatientRecordViewer opNumber={opNumber} onBack={() => navigate('/doctor')} />
      ) : (
        <div className="text-center py-12 text-xs text-slate-500">No OP Number specified.</div>
      )}
    </PageContainer>
  );
}
