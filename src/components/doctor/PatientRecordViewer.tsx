import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import {
  getSessionByOpNumber,
  getPatientById,
  getRecordsByPatient,
  getHospitalById,
  Session,
  Patient,
  MedicalRecordDoc,
} from '../../lib/firestore';
import { User, Phone, FileText, Activity, Heart, Thermometer, Wind, Weight, Eye, ArrowLeft, Building2, Stethoscope, AlertTriangle } from 'lucide-react';

import { EmbeddedDocumentViewer } from '../patient/EmbeddedDocumentViewer';

interface PatientRecordViewerProps {
  opNumber: string;
  onBack: () => void;
}

export const PatientRecordViewer: React.FC<PatientRecordViewerProps> = ({ opNumber, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('');
  const [records, setRecords] = useState<MedicalRecordDoc[]>([]);

  // Modal for view-only original document viewing & page-wise AI summary
  const [viewingRecord, setViewingRecord] = useState<MedicalRecordDoc | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!opNumber) return;
      setLoading(true);
      try {
        const sess = await getSessionByOpNumber(opNumber);
        if (sess) {
          setSession(sess);
          if (sess.hospitalId) {
            const h = await getHospitalById(sess.hospitalId);
            if (h) setHospitalName(h.name);
          }
          if (sess.patientId) {
            const pat = await getPatientById(sess.patientId);
            setPatient(pat);
            const recs = await getRecordsByPatient(sess.patientId);
            setRecords(recs);
          }
        }
      } catch (err) {
        console.error('Error loading patient detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [opNumber]);

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs font-medium">
        Loading patient records and clinical history...
      </div>
    );
  }

  if (!session || !patient) {
    return (
      <Card className="bg-white border-slate-200 p-6 text-center">
        <p className="text-xs text-slate-500">Visit reference or patient record not found.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="mt-3">
          Back to Queue
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to OPD Queue</span>
        </Button>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-mono font-bold">
          OP Number: {session.opNumber}
        </Badge>
      </div>

      {/* Patient Demographics Card */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {patient.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                <Badge variant="secondary">Blood Group {patient.bloodGroup}</Badge>
                <Badge variant="outline">{patient.age} Yrs</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {patient.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> {hospitalName}
                </span>
                {patient.allergies && patient.allergies.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-700 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Allergies: {patient.allergies.join(', ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Longitudinal Clinical Record Timeline */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Longitudinal Health & Diagnostic Records</span>
          </CardTitle>
          <CardDescription>
            Read-only clinical history for attending physician evaluation.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {records.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No historical medical records uploaded for this patient yet.
            </p>
          ) : (
            records.map((rec) => (
              <div key={rec.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="capitalize bg-blue-600">
                      {rec.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      {rec.date?.seconds
                        ? new Date(rec.date.seconds * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Recent'}
                    </span>
                  </div>

                  {/* View Original File & AI Summary Button */}
                  {(rec.sourceFileUrl || rec.attachments) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 hover:bg-slate-100"
                      onClick={() => setViewingRecord(rec)}
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Files & AI Summary</span>
                    </Button>
                  )}
                </div>

                {/* Vitals Summary if present */}
                {rec.vitals && Object.values(rec.vitals).some((v) => v !== null && v !== undefined) && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {rec.vitals.bloodPressure && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                        <span className="font-bold text-slate-800">{rec.vitals.bloodPressure}</span>
                      </div>
                    )}
                    {rec.vitals.heartRate && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-semibold">Heart Rate</span>
                        <span className="font-bold text-slate-800">{rec.vitals.heartRate} bpm</span>
                      </div>
                    )}
                    {rec.vitals.temperature && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-semibold">Temperature</span>
                        <span className="font-bold text-slate-800">{rec.vitals.temperature} °F</span>
                      </div>
                    )}
                    {rec.vitals.spo2 && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
                        <span className="font-bold text-slate-800">{rec.vitals.spo2}%</span>
                      </div>
                    )}
                    {rec.vitals.weight && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-semibold">Weight</span>
                        <span className="font-bold text-slate-800">{rec.vitals.weight} kg</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Clinical Overview */}
                {rec.aiExplanation && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      MediPass AI Clinical Summary:
                    </span>
                    <p className="font-sans text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
                      {typeof rec.aiExplanation === 'object' ? rec.aiExplanation.summary : rec.aiExplanation}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Embedded Multi-File Document Viewer Dialog for Doctor */}
      {viewingRecord && (
        <Dialog
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          title="Clinical Document Scans & Page-Wise Summary"
          maxWidth="lg"
        >
          <EmbeddedDocumentViewer
            primaryUrl={viewingRecord.sourceFileUrl}
            attachments={viewingRecord.attachments}
            aiExplanation={typeof viewingRecord.aiExplanation === 'object' ? viewingRecord.aiExplanation : { summary: viewingRecord.aiExplanation }}
            hospitalName={hospitalName}
            docTypeLabel={viewingRecord.type}
          />
        </Dialog>
      )}
    </div>
  );
};
