import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getPatientById, Patient } from '../../../lib/firestore';

interface PatientDetailsPanelProps {
  session: any;
  hospitalId: string;
}

export const PatientDetailsPanel: React.FC<PatientDetailsPanelProps> = ({
  session,
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.patientId) return;

    async function loadPatient() {
      setLoading(true);
      try {
        const p = await getPatientById(session.patientId);
        setPatient(p);
      } catch (err) {
        console.error('Error fetching patient details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [session?.patientId]);

  if (loading) {
    return (
      <Card className="bg-white border-slate-200">
        <CardContent className="p-6 text-center text-xs text-slate-500">
          Loading patient records...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 space-y-4">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-bold text-slate-900">
          Active Patient File
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        <div>
          <h4 className="text-base font-extrabold text-slate-900">
            {patient?.name || session.patientName || 'Patient'}
          </h4>
          <p className="text-slate-500 font-medium mt-0.5">
            Phone: {patient?.phone || session.patientPhone || '—'}
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Blood Group:</span>
            <span className="font-bold text-slate-900">{patient?.bloodGroup || 'O+'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Age:</span>
            <span className="font-bold text-slate-900">{patient?.age || 28} Yrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">OP Number:</span>
            <span className="font-bold text-blue-600 font-mono">{session.opNumber || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Visit Status:</span>
            <span className="font-semibold capitalize text-amber-700">
              {session.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {patient?.allergies && patient.allergies.length > 0 && (
          <div className="bg-red-50 p-3 rounded-xl border border-red-200">
            <span className="font-bold text-red-900 block mb-1">Medical Allergies:</span>
            <p className="text-red-800 font-medium">{patient.allergies.join(', ')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
