import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { VisitStatusCard } from '../../components/patient/VisitStatusCard';
import { PhoneUpdateForm } from '../../components/patient/PhoneUpdateForm';
import { PatientUploadModal } from '../../components/patient/PatientUploadModal';
import { EmbeddedDocumentViewer } from '../../components/patient/EmbeddedDocumentViewer';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../context/AuthContext';
import { initPageAnimations } from '../../lib/animations';
import {
  subscribeToActivePatientSession,
  subscribeToPatientRecords,
  Patient,
  Session,
  MedicalRecordDoc,
} from '../../lib/firestore';

export default function PatientDashboard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { currentPatient } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(currentPatient);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<MedicalRecordDoc[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordDoc | null>(null);
  const [showPhoneUpdateModal, setShowPhoneUpdateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (currentPatient) {
      setPatient(currentPatient);
    }
  }, [currentPatient]);

  useEffect(() => {
    if (!patient?.id) return;

    const unsubSession = subscribeToActivePatientSession(patient.id, (sess) => {
      setActiveSession(sess);
    });

    const unsubRecords = subscribeToPatientRecords(patient.id, (recs) => {
      setRecords(recs);
    });

    return () => {
      unsubSession();
      unsubRecords();
    };
  }, [patient?.id]);

  useEffect(() => {
    if (containerRef.current) {
      const cleanup = initPageAnimations(containerRef.current);
      return cleanup;
    }
  }, []);

  if (!patient) {
    return (
      <PageContainer roleName="Patient">
        <div className="text-center py-16 space-y-3 max-w-md mx-auto">
          <p className="text-sm text-slate-700 font-semibold">No Patient Record Loaded</p>
          <p className="text-xs text-slate-500">
            Please sign in with your registered mobile phone number to view your health passport and records.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In with Mobile OTP
          </a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer roleName="Patient">
      <div ref={containerRef} className="space-y-6">
        
        {/* Patient Demographic Card */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                {patient.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                  <span className="text-xs text-slate-500 font-medium">Blood Group {patient.bloodGroup} • {patient.age} Yrs</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span className="font-semibold text-slate-700">
                    {patient.phone}
                  </span>
                  {patient.allergies && patient.allergies.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-slate-700 font-semibold">
                        Allergy: {patient.allergies.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowUploadModal(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700"
              >
                Upload Medical Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhoneUpdateModal(true)}
                className="text-xs"
              >
                Update Phone
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Current Active Visit Status Card */}
        <div>
          <VisitStatusCard session={activeSession} />
        </div>

        {/* Longitudinal Records List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Health Records Timeline</h2>
              <p className="text-xs text-slate-500">Longitudinal consultations and clinical summaries.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(true)}
                className="text-xs"
              >
                Add Record
              </Button>
              <span className="text-xs text-slate-500 font-medium">{records.length} Records</span>
            </div>
          </div>

          {records.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-8 text-center text-xs text-slate-500">
                No health records uploaded yet. Your clinical records will appear here after consultation check-in.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((rec) => (
                <Card key={rec.id} className="bg-white border-slate-200 hover:border-slate-300 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <span className="capitalize">{rec.type.replace('_', ' ')}</span>
                        <span className="text-slate-500 font-normal">{rec.hospitalName || '—'}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs text-blue-600"
                        onClick={() => setSelectedRecord(rec)}
                      >
                        View Explanation & Vitals
                      </Button>
                    </div>

                    {rec.vitals && Object.values(rec.vitals).some((v) => v !== null && v !== undefined) && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {rec.vitals.bloodPressure && (
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">BP</span>
                            <span className="font-bold text-slate-800">{rec.vitals.bloodPressure}</span>
                          </div>
                        )}
                        {rec.vitals.heartRate && (
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Heart Rate</span>
                            <span className="font-bold text-slate-800">{rec.vitals.heartRate} bpm</span>
                          </div>
                        )}
                        {rec.vitals.temperature && (
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Temp</span>
                            <span className="font-bold text-slate-800">{rec.vitals.temperature} °F</span>
                          </div>
                        )}
                        {rec.vitals.spo2 && (
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
                            <span className="font-bold text-slate-800">{rec.vitals.spo2}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Record Detail Panel Modal */}
        {selectedRecord && (
          <Dialog
            isOpen={!!selectedRecord}
            onClose={() => setSelectedRecord(null)}
            title="Clinical Record Details & Advice"
            maxWidth="lg"
          >
            <div className="space-y-4 text-xs text-slate-800">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold capitalize">{selectedRecord.type.replace('_', ' ')}</span>
                  <p className="text-slate-500 font-medium text-[11px] mt-1">
                    Facility: <span className="font-semibold text-slate-700">{selectedRecord.hospitalName || 'Patient Upload'}</span>
                  </p>
                </div>
                {selectedRecord.date && (
                  <span className="text-slate-400 font-medium text-[11px]">
                    {new Date(selectedRecord.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {selectedRecord.vitals && Object.values(selectedRecord.vitals).some((v) => v !== null && v !== undefined) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs">Vitals Recorded During Consultation:</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {selectedRecord.vitals.bloodPressure && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                        <span className="font-bold text-slate-800">{selectedRecord.vitals.bloodPressure}</span>
                      </div>
                    )}
                    {selectedRecord.vitals.heartRate && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Heart Rate</span>
                        <span className="font-bold text-slate-800">{selectedRecord.vitals.heartRate} bpm</span>
                      </div>
                    )}
                    {selectedRecord.vitals.temperature && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Temperature</span>
                        <span className="font-bold text-slate-800">{selectedRecord.vitals.temperature} °F</span>
                      </div>
                    )}
                    {selectedRecord.vitals.spo2 && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
                        <span className="font-bold text-slate-800">{selectedRecord.vitals.spo2}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <EmbeddedDocumentViewer
                primaryUrl={selectedRecord.sourceFileUrl}
                attachments={selectedRecord.attachments}
                aiExplanation={typeof selectedRecord.aiExplanation === 'object' ? selectedRecord.aiExplanation : { summary: selectedRecord.aiExplanation }}
                hospitalName={selectedRecord.hospitalName}
                docTypeLabel={selectedRecord.type}
              />
            </div>
          </Dialog>
        )}

        {/* Phone Update Modal */}
        {showPhoneUpdateModal && (
          <Dialog
            isOpen={showPhoneUpdateModal}
            onClose={() => setShowPhoneUpdateModal(false)}
            title="Update Registered Phone Number"
          >
            <PhoneUpdateForm
              patientId={patient.id}
              currentPhone={patient.phone}
              onPhoneUpdated={(newPhone) => {
                setPatient({ ...patient, phone: newPhone });
                setShowPhoneUpdateModal(false);
              }}
            />
          </Dialog>
        )}

        {/* Patient Document Upload Modal */}
        {showUploadModal && (
          <PatientUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            patientId={patient.id}
            patientName={patient.name}
            onUploadSuccess={() => {}}
          />
        )}

      </div>
    </PageContainer>
  );
}
