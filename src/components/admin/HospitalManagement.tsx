import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  getHospitals,
  addHospital,
  updateHospital,
  toggleHospitalStatus,
  deleteHospital,
  Hospital,
} from '../../lib/firestore';
import { Building2, Plus, Edit2, Power, Check, X, Trash2 } from 'lucide-react';

export const HospitalManagement: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [departmentsStr, setDepartmentsStr] = useState('');

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
  };

  const [deptError, setDeptError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!departmentsStr.trim()) {
      setDeptError('Please enter at least one department (comma-separated).');
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
    if (window.confirm(`Are you sure you want to delete ${h.name}? This action cannot be undone.`)) {
      await deleteHospital(h.id);
      loadData();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Column */}
      <Card className="bg-white border-slate-200 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{editingId ? 'Edit Hospital Facility' : 'Register New Hospital'}</span>
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
              <label className="font-semibold text-slate-700 block mb-1">Address / Location</label>
              <Input
                type="text"
                placeholder="Enter address / location"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <Input
                type="text"
                placeholder="Enter contact phone number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Email</label>
              <Input
                type="email"
                placeholder="Enter contact email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Departments (comma separated)</label>
              <Input
                type="text"
                placeholder="Enter departments (e.g. General Medicine, Pediatrics)"
                value={departmentsStr}
                onChange={(e) => {
                  setDepartmentsStr(e.target.value);
                  setDeptError(null);
                }}
                required
                className="text-xs"
              />
              {deptError && <p className="text-xs text-red-500 font-medium mt-1">{deptError}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="default" size="sm" className="w-full">
                {editingId ? <Check className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                <span>{editingId ? 'Save Changes' : 'Add Hospital'}</span>
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

      {/* Hospital List Column */}
      <Card className="bg-white border-slate-200 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Registered Hospitals Directory</span>
            </CardTitle>
            <Badge variant="secondary">{hospitals.length} Hospitals</Badge>
          </div>
          <CardDescription>
            Historical visits link to these facilities. Deactivation disables new check-ins while preserving audit trail.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading hospitals directory...</div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No hospitals registered yet.</div>
          ) : (
            <div className="space-y-3">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    h.status === 'active'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-100 border-slate-300 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{h.name}</span>
                      {h.status === 'active' ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-400 text-slate-600">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-slate-500 space-y-0.5 text-[11px]">
                      <div>Address: {h.address || 'N/A'} • Contact: {h.contactNumber || 'N/A'}</div>
                      <div>Departments: {h.departments ? h.departments.join(', ') : 'General'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      onClick={() => handleEditClick(h)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs gap-1 ${
                        h.status === 'active'
                          ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                      }`}
                      onClick={() => handleToggleStatus(h)}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{h.status === 'active' ? 'Deactivate' : 'Activate'}</span>
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
