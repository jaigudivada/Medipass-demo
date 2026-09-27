import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { toggleStaffStatus, deleteStaff } from '../../../lib/firestore';

interface DoctorsListProps {
  doctors: any[];
  hospitalId: string;
}

export const DoctorsList: React.FC<DoctorsListProps> = ({ doctors }) => {
  const handleToggle = async (id: string, currentStatus: 'active' | 'inactive') => {
    try {
      await toggleStaffStatus(id, currentStatus);
    } catch (err) {
      console.error('Error toggling doctor status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this doctor from the roster?')) return;
    try {
      await deleteStaff(id);
    } catch (err) {
      console.error('Error deleting doctor:', err);
    }
  };

  return (
    <div className="space-y-3">
      {doctors.map((doc) => (
        <Card key={doc.id} className="bg-white border-slate-200">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                <span className="text-[11px] bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded">
                  {doc.specialty || 'General Medicine'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{doc.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  doc.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {doc.status}
              </span>

              <button
                onClick={() => handleToggle(doc.id, doc.status || 'active')}
                className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
              >
                {doc.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={() => handleDelete(doc.id)}
                className="text-xs px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </CardContent>
        </Card>
      ))}

      {doctors.length === 0 && (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-8 text-center text-xs text-slate-500">
            No doctors on roster yet. Click "+ Add Doctor" to assign physicians.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
