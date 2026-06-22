import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, GraduationCap, Clock, Award, TrendingUp, Star, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import AddSemesterModal from './AddSemesterModal.jsx';

const SemesterList = ({ onSelectSemester }) => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cgpaData, setCgpaData] = useState(null);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/semesters');
      if (res.data.success) {
        setSemesters(res.data.semesters);
      }
      
      const cgpaRes = await api.get('/academics/cgpa');
      if (cgpaRes.data.success) {
        setCgpaData(cgpaRes.data);
      }
    } catch (err) {
      console.error('Failed to load semesters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleMarkComplete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Mark this semester as complete? This will archive recurring classes.')) return;
    try {
      await api.patch(`/semesters/${id}/complete`);
      fetchSemesters();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-slate-100 rounded-xl"></div>
      <div className="h-48 bg-slate-100 rounded-xl"></div>
    </div>;
  }

  const renderAnalytics = () => {
    if (!cgpaData) return null;

    // Trend chart data
    const trendData = (cgpaData.semesters || [])
      .filter(s => s.sgpa > 0)
      .map(s => ({
        name: `Sem ${s.semester}`,
        sgpa: parseFloat(s.sgpa.toFixed(2))
      }));

    // Best and Worst subjects
    const validSubjects = (cgpaData.subjects || []).filter(s => s.grade && s.grade !== 'N/A');
    
    // Sort for best (highest grade points)
    const sortedDesc = [...validSubjects].sort((a, b) => b.gradePoints - a.gradePoints);
    const bestSubject = sortedDesc.length > 0 ? sortedDesc[0] : null;
    
    // Sort for worst (lowest grade points, including F/0 points)
    const sortedAsc = [...validSubjects].sort((a, b) => a.gradePoints - b.gradePoints);
    const worstSubject = sortedAsc.length > 0 ? sortedAsc[0] : null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">CGPA Trend</h3>
          </div>
          <div className="h-48 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 10]} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="sgpa" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Not enough data for trend line
              </div>
            )}
          </div>
        </div>

        {/* Top/Bottom Performers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 mb-1">Performance Highlights</h3>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-0.5">Best Subject</p>
                {bestSubject ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{bestSubject.name}</p>
                    <p className="text-xs text-emerald-700 mt-1 font-medium">Grade: {bestSubject.grade} ({bestSubject.gradePoints} pt)</p>
                  </>
                ) : <p className="text-sm text-slate-500">No data</p>}
              </div>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-0.5">Needs Attention</p>
                {worstSubject ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{worstSubject.name}</p>
                    <p className="text-xs text-rose-700 mt-1 font-medium">Grade: {worstSubject.grade} ({worstSubject.gradePoints} pt)</p>
                  </>
                ) : <p className="text-sm text-slate-500">No data</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Academic History Overview */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Academic History</h2>
          <p className="text-indigo-100 text-sm">Overview across all semesters</p>
        </div>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">Overall CGPA</p>
            <p className="text-3xl font-bold">{cgpaData?.cgpa ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Credits</p>
            <p className="text-3xl font-bold">{cgpaData?.totalCredits ?? 0}</p>
          </div>
        </div>
      </div>

      {renderAnalytics()}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Your Semesters</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Semester
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semesters.map(sem => (
          <div 
            key={sem._id} 
            onClick={() => onSelectSemester(sem._id)}
            className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md relative overflow-hidden group
              ${sem.isActive ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}
          >
            {sem.isActive && (
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                Current
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${sem.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {sem.isCompleted ? <Award className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">Semester {sem.semesterNumber}</h4>
                  <p className="text-xs text-slate-500 font-medium">{sem.academicYear}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Status</p>
                <p className={`text-sm font-semibold ${sem.isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {sem.isCompleted ? 'Completed' : 'In Progress'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">SGPA</p>
                <p className="text-sm font-semibold text-slate-800">
                  {cgpaData?.semesters?.find(s => s.semester === sem.semesterNumber)?.sgpa ?? '--'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button 
                className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1"
              >
                Open Workspace &rarr;
              </button>
              
              {!sem.isCompleted && (
                <button 
                  onClick={(e) => handleMarkComplete(e, sem._id)}
                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors tooltip-wrapper relative"
                  title="Mark as completed"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {semesters.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-700 font-semibold mb-1">No Semesters Found</h3>
            <p className="text-sm text-slate-500 mb-4">Add your first semester to start tracking subjects.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Semester
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddSemesterModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchSemesters();
          }}
        />
      )}
    </div>
  );
};

export default SemesterList;
