import React, { useState } from 'react';
import { UploadCloud, X, FileText } from 'lucide-react';
import api from '../../services/api';

const ExamImportModal = ({ semesterId, subjects, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [localSubjects, setLocalSubjects] = useState(subjects);

  const handleCreateSubject = async (exam) => {
    try {
      setLoading(true);
      const res = await api.post('/subjects', {
        name: exam.subjectName || 'New Subject',
        code: exam.courseCode || '',
        credits: 3,
        semesterId: semesterId
      });
      if (res.data.success) {
        const newSub = res.data.subject;
        setLocalSubjects(prev => [...prev, newSub]);
        
        setPreviewData(prev => prev.map(e => {
          if (!e.subjectId && e.subjectName === exam.subjectName) {
            return { ...e, subjectId: newSub._id };
          }
          return e;
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
      const res = await api.post('/exams/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        // Map extracted exams to real subject IDs
        const mappedExams = res.data.exams.map(exam => {
          const sName = exam.subjectName?.toLowerCase() || '';
          const sCode = exam.courseCode?.toLowerCase() || '';
          
          let matchedSubject = localSubjects.find(s => 
            (s.code && s.code.toLowerCase() === sCode) || 
            (s.name && s.name.toLowerCase().includes(sName)) ||
            (sName && sName.includes(s.name?.toLowerCase()))
          );

          // default to internal1 if ai returned something weird
          let type = exam.examType;
          if (!['internal1', 'internal2', 'endSemester'].includes(type)) {
            type = 'internal1';
          }

          return {
            ...exam,
            examType: type,
            _id: Math.random().toString(36).substr(2, 9),
            subjectId: matchedSubject ? matchedSubject._id : ''
          };
        });

        setPreviewData(mappedExams);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to process PDF. Ensure it contains readable text.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const unmapped = previewData.filter(e => !e.subjectId);
      if (unmapped.length > 0) {
        if (!window.confirm(`There are ${unmapped.length} exams not mapped to any subjects. They will be ignored. Continue?`)) {
          return;
        }
      }

      const finalExams = previewData.filter(e => e.subjectId).map(e => ({
        subjectId: e.subjectId,
        examType: e.examType,
        date: e.date,
        startTime: e.startTime,
        venue: e.venue
      }));

      setLoading(true);
      await api.post(`/semesters/${semesterId}/exams/bulk`, { exams: finalExams });
      onSuccess();
    } catch (err) {
      setError('Failed to save exams');
      setLoading(false);
    }
  };

  const updatePreviewExam = (id, field, value) => {
    setPreviewData(previewData.map(e => e._id === id ? { ...e, [field]: value } : e));
  };

  const removePreviewExam = (id) => {
    setPreviewData(previewData.filter(e => e._id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${previewData ? 'max-w-4xl' : 'max-w-md'} overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {previewData ? 'Review Exam Schedule' : 'Import Exam PDF'}
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
                Upload your college exam schedule PDF. Synapse AI will extract the dates, times, and venues automatically.
              </p>
              
              <div className="border-2 border-dashed border-rose-200 bg-rose-50/50 rounded-xl p-8 text-center">
                <FileText className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 mb-2 cursor-pointer"
                  onChange={e => setFile(e.target.files[0])}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !file} 
                  className="px-4 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Processing...' : 'Extract Exams'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-2">
                Here's what Synapse AI found. Please map the extracted exams to your actual subjects.
              </p>

              <div className="border rounded-lg overflow-hidden border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold">Date & Time</th>
                      <th className="p-3 font-semibold">Extracted Info</th>
                      <th className="p-3 font-semibold">Map to Your Subject <span className="text-red-500">*</span></th>
                      <th className="p-3 font-semibold">Type & Venue</th>
                      <th className="p-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map(exam => (
                      <tr key={exam._id} className={!exam.subjectId ? 'bg-amber-50/30' : ''}>
                        <td className="p-3 align-top whitespace-nowrap">
                          <input type="date" value={exam.date || ''} onChange={e => updatePreviewExam(exam._id, 'date', e.target.value)} className="w-full text-xs border rounded p-1 mb-1 block" />
                          <input type="time" value={exam.startTime || ''} onChange={e => updatePreviewExam(exam._id, 'startTime', e.target.value)} className="border rounded px-1 text-xs w-full" />
                        </td>
                        <td className="p-3 align-top text-slate-700">
                          <div className="font-medium">{exam.subjectName || 'Unknown'}</div>
                          {exam.courseCode && <div className="text-xs text-slate-500">{exam.courseCode}</div>}
                        </td>
                        <td className="p-3 align-top">
                          <select 
                            className={`w-full text-sm border rounded p-2 ${!exam.subjectId ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`}
                            value={exam.subjectId}
                            onChange={e => updatePreviewExam(exam._id, 'subjectId', e.target.value)}
                          >
                            <option value="">-- Select Subject --</option>
                            {localSubjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code || ''})</option>)}
                          </select>
                          {!exam.subjectId && (
                            <button 
                              onClick={() => handleCreateSubject(exam)}
                              disabled={loading}
                              className="mt-1 w-full text-xs py-1.5 px-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                            >
                              + Create "{exam.subjectName}"
                            </button>
                          )}
                        </td>
                        <td className="p-3 align-top text-xs space-y-1">
                          <select 
                            className="border rounded px-2 py-1 w-full"
                            value={exam.examType}
                            onChange={e => updatePreviewExam(exam._id, 'examType', e.target.value)}
                          >
                            <option value="internal1">Internal 1</option>
                            <option value="internal2">Internal 2</option>
                            <option value="endSemester">End Semester</option>
                          </select>
                          <input placeholder="Venue" value={exam.venue || ''} onChange={e => updatePreviewExam(exam._id, 'venue', e.target.value)} className="border rounded px-2 py-1 w-full" />
                        </td>
                        <td className="p-3 align-top text-right">
                          <button onClick={() => removePreviewExam(exam._id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.length === 0 && (
                <div className="text-center py-8 text-slate-500">No exams found or all removed.</div>
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
                  className="px-4 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Saving...' : 'Confirm & Save Exams'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamImportModal;
