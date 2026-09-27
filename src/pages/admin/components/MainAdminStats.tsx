import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';

interface MainAdminStatsProps {
  hospitals: any[];
}

export const MainAdminStats: React.FC<MainAdminStatsProps> = ({ hospitals }) => {
  const activeHospitals = hospitals.filter((h) => h.status === 'active').length;
  const totalDepartments = hospitals.reduce(
    (acc, h) => acc + (h.departments?.length || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Facilities
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {hospitals.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            🏥
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Network
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {activeHospitals}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            ✓
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clinical Departments
            </p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {totalDepartments}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            🔬
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
