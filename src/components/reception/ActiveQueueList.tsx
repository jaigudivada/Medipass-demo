import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Session, subscribeToHospitalSessions, updateSessionStatus } from '../../lib/firestore';
import { Users, UserCheck, Clock, CheckCircle2, LogOut, Bed } from 'lucide-react';

interface ActiveQueueListProps {
  hospitalId: string;
}

export const ActiveQueueList: React.FC<ActiveQueueListProps> = ({ hospitalId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    const unsubscribe = subscribeToHospitalSessions(hospitalId, (data) => {
      setSessions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [hospitalId]);

  const handleStatusChange = async (sessionId: string, newStatus: 'admitted' | 'discharged') => {
    try {
      await updateSessionStatus(sessionId, newStatus);
    } catch (err) {
      console.error('Failed to update session status:', err);
    }
  };

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'registered':
        return <Badge variant="outline" className="border-slate-300 text-slate-700">Registered</Badge>;
      case 'checked_in':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Checked In</Badge>;
      case 'consulted':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Consulted</Badge>;
      case 'admitted':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Admitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Hospital Active OPD & Inpatient Queue</span>
          </CardTitle>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            {sessions.length} Active Sessions
          </Badge>
        </div>
        <CardDescription>
          Real-time live queue of checked-in, consulted, and admitted patients for this hospital.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">Loading active queue...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No active patient visits currently in queue for this hospital.
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{s.patientName || 'Patient'}</span>
                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {s.opNumber}
                    </span>
                    {getStatusBadge(s.status)}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span>Phone: {s.patientPhone || 'N/A'}</span>
                    <span>•</span>
                    <span>Doctor: <strong className="text-slate-700">{s.doctorName || 'Unassigned'}</strong></span>
                  </div>
                </div>

                {/* Status Advancement Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {s.status === 'consulted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50 gap-1 text-[11px]"
                      onClick={() => handleStatusChange(s.id, 'admitted')}
                    >
                      <Bed className="w-3.5 h-3.5" />
                      <span>Admit</span>
                    </Button>
                  )}

                  {(s.status === 'consulted' || s.status === 'admitted' || s.status === 'checked_in') && (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-slate-800 hover:bg-slate-900 text-white gap-1 text-[11px]"
                      onClick={() => handleStatusChange(s.id, 'discharged')}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Discharge</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
