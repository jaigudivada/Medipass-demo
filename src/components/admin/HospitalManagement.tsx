import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  getHospitals,
  addHospital,
  updateHospital,
  toggleHospitalStatus,
  deleteHospital,
  Hospital,
} from '../../lib/firestore';

export const HospitalManagement: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [departmentsStr, setDepartmentsStr] = useState('');
  const [deptError, setDeptError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (h: Hospital) => {
    setEditingId(h.id);
    setName(h.name);
    setAddress(h.address || '');
    setContactNumber(h.contactNumber || '');
    setEmail(h.email || '');
    setDepartmentsStr(h.departments ? h.departments.join(', ') : '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setContactNumber('');
    setEmail('');
    setDepartmentsStr('');
    setDeptError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!departmentsStr.trim()) {
      setDeptError('Please enter at least one department.');
      return;
    }

    setDeptError(null);
    const depts = departmentsStr
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    if (depts.length === 0) {
      setDeptError('Please enter at least one valid department.');
      return;
    }

    if (editingId) {
      await updateHospital(editingId, {
        name: name.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        departments: depts,
      });
    } else {
      await addHospital({
        name: name.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        departments: depts,
        status: 'active',
      });
    }

    handleCancelEdit();
    loadData();
  };

  const handleToggleStatus = async (h: Hospital) => {
    await toggleHospitalStatus(h.id, h.status);
    loadData();
  };

  const handleDelete = async (h: Hospital) => {
    if (window.confirm(`Delete ${h.name}?`)) {
      await deleteHospital(h.id);
      loadData();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-white border-slate-200 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">
            {editingId ? 'Edit Hospital Facility' : 'Register New Hospital'}
          </CardTitle>
          <CardDescription>
            {editingId ? 'Modify facility details.' : 'Add healthcare center to regional directory.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Facility Name</label>
              <Input
                type="text"
                placeholder="Enter facility name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Address</label>
              <Input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <Input
                type="text"
                placeholder="Phone number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Departments (comma separated)</label>
              <Input
                type="text"
                placeholder="General Medicine, Cardiology"
                value={departmentsStr}
                onChange={(e) => {
                  setDepartmentsStr(e.target.value);
                  setDeptError(null);
                }}
                required
                className="text-xs"
              />
              {deptError && <p className="text-xs text-red-500 mt-1">{deptError}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="default" size="sm" className="w-full">
                {editingId ? 'Save Facility' : 'Add Facility'}
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
            <CardTitle className="text-base">Hospital Directory</CardTitle>
            <span className="text-xs font-semibold text-slate-600">{hospitals.length} Facilities</span>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading hospitals...</div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No hospitals registered.</div>
          ) : (
            <div className="space-y-3">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{h.name}</span>
                      <span className="text-xs font-medium text-slate-600">
                        {h.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {h.address} • {h.contactNumber} • {h.email}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Departments: {h.departments?.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleEditClick(h)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleToggleStatus(h)}
                    >
                      {h.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-600"
                      onClick={() => handleDelete(h)}
                    >
                      Delete
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
