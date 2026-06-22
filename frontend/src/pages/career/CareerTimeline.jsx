import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { useVault } from './CareerVaultLayout.jsx';
import { Award, Briefcase, FolderGit2, FlaskConical, Trophy, GraduationCap, ChevronRight } from 'lucide-react';

const getCategoryIcon = (cat, type) => {
  if (type === 'academic') return <GraduationCap className="w-5 h-5 text-indigo-500" />;
  switch (cat) {
    case 'certification': return <Award className="w-5 h-5 text-blue-500" />;
    case 'internship': return <Briefcase className="w-5 h-5 text-indigo-500" />;
    case 'project': return <FolderGit2 className="w-5 h-5 text-emerald-500" />;
    case 'research': return <FlaskConical className="w-5 h-5 text-purple-500" />;
    case 'achievement': return <Trophy className="w-5 h-5 text-amber-500" />;
    default: return <Award className="w-5 h-5 text-gray-500" />;
  }
};

export default function CareerTimeline() {
  const navigate = useNavigate();
  const { setIsLocked } = useVault();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (yearFilter) params.year = yearFilter;
      const res = await api.get('/career-vault/timeline', { params });
      setTimeline(res.data.timeline || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Error fetching timeline', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [categoryFilter, yearFilter]);

  return (
    <ProtectedPage title="Career Timeline" description="A chronological view of your academic and professional milestones.">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
          <Link to="/career" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Vault</Link>
          <div className="px-4 py-2 text-sm font-medium rounded-md bg-white text-indigo-600 shadow-sm whitespace-nowrap">Timeline</div>
          <Link to="/career/resume-intelligence" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Resume Intelligence</Link>
          <Link to="/career/resumes" className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">Resumes</Link>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="flex-1 sm:w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="academic">Academic</option>
            <option value="certification">Certifications</option>
            <option value="internship">Internships</option>
            <option value="project">Projects</option>
            <option value="research">Research</option>
            <option value="achievement">Achievements</option>
          </select>
          <select 
            value={yearFilter} 
            onChange={e => setYearFilter(e.target.value)}
            className="flex-1 sm:w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Years</option>
            {[...Array(10)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : timeline.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-1">No milestones found</h3>
          <p className="text-gray-500 mb-4">You don't have any timeline events yet.</p>
          <Link to="/career" className="text-indigo-600 font-medium hover:text-indigo-700">Upload to your Vault</Link>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-6 space-y-8 pb-8 mt-8">
          {timeline.map((item, idx) => (
            <div key={`${item.sourceId}-${idx}`} className="relative pl-6 md:pl-8 group">
              <div className="absolute -left-[13px] top-1.5 w-6 h-6 rounded-full bg-white border-4 border-indigo-100 flex items-center justify-center group-hover:border-indigo-400 transition-colors z-10" />
              
              <div 
                onClick={() => {
                  if (item.type === 'career') navigate(`/career/${item.sourceId}`);
                }}
                className={`bg-white border border-gray-100 rounded-xl p-5 shadow-sm transition-all ${item.type === 'career' ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {getCategoryIcon(item.category, item.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{item.title}</h4>
                      <p className="text-xs font-medium text-gray-500 capitalize">{item.type === 'academic' ? 'Academic Milestone' : item.category}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-md self-start sm:self-auto">
                    {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  {item.type === 'academic' && (
                    <p>Academic Year: <span className="font-medium text-gray-900">{item.details?.academicYear}</span> • Status: <span className="font-medium text-gray-900">{item.details?.isCompleted ? 'Completed' : 'Active'}</span></p>
                  )}
                  {item.type === 'career' && item.details?.issuer && (
                    <p>Issued by: <span className="font-medium text-gray-900">{item.details.issuer}</span></p>
                  )}
                  {item.type === 'career' && item.details?.skillsTags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.details.skillsTags.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {item.type === 'career' && (
                  <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    View Details <ChevronRight size={14} className="ml-0.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ProtectedPage>
  );
}
