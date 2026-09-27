import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CreateHospitalModal } from '../modals/CreateHospitalModal';
import { toggleHospitalStatus, deleteHospital } from '../../../lib/firestore';

interface HospitalsManagementProps {
  hospitals: any[];
}

export const HospitalsManagement: React.FC<HospitalsManagementProps> = ({
  hospitals,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleToggle = async (id: string, currentStatus: 'active' | 'inactive') => {
    try {
      await toggleHospitalStatus(id, currentStatus);
    } catch (err) {
      console.error('Error toggling hospital status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this hospital facility?')) return;
    try {
      await deleteHospital(id);
    } catch (err) {
      console.error('Error deleting hospital:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">Hospital Directory</h2>
          <p className="text-xs text-slate-500">Manage network facilities and clinical operational status.</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
        >
          + Add New Hospital
        </Button>
      </div>

      {showCreateModal && (
        <CreateHospitalModal onClose={() => setShowCreateModal(false)} />
      )}

      <div className="grid grid-cols-1 gap-4">
        {hospitals.map((hospital) => (
          <Card key={hospital.id} className="bg-white border-slate-200">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{hospital.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{hospital.address}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                    <span>📞 {hospital.contactNumber || 'N/A'}</span>
                    <span>📧 {hospital.email || 'N/A'}</span>
                  </div>

                  {hospital.departments && hospital.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hospital.departments.map((dept: string) => (
                        <span
                          key={dept}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      hospital.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {hospital.status}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(hospital.id, hospital.status || 'active')}
                      className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg cursor-pointer"
                    >
                      {hospital.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(hospital.id)}
                      className="text-xs px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hospitals.length === 0 && (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center text-xs text-slate-500">
            No hospital facilities created yet. Click "+ Add New Hospital" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
