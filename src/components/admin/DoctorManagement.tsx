import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import {
  getStaff,
  getHospitals,
  toggleStaffStatus,
  Staff,
  Hospital,
} from '../../lib/firestore';
import { saveStaffAccount } from '../../lib/staffAccountCreator';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleEditClick = (docItem: Staff) => {
    setEditingId(docItem.id);
    setName(docItem.name);
    setEmail(docItem.email || '');
    setPassword('');
    setHospitalId(docItem.hospitalId || '');
    setSpecialty(docItem.specialty || '');
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
      <Card className="bg-white border-slate-200 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">
            {editingId ? 'Edit Physician Details' : 'Add New Physician'}
          </CardTitle>
          <CardDescription>
            {editingId ? 'Update doctor credentials.' : 'Register doctor with Firebase credentials.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Doctor Name</label>
              <Input
                type="text"
                placeholder="Doctor full name"
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
                placeholder="Specialty (e.g. Cardiology)"
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
                {editingId ? 'Update Password (optional)' : 'Password'}
              </label>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="default" size="sm" className="w-full" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Save Doctor' : 'Add Doctor'}
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

      <Card className="bg-white border-slate-200 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Physicians Roster</CardTitle>
            <span className="text-xs font-semibold text-slate-600">{doctors.length} Doctors</span>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading physician roster...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No doctors registered.</div>
          ) : (
            <div className="space-y-3">
              {doctors.map((docItem) => (
                <div
                  key={docItem.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{docItem.name}</span>
                      <span className="text-xs font-medium text-slate-600">
                        {docItem.specialty || 'General'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {docItem.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Hospital: {getHospitalName(docItem.hospitalId)} • Email: {docItem.email || 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleEditClick(docItem)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleToggleStatus(docItem)}
                    >
                      {docItem.status === 'active' ? 'Deactivate' : 'Activate'}
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
