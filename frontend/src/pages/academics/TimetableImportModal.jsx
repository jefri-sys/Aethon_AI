import React, { useState } from 'react';
import { UploadCloud, X, Check, FileText } from 'lucide-react';
import api from '../../services/api';

const TimetableImportModal = ({ semesterId, subjects, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [localSubjects, setLocalSubjects] = useState(subjects);

  const handleCreateSubject = async (slot) => {
    try {
      setLoading(true);
      const res = await api.post('/subjects', {
        name: slot.subjectName || 'New Subject',
        code: slot.courseCode || '',
        credits: 3,
        semesterId: semesterId
      });
      if (res.data.success) {
        const newSub = res.data.subject;
        setLocalSubjects(prev => [...prev, newSub]);
        
        setPreviewData(prev => prev.map(s => {
          if (!s.subjectId && s.subjectName === slot.subjectName) {
            return { ...s, subjectId: newSub._id };
          }
          return s;
        }));
      }
    } catch (err) {
      setError('Failed to create subject: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/timetable/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        // Map extracted slots to real subject IDs
        const mappedSlots = res.data.slots.map(slot => {
          // Attempt fuzzy match
          const sName = slot.subjectName?.toLowerCase() || '';
          const sCode = slot.courseCode?.toLowerCase() || '';
          
          let matchedSubject = localSubjects.find(s => 
            (s.code && s.code.toLowerCase() === sCode) || 
            (s.name && s.name.toLowerCase().includes(sName)) ||
            (sName && sName.includes(s.name?.toLowerCase()))
          );

          return {
            ...slot,
            _id: Math.random().toString(36).substr(2, 9), // temp id for list
            subjectId: matchedSubject ? matchedSubject._id : ''
          };
        });

        setPreviewData(mappedSlots);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to process PDF timetable. Ensure it contains readable text.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      // Validate that all slots have a subject mapped
      const unmapped = previewData.filter(s => !s.subjectId);
      if (unmapped.length > 0) {
        if (!window.confirm(`There are ${unmapped.length} classes not mapped to any of your subjects. They will be ignored. Continue?`)) {
          return;
        }
      }

      const finalSlots = previewData.filter(s => s.subjectId).map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        subjectId: s.subjectId,
        room: s.room,
        teacherName: s.teacherName
      }));

      setLoading(true);
      await api.post(`/semesters/${semesterId}/timetable/bulk`, { slots: finalSlots });
      onSuccess();
    } catch (err) {
      setError('Failed to save timetable');
      setLoading(false);
    }
  };

  const updatePreviewSlot = (id, field, value) => {
    setPreviewData(previewData.map(s => s._id === id ? { ...s, [field]: value } : s));
  };

  const removePreviewSlot = (id) => {
    setPreviewData(previewData.filter(s => s._id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${previewData ? 'max-w-4xl' : 'max-w-md'} overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {previewData ? 'Review Timetable' : 'Import Timetable PDF'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          
          {!previewData ? (
            <form onSubmit={handleUpload} className="space-y-4">
              <p className="text-sm text-slate-600">
                Upload your college timetable PDF. Synapse AI will read it and automatically build your weekly schedule.
              </p>
              
              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl p-8 text-center">
                <FileText className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 mb-2 cursor-pointer"
                  onChange={e => setFile(e.target.files[0])}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !file} 
                  className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Processing...' : 'Extract Timetable'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-2">
                Here's what Synapse AI found. Please map the extracted classes to your actual subjects.
              </p>

              <div className="border rounded-lg overflow-hidden border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold">Day & Time</th>
                      <th className="p-3 font-semibold">Extracted Subject</th>
                      <th className="p-3 font-semibold">Map to Your Subject <span className="text-red-500">*</span></th>
                      <th className="p-3 font-semibold">Room & Teacher</th>
                      <th className="p-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map(slot => (
                      <tr key={slot._id} className={!slot.subjectId ? 'bg-amber-50/30' : ''}>
                        <td className="p-3 align-top whitespace-nowrap">
                          <select 
                            className="w-24 text-xs border rounded p-1 mb-1 block"
                            value={slot.dayOfWeek}
                            onChange={e => updatePreviewSlot(slot._id, 'dayOfWeek', e.target.value)}
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <div className="flex items-center gap-1 text-xs">
                            <input type="time" value={slot.startTime} onChange={e => updatePreviewSlot(slot._id, 'startTime', e.target.value)} className="border rounded px-1 w-[70px]" />
                            -
                            <input type="time" value={slot.endTime} onChange={e => updatePreviewSlot(slot._id, 'endTime', e.target.value)} className="border rounded px-1 w-[70px]" />
                          </div>
                        </td>
                        <td className="p-3 align-top text-slate-700">
                          <div className="font-medium">{slot.subjectName || 'Unknown'}</div>
                          {slot.courseCode && <div className="text-xs text-slate-500">{slot.courseCode}</div>}
                        </td>
                        <td className="p-3 align-top">
                          <select 
                            className={`w-full text-sm border rounded p-2 ${!slot.subjectId ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`}
                            value={slot.subjectId}
                            onChange={e => updatePreviewSlot(slot._id, 'subjectId', e.target.value)}
                          >
                            <option value="">-- Select Subject --</option>
                            {localSubjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code || ''})</option>)}
                          </select>
                          {!slot.subjectId && (
                            <button 
                              onClick={() => handleCreateSubject(slot)}
                              disabled={loading}
                              className="mt-1 w-full text-xs py-1.5 px-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                            >
                              + Create "{slot.subjectName}"
                            </button>
                          )}
                        </td>
                        <td className="p-3 align-top text-xs space-y-1">
                          <input placeholder="Room" value={slot.room || ''} onChange={e => updatePreviewSlot(slot._id, 'room', e.target.value)} className="border rounded px-2 py-1 w-full" />
                          <input placeholder="Teacher" value={slot.teacherName || ''} onChange={e => updatePreviewSlot(slot._id, 'teacherName', e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </td>
                        <td className="p-3 align-top text-right">
                          <button onClick={() => removePreviewSlot(slot._id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.length === 0 && (
                <div className="text-center py-8 text-slate-500">No classes found or all removed.</div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setPreviewData(null)} 
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={loading || previewData.length === 0} 
                  className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Saving...' : 'Confirm & Save Timetable'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableImportModal;
