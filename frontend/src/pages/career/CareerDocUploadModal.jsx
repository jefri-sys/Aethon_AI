import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle } from 'lucide-react';
import api from '../../services/api.js';

const categoryOptions = [
  { label: 'Certifications', value: 'certification' },
  { label: 'Internships', value: 'internship' },
  { label: 'Projects', value: 'project' },
  { label: 'Research', value: 'research' },
  { label: 'Achievements', value: 'achievement' }
];

export default function CareerDocUploadModal({ onClose, onSuccess, onError }) {
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!category) {
      setError('Please select a category first.');
      return;
    }
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', category);

    try {
      await api.post('/career-vault/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      onSuccess('Document added — review extracted details');
    } catch (err) {
      console.error('Upload failed', err);
      if (onError && err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        onError(err);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to upload document. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Upload Document</h3>
          <button onClick={onClose} disabled={uploading} className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-5">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            >
              <option value="" disabled>Select category...</option>
              {categoryOptions.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Document *</label>
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-gray-50 hover:border-indigo-300 transition-colors group">
              <input
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className={`w-8 h-8 mb-2 ${file ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-400'}`} />
                <span className="text-sm font-medium text-gray-900">
                  {file ? file.name : 'Click or drag file to upload'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Supports .pdf, .jpg, .png, .webp
                </span>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !category}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Uploading
                </>
              ) : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
