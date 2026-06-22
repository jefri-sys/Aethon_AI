import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { BookText, Plus, UploadCloud, X, File, FileType2, Loader2, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function NotebookList() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nbRes, subRes] = await Promise.all([
        api.get('/notebooks'),
        api.get('/subjects')
      ]);
      setNotebooks(nbRes.data.notebooks || []);
      setSubjects(subRes.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    if (subjectId) formData.append('subjectId', subjectId);

    try {
      await api.post('/notebooks/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setShowModal(false);
      setTitle('');
      setFile(null);
      setSubjectId('');
      fetchData();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notebook?')) return;
    try {
      await api.delete(`/notebooks/${id}`);
      setNotebooks(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notebook', err);
    }
  };

  return (
    <ProtectedPage
      title="AI Notebooks"
      description="Upload your study materials to interact with them via AI."
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:max-w-xs bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-500" /> AI Usage</span>
            <span className="text-xs font-medium text-gray-500">
              {((user?.aiTokensUsed || 0) / 1000).toFixed(1)}k / {((user?.aiTokenLimit || 500000) / 1000).toFixed(0)}k tokens
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) > 0.8 ? 'bg-red-500' : 'bg-indigo-500'}`} 
              style={{ width: `${Math.min(100, ((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) * 100)}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Create Notebook
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BookText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Notebooks Found</h3>
          <p className="text-gray-500 mb-6">Upload your first document to start chatting with your notes.</p>
          <button onClick={() => setShowModal(true)} className="text-indigo-600 font-medium hover:text-indigo-700">
            Upload Document &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map(nb => (
            <div 
              key={nb._id} 
              onClick={() => navigate(`/notebook/${nb._id}`)}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${nb.fileType === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {nb.fileType === 'pdf' ? <FileType2 className="w-6 h-6" /> : <File className="w-6 h-6" />}
                </div>
                <button 
                  onClick={(e) => handleDelete(e, nb._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">{nb.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-1 mb-4">
                {subjects.find(s => s._id === nb.subjectId)?.name || 'General Notes'}
              </p>
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400 font-medium">
                <span>{new Date(nb.uploadedAt).toLocaleDateString()}</span>
                <span>{nb.pageCount || 1} Pages</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Upload Notebook</h2>
              <button onClick={() => !uploading && setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notebook Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Physics Chapter 3 Notes"
                    className="w-full border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject (Optional)</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50"
                  >
                    <option value="">General (No Subject)</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Document (PDF or DOCX)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-1 text-center">
                      <UploadCloud className={`mx-auto h-10 w-10 ${file ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-500'} transition-colors`} />
                      <div className="text-sm text-gray-600 font-medium">
                        {file ? <span className="text-indigo-600">{file.name}</span> : <span>Click to upload or drag and drop</span>}
                      </div>
                      <p className="text-xs text-gray-500">PDF or DOCX up to 10MB</p>
                    </div>
                  </div>
                </div>
                
                {uploading && (
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4 overflow-hidden">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    'Upload & Process'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
