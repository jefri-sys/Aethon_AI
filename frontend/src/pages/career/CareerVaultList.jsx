import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { Plus, FileText, AlertCircle, Award, Briefcase, FolderGit2, FlaskConical, Trophy } from 'lucide-react';
import CareerDocUploadModal from './CareerDocUploadModal.jsx';
import { useVault } from './CareerVaultLayout.jsx';

const categories = ['All', 'Certifications', 'Internships', 'Projects', 'Research', 'Achievements'];

const categoryMap = {
  'All': 'All',
  'Certifications': 'certification',
  'Internships': 'internship',
  'Projects': 'project',
  'Research': 'research',
  'Achievements': 'achievement'
};

const getCategoryLabel = (val) => {
  const map = {
    'certification': 'Certifications',
    'internship': 'Internships',
    'project': 'Projects',
    'research': 'Research',
    'achievement': 'Achievements'
  };
  return map[val] || val;
};

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'certification': return <Award className="w-5 h-5 text-blue-500" />;
    case 'internship': return <Briefcase className="w-5 h-5 text-indigo-500" />;
    case 'project': return <FolderGit2 className="w-5 h-5 text-emerald-500" />;
    case 'research': return <FlaskConical className="w-5 h-5 text-purple-500" />;
    case 'achievement': return <Trophy className="w-5 h-5 text-amber-500" />;
    default: return <FileText className="w-5 h-5 text-gray-500" />;
  }
};

export default function CareerVaultList() {
  const [activeTab, setActiveTab] = useState('All');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();
  const { setIsLocked } = useVault();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = activeTab === 'All' ? {} : { category: categoryMap[activeTab] };
      const res = await api.get('/career-vault', { params });
      setDocuments(res.data.documents || res.data || []);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Error fetching documents', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <ProtectedPage
      title="Career Vault"
      description="Manage your professional documents, certifications, and portfolio items."
    >
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          <div className="px-4 py-2 text-sm font-medium rounded-md bg-white text-indigo-600 shadow-sm whitespace-nowrap">Vault</div>
          <Link to="/career/timeline" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Timeline</Link>
          <Link to="/career/resume-intelligence" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Resume Intelligence</Link>
          <Link to="/career/resumes" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Resumes</Link>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No documents found</h3>
          <p className="text-gray-500 mb-4">You haven't uploaded any {activeTab !== 'All' ? activeTab.toLowerCase() : 'documents'} yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Upload your first document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <div 
              key={doc._id} 
              onClick={() => navigate(`/career/${doc._id}`)}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                  {getCategoryIcon(doc.category)}
                </div>
                {(doc.extractionStatus === 'partial' || doc.extractionStatus === 'failed') && (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium border border-amber-100" title={`Extraction ${doc.extractionStatus}`}>
                    <AlertCircle className="w-3 h-3" />
                    Review needed
                  </div>
                )}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{doc.title || 'Untitled Document'}</h4>
              <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-1">{doc.issuer || 'Unknown Issuer'}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {getCategoryLabel(doc.category)}
                </span>
                <span className="text-xs text-gray-400">
                  {doc.dateEarned ? new Date(doc.dateEarned).toLocaleDateString() : 'No date'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <CareerDocUploadModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(msg) => {
            setIsModalOpen(false);
            if (msg) showToast(msg);
            fetchDocuments();
          }}
          onError={(err) => {
            if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
              setIsLocked(true);
              setIsModalOpen(false);
            }
          }}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </ProtectedPage>
  );
}
