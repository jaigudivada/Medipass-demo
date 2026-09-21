import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Session, subscribeToDoctorQueue, updateSessionStatus } from '../../lib/firestore';
import { Stethoscope, Clock, Eye, CheckCircle2, User } from 'lucide-react';

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
    // Opening patient record strictly inspects details without modifying visit status
    onSelectPatient(opNumber);
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>Today's OPD Consultation Queue</span>
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            {sessions.length} Assigned Patients
          </Badge>
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
                    {s.status === 'checked_in' ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        Checked In
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Consulted
                      </Badge>
                    )}
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
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  <span>View Records & History</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
