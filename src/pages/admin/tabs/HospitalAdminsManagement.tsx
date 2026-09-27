import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CreateHospitalAdminModal } from '../modals/CreateHospitalAdminModal';

interface HospitalAdminsManagementProps {
  hospitals: any[];
}

export const HospitalAdminsManagement: React.FC<HospitalAdminsManagementProps> = ({
  hospitals,
}) => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function loadAdmins() {
      try {
        const q = query(
          collection(db, 'staff'),
          where('role', 'in', ['hospital_admin', 'admin'])
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAdmins(list);
      } catch (err) {
        console.error('Error fetching hospital admins:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdmins();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">Hospital Administrators</h2>
          <p className="text-xs text-slate-500">Facility administrative accounts and access rights.</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
        >
          + Add Hospital Admin
        </Button>
      </div>

      {showCreateModal && (
        <CreateHospitalAdminModal
          hospitals={hospitals}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {loading ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-8 text-center text-xs text-slate-500">
            Loading hospital administrators...
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {admins.map((admin) => {
            const assignedHosp = hospitals.find((h) => h.id === admin.hospitalId);
            return (
              <Card key={admin.id} className="bg-white border-slate-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{admin.name}</h4>
                      <span className="text-[11px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                        {assignedHosp?.name || `Hospital ID: ${admin.hospitalId || 'Main'}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{admin.email}</p>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full capitalize">
                    {admin.status || 'active'}
                  </span>
                </CardContent>
              </Card>
            );
          })}

          {admins.length === 0 && (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-12 text-center text-xs text-slate-500">
                No hospital administrators found. Click "+ Add Hospital Admin" to provision an account.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
