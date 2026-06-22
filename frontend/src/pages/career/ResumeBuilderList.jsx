import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { useVault } from './CareerVaultLayout.jsx';
import { Plus, FileText, Trash2, Edit3, Loader2 } from 'lucide-react';

const roleMap = {
  'software_development': 'Software Development',
  'data_analytics': 'Data Analytics',
  'research': 'Research',
  'higher_studies': 'Higher Studies',
  'internships': 'Internships',
  'general_placement': 'General Placement'
};

export default function ResumeBuilderList() {
  const navigate = useNavigate();
  const { setIsLocked } = useVault();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState('software_development');
  const [error, setError] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/career-vault/resumes');
      setResumes(res.data.resumes || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Error fetching resumes', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return setError('Title is required');
    setError('');
    setCreating(true);
    try {
      const res = await api.post('/career-vault/resumes', { title: newTitle, targetRole: newRole });
      setIsModalOpen(false);
      navigate(`/career/resumes/${res.data.resume._id}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        setError(err.response?.data?.message || 'Failed to create resume');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return setError('Please select a file to upload');
    setError('');
    setUploading(true);
    
    try {
      const formData = new FormData();
      // Rename the file if a custom title is provided so the backend uses it as originalname
      const fileToUpload = uploadTitle.trim() 
        ? new File([uploadFile], uploadTitle.trim(), { type: uploadFile.type })
        : uploadFile;
        
      formData.append('document', fileToUpload);
      
      const res = await api.post('/career-vault/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsUploadModalOpen(false);
      navigate(`/career/resumes/${res.data.resume._id}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        setError(err.response?.data?.message || 'Failed to upload resume');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/career-vault/resumes/${id}`);
      setResumes(resumes.filter(r => r._id !== id));
    } catch (err) {
      console.error('Error deleting resume', err);
    }
  };

  return (
    <ProtectedPage title="Resume Builder" description="Generate and edit role-specific resumes.">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          <Link to="/career" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Vault</Link>
          <Link to="/career/timeline" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Timeline</Link>
          <Link to="/career/resume-intelligence" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Resume Intelligence</Link>
          <div className="px-4 py-2 text-sm font-medium rounded-md bg-white text-indigo-600 shadow-sm whitespace-nowrap">Resumes</div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setError(''); setIsUploadModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap"
          >
            Upload Existing
          </button>
          <button
            onClick={() => { setError(''); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No resumes yet</h3>
          <p className="text-gray-500 mb-4">Create your first AI-tailored resume using your Vault data.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Create Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map(resume => (
            <div key={resume._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <button onClick={() => handleDelete(resume._id)} className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{resume.title}</h4>
              <p className="text-sm font-medium text-gray-500 mb-4">
                {resume.origin === 'uploaded' ? 'Uploaded Resume' : (roleMap[resume.targetRole] || resume.targetRole || 'General')}
              </p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Generated: {resume.lastGeneratedAt ? new Date(resume.lastGeneratedAt).toLocaleDateString() : 'Draft'}
                </span>
                <Link to={`/career/resumes/${resume._id}`} className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700">
                  <Edit3 className="w-4 h-4" /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Resume</h3>
            <p className="text-sm text-gray-500 mb-6">AI will extract and organize your Vault data based on the chosen role.</p>
            
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resume Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. SWE Summer Internship"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(roleMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button disabled={creating} type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Generating...' : 'Create & Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Existing Resume</h3>
            <p className="text-sm text-gray-500 mb-6">Upload a PDF, Word document, or image to parse your resume content.</p>
            
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resume Title (Optional)</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="Defaults to filename"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select File</label>
                <input
                  type="file"
                  onChange={e => {
                    setUploadFile(e.target.files[0]);
                    if (!uploadTitle && e.target.files[0]) {
                      setUploadTitle(e.target.files[0].name);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  required
                />
              </div>
              
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" disabled={uploading}>
                  Cancel
                </button>
                <button disabled={uploading || !uploadFile} type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? 'Parsing resume...' : 'Upload & Parse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
