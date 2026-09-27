import React, { useState } from 'react';
import { saveStaffAccount } from '../../../lib/staffAccountCreator';
import { Button } from '../../../components/ui/Button';

interface CreateDoctorModalProps {
  hospitalId: string;
  onClose: () => void;
}

export const CreateDoctorModal: React.FC<CreateDoctorModalProps> = ({
  hospitalId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: 'General Medicine',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await saveStaffAccount({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'doctor',
        hospitalId,
        specialty: formData.specialty,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create doctor account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900">Add Physician to Roster</h2>
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
              Physician Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Rajesh Kumar"
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
              Medical Specialty *
            </label>
            <input
              type="text"
              placeholder="e.g. Cardiology, Pediatrics"
              value={formData.specialty}
              onChange={(e) =>
                setFormData({ ...formData, specialty: e.target.value })
              }
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Login Email Address *
            </label>
            <input
              type="email"
              placeholder="dr.rajesh@apollo.demo"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              minLength={6}
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl cursor-pointer"
            >
              {loading ? 'Creating...' : 'Add Doctor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
