import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const MigrationModal = ({ onComplete }) => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  
  // New semester form state
  const [newSem, setNewSem] = useState({
    semesterNumber: '',
    academicYear: '2025-2026',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/semesters');
      if (res.data.success) {
        setSemesters(res.data.semesters);
        if (res.data.semesters.length > 0) {
          setSelectedSemester(res.data.semesters[0]._id);
        } else {
          setShowNewForm(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSemester = async () => {
    try {
      setSubmitting(true);
      const res = await api.post('/semesters', newSem);
      if (res.data.success) {
        const createdId = res.data.semester._id;
        // Proceed to migrate
        await handleMigrate(createdId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create semester');
      setSubmitting(false);
    }
  };

  const handleMigrate = async (semId) => {
    try {
      setSubmitting(true);
      const targetId = semId || selectedSemester;
      if (!targetId) {
        setError('Please select or create a semester');
        setSubmitting(false);
        return;
      }
      
      const res = await api.post('/subjects/migrate', { semesterId: targetId });
      if (res.data.success) {
        onComplete();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Migration failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-amber-800">Action Required: Organize Your Subjects</h2>
            <p className="text-xs text-amber-700 mt-1">We noticed you have existing subjects. To use the new Academics features, please assign them to a semester.</p>
          </div>
        </div>
        
        <div className="p-5">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : showNewForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester Number</label>
                <input 
                  type="number" 
                  min="1" max="10"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500" 
                  value={newSem.semesterNumber}
                  onChange={e => setNewSem({...newSem, semesterNumber: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2025-2026"
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500" 
                  value={newSem.academicYear}
                  onChange={e => setNewSem({...newSem, academicYear: e.target.value})}
                  required
                />
              </div>
              <div className="pt-2">
                <button 
                  onClick={handleCreateSemester}
                  disabled={submitting || !newSem.semesterNumber || !newSem.academicYear}
                  className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Migrating...' : 'Create Semester & Migrate'}
                </button>
              </div>
              {semesters.length > 0 && (
                <button onClick={() => setShowNewForm(false)} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-2">
                  Use an existing semester instead
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Semester</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                >
                  {semesters.map(s => (
                    <option key={s._id} value={s._id}>Semester {s.semesterNumber} ({s.academicYear})</option>
                  ))}
                </select>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => handleMigrate()}
                  disabled={submitting || !selectedSemester}
                  className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Migrating...' : 'Migrate Existing Subjects'}
                </button>
              </div>
              <button onClick={() => setShowNewForm(true)} className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2">
                + Create new semester instead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationModal;
