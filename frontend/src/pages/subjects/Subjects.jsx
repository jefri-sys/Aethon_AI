import { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth.js';
import SubjectDrawer from '../../components/subjects/SubjectDrawer.jsx';
import { StickyNote, Trash2 } from 'lucide-react';

function Subjects() {
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState([]);
  const [allSemesters, setAllSemesters] = useState([]);
  const [selectedSemId, setSelectedSemId] = useState('current');
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scratchpadNotes, setScratchpadNotes] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [workingSemId, setWorkingSemId] = useState(localStorage.getItem('synapse_working_semester_id') || null);

  const handleSetWorkingSemester = (semId) => {
    if (semId) {
      localStorage.setItem('synapse_working_semester_id', semId);
      setWorkingSemId(semId);
    } else {
      localStorage.removeItem('synapse_working_semester_id');
      setWorkingSemId(null);
    }
    // Also trigger custom event if other tabs are open
    window.dispatchEvent(new Event('working_semester_changed'));
  };

  useEffect(() => {
    const loadNotes = () => {
      const saved = JSON.parse(localStorage.getItem('synapse_notes') || '[]');
      setScratchpadNotes(saved);
    };
    loadNotes();
    window.addEventListener('synapse_notes_updated', loadNotes);
    return () => window.removeEventListener('synapse_notes_updated', loadNotes);
  }, []);

  const deleteNote = (index) => {
    const newNotes = [...scratchpadNotes];
    newNotes.splice(index, 1);
    localStorage.setItem('synapse_notes', JSON.stringify(newNotes));
    setScratchpadNotes(newNotes);
    window.dispatchEvent(new Event('synapse_notes_updated'));
  };

  useEffect(() => {
    const fetchSubjectsAndSemester = async () => {
      try {
        const semRes = await api.get('/semesters');
        let currentSem = null;
        if (semRes.data.success) {
          setAllSemesters(semRes.data.semesters);
          currentSem = semRes.data.semesters.find(s => s.isActive);
          setActiveSemester(currentSem);
        }

        const { data } = await api.get('/subjects');
        if (data.success) {
          setAllSubjects(data.subjects);
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSubjectsAndSemester();
    }
  }, [user]);

  const displayedSubjects = allSubjects.filter(sub => {
    let effectiveSemId = selectedSemId;
    if (effectiveSemId === 'current') {
      if (workingSemId) effectiveSemId = workingSemId;
      else if (activeSemester) effectiveSemId = activeSemester._id;
    }
    
    if (effectiveSemId === 'current') {
      return sub.semester === user?.semester; // fallback
    }
    if (effectiveSemId === 'all') return true;
    return sub.semesterId === effectiveSemId || String(sub.semester) === String(effectiveSemId);
  });

  return (
    <ProtectedPage
      title="Subjects"
      description="Manage your subjects, class files, and notes across semesters."
    >
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Your Subjects
          </h2>
          <div className="flex items-center gap-3">
            {selectedSemId !== 'all' && selectedSemId !== 'current' && selectedSemId !== activeSemester?._id && selectedSemId !== workingSemId && (
              <button
                onClick={() => handleSetWorkingSemester(selectedSemId)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Set as Active Context
              </button>
            )}
            {(workingSemId && (selectedSemId === workingSemId || selectedSemId === 'current')) && (
              <button
                onClick={() => handleSetWorkingSemester(null)}
                className="px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                Clear Context Override
              </button>
            )}
            <select
              value={selectedSemId}
              onChange={(e) => setSelectedSemId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="current">
                {workingSemId ? 'Working Context' : 'Current Semester'} 
                ({workingSemId 
                  ? allSemesters.find(s => s._id === workingSemId)?.semesterNumber 
                  : activeSemester?.semesterNumber || user?.semester || '?'})
              </option>
              {allSemesters.filter(s => s._id !== activeSemester?._id && s._id !== workingSemId).map(sem => (
                <option key={sem._id} value={sem._id}>Semester {sem.semesterNumber}</option>
              ))}
              <option value="all">All Semesters</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-sm text-slate-500">Loading subjects...</div>
        ) : displayedSubjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedSubjects.map((subject) => (
              <div
                key={subject._id}
                onClick={() => { setSelectedSubject(subject); setDrawerOpen(true); }}
                className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-5 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="truncate text-[13px] font-semibold uppercase tracking-wide text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {subject.code} - {subject.name}
                </div>
                <div className="truncate text-xs text-slate-400">
                  {subject.code} - {subject.name}
                </div>
                {subject.professor && (
                  <div className="mt-2 self-start rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {subject.professor}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No subjects found. Add them in the Academics tab.</div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-indigo-500" />
          Quick Scratchpad
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scratchpadNotes.length > 0 ? (
            scratchpadNotes.map((note, index) => (
              <div key={index} className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-4 shadow-sm relative group">
                <button 
                  onClick={() => deleteNote(index)} 
                  className="absolute top-2 right-2 text-yellow-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <p className="text-slate-700 whitespace-pre-wrap text-sm">{note.text}</p>
                <p className="text-[10px] text-yellow-600/60 mt-3 font-medium uppercase tracking-wider">
                  {new Date(note.date).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center bg-slate-50 border border-slate-100 border-dashed rounded-xl">
              <p className="text-sm text-slate-400 font-medium">Your scratchpad is empty. Use QuickCapture from the Smart Sidebar (right edge) to jot something down!</p>
            </div>
          )}
        </div>
      </div>

      <SubjectDrawer 
        subject={selectedSubject} 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />
    </ProtectedPage>
  );
}

export default Subjects;
