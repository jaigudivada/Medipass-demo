import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Session, subscribeToDoctorQueue } from '../../lib/firestore';

interface DoctorQueueProps {
  hospitalId: string;
  doctorId: string;
  onSelectPatient: (opNumber: string) => void;
}

export const DoctorQueue: React.FC<DoctorQueueProps> = ({
  hospitalId,
  doctorId,
  onSelectPatient,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId || !doctorId) return;
    const unsubscribe = subscribeToDoctorQueue(hospitalId, doctorId, (list) => {
      setSessions(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [hospitalId, doctorId]);

  const handleOpenPatientDetail = (opNumber: string) => {
    onSelectPatient(opNumber);
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Today's OPD Consultation Queue
          </CardTitle>
          <span className="text-xs font-semibold text-slate-700">
            {sessions.length} Assigned Patients
          </span>
        </div>
        <CardDescription>
          Checked-in patients waiting for consultation. Click "View Records" to open clinical timeline.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">Loading consultation queue...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No patients currently waiting in your OPD queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl p-4 space-y-3 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{s.patientName || 'Patient'}</span>
                    <span className="text-xs font-medium text-slate-600">
                      {s.status === 'checked_in' ? 'Checked In' : 'Consulted'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div>
                      <strong className="text-slate-700">OP Number:</strong>{' '}
                      <span className="font-mono font-bold text-blue-600 ml-1">{s.opNumber}</span>
                    </div>
                    <div>
                      <strong className="text-slate-700">Phone:</strong> {s.patientPhone || 'N/A'}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="default"
                  className="w-full mt-2"
                  onClick={() => handleOpenPatientDetail(s.opNumber)}
                >
                  View Records & History
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
