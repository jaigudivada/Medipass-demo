import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, User } from 'lucide-react';
import { clsx } from 'clsx';

export interface PatientQueueListProps {
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
}

export const PatientQueueList: React.FC<PatientQueueListProps> = ({
  selectedPatientId,
  onSelectPatient
}) => {
  const { queue } = useAppState();

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Today's OPD Queue</span>
          </CardTitle>
          <Badge variant="default">{queue.length} Checked In</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No patients currently checked in for OPD queue.
          </div>
        ) : (
          queue.map((item) => {
            const isSelected = selectedPatientId === item.patientId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectPatient(item.patientId)}
                className={clsx(
                  'p-3.5 rounded-lg border cursor-pointer transition-all',
                  isSelected
                    ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{item.patientName}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.checkInTime}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <span>Age {item.patientAge} • {item.patientGender}</span>
                  <span>•</span>
                  <span className="font-semibold text-blue-600">{item.bloodGroup}</span>
                </div>

                <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                  Reason: {item.reason}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
