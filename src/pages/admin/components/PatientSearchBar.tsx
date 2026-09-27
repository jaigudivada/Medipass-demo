import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '../../../components/ui/Button';

interface PatientSearchBarProps {
  hospitalId: string;
  onSearch: (results: any[]) => void;
}

export const PatientSearchBar: React.FC<PatientSearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const term = searchTerm.trim().toLowerCase();
      const q = query(collection(db, 'patients'));
      const snap = await getDocs(q);
      const matched = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p: any) => {
          const nameMatch = p.name?.toLowerCase().includes(term);
          const phoneMatch = p.phone?.includes(term);
          const idMatch = p.id?.toLowerCase().includes(term);
          return nameMatch || phoneMatch || idMatch;
        });

      onSearch(matched);
    } catch (err) {
      console.error('Patient search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        placeholder="Search patient by name, phone, or OP number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
      />
      <Button
        type="submit"
        disabled={loading || !searchTerm.trim()}
        className="bg-blue-600 text-white text-xs px-4 py-2 rounded-xl"
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
};
