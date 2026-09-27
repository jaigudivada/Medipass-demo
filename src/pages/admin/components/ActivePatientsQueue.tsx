import React from 'react';

interface ActivePatientsQueueProps {
  sessions: any[];
  onSelectPatient: (patientId: string) => void;
  selectedPatientId: string | null;
}

export const ActivePatientsQueue: React.FC<ActivePatientsQueueProps> = ({
  sessions,
  onSelectPatient,
  selectedPatientId,
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-500">
        No active patient check-in sessions recorded today.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((sess) => {
        const isSelected = sess.patientId === selectedPatientId;
        return (
          <div
            key={sess.id}
            onClick={() => onSelectPatient(sess.patientId)}
            className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
              isSelected
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="font-bold text-slate-900">
                {sess.patientName || `Patient (OP #${sess.opNumber || '—'})`}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                OP #{sess.opNumber || 'N/A'} • {sess.doctorName || 'Assigned Physician'}
              </div>
            </div>

            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                sess.status === 'checked_in'
                  ? 'bg-amber-100 text-amber-800'
                  : sess.status === 'consulted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {sess.status.replace('_', ' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
};
