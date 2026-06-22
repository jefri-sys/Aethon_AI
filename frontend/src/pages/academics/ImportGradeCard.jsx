import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { CheckCircle, X, FileText, UploadCloud, AlertCircle, Trash2, Plus, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export default function ImportGradeCard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugText, setDebugText] = useState('');
  
  const [previewData, setPreviewData] = useState(null);
  const [previewSubjects, setPreviewSubjects] = useState([]);
  
  const [importStats, setImportStats] = useState({ created: 0 });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
      setDebugText('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDropRejected: () => {
      setError('Invalid file. Please upload a PDF file under 10MB.');
    }
  });

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/subjects/import-grade-card', formData);
      
      setPreviewData(res.data.preview);
      setPreviewSubjects(res.data.preview.subjects);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract subjects. Please try again.');
      if (err.response?.data?.debug_text) {
        setDebugText(err.response.data.debug_text);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...previewSubjects];
    updated[index] = { ...updated[index], [field]: field === 'credits' ? Number(value) : value };
    setPreviewSubjects(updated);
  };

  const handleRemoveSubject = (index) => {
    const updated = [...previewSubjects];
    updated.splice(index, 1);
    setPreviewSubjects(updated);
  };

  const handleAddRow = () => {
    setPreviewSubjects([...previewSubjects, { code: '', name: '', credits: 3, grade: 'B' }]);
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const res = await api.post('/subjects/confirm-import', {
        subjects: previewSubjects,
        semester: selectedSemester
      });
      setImportStats({ created: res.data.created });
      setStep(3);
    } catch (err) {
      alert('Failed to import subjects: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewData(null);
    setPreviewSubjects([]);
    setError('');
    setStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <button 
        onClick={() => step === 1 ? navigate('/academics') : step === 2 ? setStep(1) : navigate('/academics')}
        className="flex items-center text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {step === 3 ? 'Back to Academics' : 'Back'}
      </button>

      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Import from Grade Card</h1>
            <p className="text-slate-500 mt-2">Select the semester and upload your grade card PDF.</p>
          </div>

          <div className="max-w-xs mx-auto text-left space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Target Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white px-4 py-2.5 border outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>Semester {n}</option>
              ))}
            </select>
          </div>

          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="w-10 h-10 text-indigo-400" />
              {isDragActive ? (
                <p className="text-indigo-600 font-medium">Drop the PDF here...</p>
              ) : (
                <>
                  <p className="text-slate-700 font-medium">Drag & drop your PDF here, or click to select</p>
                  <p className="text-slate-400 text-sm">Supports PDF files up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {debugText && (
            <div className="mt-4 text-left border border-slate-200 rounded-md p-4 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Raw Text Extracted from PDF:</p>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto font-mono bg-white p-2 border border-slate-200 rounded">
                {debugText}
              </pre>
              <p className="text-xs text-indigo-500 mt-2">Please copy the text above and share it with the AI so it can fix the parsing logic!</p>
            </div>
          )}

          {file && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="text-indigo-900 font-medium">{file.name}</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-indigo-400 hover:text-indigo-600 text-sm font-medium">
                Remove
              </button>
            </div>
          )}

          <div className="pt-4">
            <button 
              disabled={!file || loading}
              onClick={handleExtract}
              className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-colors ${!file || loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'Reading your grade card...' : 'Extract Subjects'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && previewData && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-4 text-emerald-800">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="font-semibold text-lg">Found {previewData.count} subjects</h2>
              <p className="text-emerald-600 text-sm mt-0.5">Importing into Semester {selectedSemester} &middot; SGPA {previewData.sgpa || 'Unknown'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-medium text-slate-700">Review & Edit Subjects</h3>
              <button onClick={handleAddRow} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 w-32">Course Code</th>
                    <th className="px-4 py-3">Subject Name</th>
                    <th className="px-4 py-3 w-24">Credits</th>
                    <th className="px-4 py-3 w-24">Grade</th>
                    <th className="px-4 py-3 w-16 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewSubjects.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2">
                        <input value={s.code} onChange={(e) => handleSubjectChange(i, 'code', e.target.value)} className="w-full border-slate-200 rounded px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none border" placeholder="Code" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={s.name} onChange={(e) => handleSubjectChange(i, 'name', e.target.value)} className="w-full border-slate-200 rounded px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none border" placeholder="Subject Name" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={s.credits} onChange={(e) => handleSubjectChange(i, 'credits', e.target.value)} className="w-full border-slate-200 rounded px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none border" min="0" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={s.grade} onChange={(e) => handleSubjectChange(i, 'grade', e.target.value)} className="w-full border-slate-200 rounded px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none border bg-white">
                          {['O', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'W', 'I', 'R'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => handleRemoveSubject(i)} className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {previewSubjects.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No subjects found. Click "Add Row" to enter manually.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
              Note: Exam dates are not included in grade cards. You can add them from the Academics page after import.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={previewSubjects.length === 0 || loading}
              onClick={handleConfirmImport}
              className={`px-8 py-2.5 rounded-lg font-semibold text-white transition-colors ${previewSubjects.length === 0 || loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'Saving subjects...' : `Import ${previewSubjects.length} Subjects`}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center space-y-6 max-w-lg mx-auto mt-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{importStats.created} subjects imported successfully!</h2>
            <p className="text-slate-500 mt-2">
              Marks have been recorded based on your grades. Your CGPA will update automatically.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-6">
            <button 
              onClick={() => navigate('/academics')}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Go to Academics
            </button>
            <button 
              onClick={resetAll}
              className="w-full px-6 py-3 rounded-lg font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Import Another Semester
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
