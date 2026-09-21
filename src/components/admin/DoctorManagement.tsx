import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  getStaff,
  getHospitals,
  toggleStaffStatus,
  Staff,
  Hospital,
} from '../../lib/firestore';
import { saveStaffAccount } from '../../lib/staffAccountCreator';
import { Stethoscope, Plus, Edit2, Power, Check } from 'lucide-react';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [specialty, setSpecialty] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const allStaff = await getStaff();
      const docList = allStaff.filter((s) => s.role === 'doctor');
      setDoctors(docList);

      const hosps = await getHospitals();
      setHospitals(hosps);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (doc: Staff) => {
    setEditingId(doc.id);
    setName(doc.name);
    setEmail(doc.email || '');
    setPassword('');
    setHospitalId(doc.hospitalId || '');
    setSpecialty(doc.specialty || '');
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setHospitalId('');
    setSpecialty('');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hospitalId) {
      setFormError('Name and hospital assignment are required.');
      return;
    }
    if (!email.trim()) {
      setFormError('Email address is required.');
      return;
    }

    if (!editingId && (!password || password.length < 6)) {
      setFormError('Password is required and must be at least 6 characters.');
      return;
    }

    if (password && password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await saveStaffAccount({
        id: editingId,
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        role: 'doctor',
        hospitalId: hospitalId,
        specialty: specialty.trim(),
      });

      handleCancelEdit();
      await loadData();
    } catch (err: any) {
      console.error('Error saving doctor:', err);
      setFormError(err?.message || 'Failed to save doctor details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (docItem: Staff) => {
    await toggleStaffStatus(docItem.id, docItem.status);
    loadData();
  };

  const hospitalOptions = hospitals.map((h) => ({
    value: h.id,
    label: h.name,
  }));

  const getHospitalName = (id: string) => {
    const h = hospitals.find((item) => item.id === id);
    return h ? h.name : '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Form Column */}
      <Card className="bg-white border-slate-200 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>{editingId ? 'Edit Physician Details' : 'Add New Physician'}</span>
          </CardTitle>
          <CardDescription>
            {editingId ? 'Update doctor credentials and profile details.' : 'Register doctor with Firebase Auth credentials.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Doctor Name</label>
              <Input
                type="text"
                placeholder="Enter physician full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hospital Assignment</label>
              <Select
                options={hospitalOptions}
                value={hospitalId}
                onChange={setHospitalId}
                placeholder="Select hospital..."
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Medical Specialty</label>
              <Input
                type="text"
                placeholder="Enter medical specialty (e.g. Cardiology)"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {editingId ? 'Update Password (optional)' : 'Login Password'}
              </label>
              <Input
                type="password"
                placeholder={editingId ? 'Leave blank to keep existing' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="default" size="sm" className="w-full" disabled={submitting}>
                {editingId ? <Check className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                <span>{submitting ? 'Saving...' : editingId ? 'Save Doctor' : 'Add Doctor'}</span>
              </Button>
              {editingId && (
                <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Doctor List Column */}
      <Card className="bg-white border-slate-200 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>Medical Staff Roster (Physicians)</span>
            </CardTitle>
            <Badge variant="secondary">{doctors.length} Doctors</Badge>
          </div>
          <CardDescription>
            Only active doctors registered to a hospital appear in reception OPD queue assignment dropdowns.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading physician roster...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No doctors registered yet.</div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    doc.status === 'active'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-100 border-slate-300 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                        {doc.specialty || 'General'}
                      </Badge>
                      {doc.status === 'active' ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-400 text-slate-600">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Hospital: <strong className="text-slate-700">{getHospitalName(doc.hospitalId)}</strong> • Email: {doc.email || 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      onClick={() => handleEditClick(doc)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs gap-1 ${
                        doc.status === 'active'
                          ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                      }`}
                      onClick={() => handleToggleStatus(doc)}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{doc.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


