import React, { useState } from 'react';
import { MedicalRecordDoc } from '../../lib/firestore';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Building2, Stethoscope, Sparkles, Eye } from 'lucide-react';

export interface HealthTimelineProps {
  records: MedicalRecordDoc[];
  onSelectRecord: (record: MedicalRecordDoc) => void;
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({ records, onSelectRecord }) => {
  const [filterTab, setFilterTab] = useState<'all' | 'Prescription' | 'Lab Report'>('all');

  const filtered = records.filter((r) => {
    if (filterTab === 'all') return true;
    return r.type === filterTab;
  });

  return (
    <div className="space-y-4">
      
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Health History Timeline</h2>
          <p className="text-xs text-slate-500">Chronological list of clinical consultations and lab reports.</p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'Prescription', label: 'Prescriptions' },
            { id: 'Lab Report', label: 'Lab Reports' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                filterTab === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filtered.map((record) => (
          <Card key={record.id} className="hover:border-slate-300 transition-colors">
            <CardContent className="p-4 sm:p-5 space-y-3">
              
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-3 text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {record.date} ({record.timestamp})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {record.hospitalName}
                  </span>
                </div>

                <Badge variant={record.type === 'Prescription' ? 'default' : 'secondary'}>
                  {record.type}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{record.title}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  <span>Attending: <strong className="text-slate-700 font-medium">{record.doctorName}</strong> ({record.department})</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {record.summary}
              </p>

              {record.vitals && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">BP</span>
                    <span className="font-semibold text-slate-800">{record.vitals.bp}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                    <span className="font-semibold text-slate-800">{record.vitals.heartRate}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Temp</span>
                    <span className="font-semibold text-slate-800">{record.vitals.temp}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">SpO2</span>
                    <span className="font-semibold text-slate-800">{record.vitals.spO2}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <Button onClick={() => onSelectRecord(record)} variant="secondary" size="sm">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Plain-English Details</span>
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};
