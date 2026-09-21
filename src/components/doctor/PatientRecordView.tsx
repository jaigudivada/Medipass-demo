import React, { useState } from 'react';
import { Patient, MedicalRecordDoc as MedicalRecord } from '../../lib/firestore';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Eye, Calendar, Activity, CheckCircle2, Lock } from 'lucide-react';

export interface PatientRecordViewProps {
  patient: Patient | null;
  records: MedicalRecord[];
}

export const PatientRecordView: React.FC<PatientRecordViewProps> = ({ patient, records }) => {
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);

  if (!patient) {
    return (
      <Card className="bg-white border-slate-200">
        <CardContent className="p-12 text-center text-xs text-slate-500 space-y-2">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-slate-700">Select a Checked-In Patient</p>
          <p className="max-w-xs mx-auto text-slate-500">
            Select a patient from today's live OPD queue to view their read-only medical timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Patient Card & Privacy Notice */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{patient.name}</h3>
                <p className="text-xs text-slate-500">
                  Phone: {patient.phone} • Age: {patient.age}
                </p>
              </div>
            </div>

            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Checked-In Queue Access</span>
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Blood Group</span>
              <span className="font-bold text-slate-800">{patient.bloodGroup}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Allergies</span>
              <span className="font-bold text-amber-700">{(patient.allergies || []).join(', ') || 'None'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Access Scope</span>
              <span className="font-bold text-blue-600">Read-Only View</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read-Only Records List */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Read-Only Health Records</span>
        </h4>

        <div className="space-y-3">
          {records.map((rec) => (
            <Card key={rec.id} className="bg-white border-slate-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {rec.type}
                  </span>
                  <span>{rec.hospitalName} • {rec.doctorName}</span>
                </div>

                <h5 className="font-bold text-slate-900 text-sm">{rec.type} Record</h5>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                  {rec.extractedText}
                </p>

                {/* View Original Source Document Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Document scan on file</span>
                  <Button
                    onClick={() => setViewDocUrl(rec.sourceFileUrl)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Original Source Document</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Document Dialog */}
      <Dialog
        isOpen={!!viewDocUrl}
        onClose={() => setViewDocUrl(null)}
        title="Original Source Document"
        description="Read-only clinical document scan"
        maxWidth="xl"
      >
        <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex justify-center max-h-[60vh] overflow-y-auto">
          {viewDocUrl && (
            <img
              src={viewDocUrl}
              alt="Source Document"
              className="max-w-full rounded object-contain"
            />
          )}
        </div>
      </Dialog>

    </div>
  );
};
