import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Session } from '../../lib/firestore';
import { Clock, Building2, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';

interface VisitStatusCardProps {
  session: Session | null;
}

export const VisitStatusCard: React.FC<VisitStatusCardProps> = ({ session }) => {
  if (!session) {
    return (
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 text-center text-xs text-slate-500 space-y-1">
          <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <p className="font-semibold text-slate-700">No Active OPD Visit Session</p>
          <p className="text-[11px] text-slate-500">
            Visit reception desk at any affiliated hospital to check in for consultation.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'registered':
        return <Badge variant="outline" className="border-slate-300 text-slate-700">Registered</Badge>;
      case 'checked_in':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Checked In (In Queue)</Badge>;
      case 'consulted':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Consulted</Badge>;
      case 'admitted':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Admitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-blue-600">{session.opNumber}</span>
            {getStatusBadge(session.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Hospital Facility</span>
              <span className="font-semibold text-slate-900">{session.hospitalName || '—'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Assigned Physician</span>
              <span className="font-semibold text-slate-900">{session.doctorName || 'Unassigned'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
