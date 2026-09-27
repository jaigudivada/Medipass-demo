import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { DoctorsList } from '../components/DoctorsList';
import { ReceptionistsList } from '../components/ReceptionistsList';
import { CreateDoctorModal } from '../modals/CreateDoctorModal';
import { CreateReceptionistModal } from '../modals/CreateReceptionistModal';

interface StaffManagementProps {
  staff: any[];
  hospitalId: string;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staff,
  hospitalId,
}) => {
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddReceptionistModal, setShowAddReceptionistModal] = useState(false);
  const [activeTab, setActiveTab] = useState('doctors');

  const doctors = staff.filter((s) => s.role === 'doctor');
  const receptionists = staff.filter((s) => s.role === 'receptionist');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 w-full sm:w-auto">
            <TabsTrigger
              value="doctors"
              className="px-4 py-2 text-xs font-semibold rounded-lg flex-1 sm:flex-initial"
            >
              🩺 Doctors ({doctors.length})
            </TabsTrigger>
            <TabsTrigger
              value="receptionists"
              className="px-4 py-2 text-xs font-semibold rounded-lg flex-1 sm:flex-initial"
            >
              👩💻 Reception Staff ({receptionists.length})
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() =>
              activeTab === 'doctors'
                ? setShowAddDoctorModal(true)
                : setShowAddReceptionistModal(true)
            }
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer shrink-0"
          >
            + Add {activeTab === 'doctors' ? 'Physician' : 'Receptionist'}
          </Button>
        </div>

        <TabsContent value="doctors">
          <DoctorsList doctors={doctors} hospitalId={hospitalId} />
          {showAddDoctorModal && (
            <CreateDoctorModal
              hospitalId={hospitalId}
              onClose={() => setShowAddDoctorModal(false)}
            />
          )}
        </TabsContent>

        <TabsContent value="receptionists">
          <ReceptionistsList
            receptionists={receptionists}
            hospitalId={hospitalId}
          />
          {showAddReceptionistModal && (
            <CreateReceptionistModal
              hospitalId={hospitalId}
              onClose={() => setShowAddReceptionistModal(false)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
