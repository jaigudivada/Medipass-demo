import React from 'react';
import { Input } from '../ui/Input';
import { PatientVitals } from '../../lib/firestore';
import { Activity, Heart, Thermometer, Wind, Weight } from 'lucide-react';

interface VitalsFormProps {
  vitals: PatientVitals;
  onChange: (vitals: PatientVitals) => void;
}

export const VitalsForm: React.FC<VitalsFormProps> = ({ vitals, onChange }) => {
  const handleChange = (field: keyof PatientVitals, value: any) => {
    onChange({
      ...vitals,
      [field]: value === '' ? null : value,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
        <Activity className="w-3.5 h-3.5 text-blue-600" />
        <span>Optional Visit Vitals (Attached to Record)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
            <Activity className="w-3 h-3 text-slate-400" /> Blood Pressure
          </label>
          <Input
            type="text"
            placeholder="e.g. 120/80"
            value={vitals.bloodPressure || ''}
            onChange={(e) => handleChange('bloodPressure', e.target.value)}
            className="text-xs h-8"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-500" /> Heart Rate (bpm)
          </label>
          <Input
            type="number"
            placeholder="e.g. 72"
            value={vitals.heartRate ?? ''}
            onChange={(e) => handleChange('heartRate', e.target.value ? Number(e.target.value) : null)}
            className="text-xs h-8"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-amber-500" /> Temp (°F)
          </label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g. 98.6"
            value={vitals.temperature ?? ''}
            onChange={(e) => handleChange('temperature', e.target.value ? Number(e.target.value) : null)}
            className="text-xs h-8"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
            <Wind className="w-3 h-3 text-teal-500" /> SpO2 (%)
          </label>
          <Input
            type="number"
            placeholder="e.g. 98"
            value={vitals.spo2 ?? ''}
            onChange={(e) => handleChange('spo2', e.target.value ? Number(e.target.value) : null)}
            className="text-xs h-8"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5 flex items-center gap-1">
            <Weight className="w-3 h-3 text-indigo-500" /> Weight (kg)
          </label>
          <Input
            type="number"
            placeholder="e.g. 70"
            value={vitals.weight ?? ''}
            onChange={(e) => handleChange('weight', e.target.value ? Number(e.target.value) : null)}
            className="text-xs h-8"
          />
        </div>
      </div>
    </div>
  );
};
