import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

const AddSemesterModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    semesterNumber: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    isActive: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/semesters', formData);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create semester');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add Semester</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semester No. <span className="text-red-500">*</span></label>
              <input 
                type="number" min="1" max="10"
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                placeholder="E.g. 3"
                value={formData.semesterNumber}
                onChange={e => setFormData({...formData, semesterNumber: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                placeholder="E.g. 2025-2026"
                value={formData.academicYear}
                onChange={e => setFormData({...formData, academicYear: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
              />
              Set as Current Active Semester
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Check this only if you are currently studying in this semester.
            </p>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Semester'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSemesterModal;
