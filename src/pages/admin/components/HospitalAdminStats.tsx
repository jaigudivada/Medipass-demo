import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';

interface HospitalAdminStatsProps {
  staff: any[];
  sessions: any[];
}

export const HospitalAdminStats: React.FC<HospitalAdminStatsProps> = ({
  staff,
  sessions,
}) => {
  const doctorsCount = staff.filter((s) => s.role === 'doctor').length;
  const receptionistsCount = staff.filter((s) => s.role === 'receptionist').length;
  const activeSessionsCount = sessions.filter((s) =>
    ['registered', 'checked_in', 'consulted'].includes(s.status)
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Physicians
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {doctorsCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            🩺
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Desk Reception Staff
            </p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">
              {receptionistsCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
            👩💻
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Patient Visits
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {activeSessionsCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            📋
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
