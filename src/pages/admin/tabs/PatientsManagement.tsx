import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { PatientSearchBar } from '../components/PatientSearchBar';
import { ActivePatientsQueue } from '../components/ActivePatientsQueue';
import { PatientDetailsPanel } from '../components/PatientDetailsPanel';

interface PatientsManagementProps {
  sessions: any[];
  hospitalId: string;
}

export const PatientsManagement: React.FC<PatientsManagementProps> = ({
  sessions,
  hospitalId,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const selectedSession = sessions.find(
    (s) => s.patientId === selectedPatientId
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Search & Active Queue */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Patient Directory Search
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <PatientSearchBar
              hospitalId={hospitalId}
              onSearch={setSearchResults}
            />

            {searchResults.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-600">Search Results:</p>
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className="p-3 border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer bg-slate-50 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{p.phone}</div>
                    </div>
                    <span className="text-blue-600 font-semibold">Select Patient →</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Active Hospital Queue Today ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ActivePatientsQueue
              sessions={sessions}
              onSelectPatient={setSelectedPatientId}
              selectedPatientId={selectedPatientId}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Patient Details Panel */}
      <div>
        {selectedSession ? (
          <PatientDetailsPanel
            session={selectedSession}
            hospitalId={hospitalId}
          />
        ) : (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-8 text-center text-xs text-slate-500">
              Select a patient from the queue or search results to view clinical details.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
