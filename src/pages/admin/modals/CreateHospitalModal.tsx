import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '../../../components/ui/Button';

interface CreateHospitalModalProps {
  onClose: () => void;
}

export const CreateHospitalModal: React.FC<CreateHospitalModalProps> = ({
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    departments: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const departmentsArray = formData.departments
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d);

      if (departmentsArray.length === 0) {
        throw new Error('Please enter at least one department');
      }

      await addDoc(collection(db, 'hospitals'), {
        name: formData.name.trim(),
        address: formData.address.trim(),
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        departments: departmentsArray,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create hospital');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">Create New Hospital Facility</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Hospital Facility Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Apollo Health City"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Address & Location *
            </label>
            <input
              type="text"
              placeholder="e.g. Jubilee Hills, Hyderabad"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({ ...formData, contactNumber: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="contact@apollo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Departments (comma separated) *
            </label>
            <input
              type="text"
              value={formData.departments}
              onChange={(e) =>
                setFormData({ ...formData, departments: e.target.value })
              }
              placeholder="General Medicine, Cardiology, Orthopedics"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              required
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Hospital'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
