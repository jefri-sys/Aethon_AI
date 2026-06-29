import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, AlertCircle, Trash2, Plus, UploadCloud } from 'lucide-react';
import api from '../../../services/api';
import ExamImportModal from '../../../pages/academics/ExamImportModal.jsx';

export default function MobileExamSchedule({ activeSemesterId, onBack }) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExam, setNewExam] = useState({
    subjectId: '', date: '', startTime: '09:00', examType: 'endSemester', venue: ''
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [res, subRes] = await Promise.all([
        api.get(`/semesters/${activeSemesterId}/exams`),
        api.get('/subjects')
      ]);
      if (res.data.success) {
        setExams(res.data.exams);
      }
      if (subRes.data.success) {
        setSubjects(subRes.data.subjects.filter(s => s.semesterId === activeSemesterId));
      }
    } catch (err) {
      console.error('Failed to fetch exams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSemesterId) {
      setLoading(false);
      return;
    }
    fetchExams();
  }, [activeSemesterId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(exams.filter(e => e._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/semesters/${activeSemesterId}/exams`, newExam);
      if (res.data.success) {
        setExams([...exams, res.data.exam]);
        setShowAddForm(false);
        setNewExam({ ...newExam, subjectId: '', date: '', venue: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add exam');
    }
  };

  const formatExamType = (type) => {
    if (type === 'internal1') return 'Internal 1';
    if (type === 'internal2') return 'Internal 2';
    if (type === 'endSemester') return 'End Semester';
    return type;
  };

  return (
    <div className="mobile-shell" style={{ minHeight: '100dvh', background: 'var(--mobile-bg)', overflowY: 'auto', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', position: 'sticky', top: 0, background: 'var(--mobile-bg)', zIndex: 10 }}>
        <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, marginRight: '40px' }}>Exam Schedule</h1>
      </div>

      <div style={{ padding: '0 20px 80px 20px' }}>
        {!activeSemesterId ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--mobile-surface)', borderRadius: '24px' }}>
            <AlertCircle color="var(--mobile-warning)" size={32} style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>No Semester Selected</h3>
            <p style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)', marginTop: '8px' }}>Please select a specific semester from the overview to view its exam schedule.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mobile-text-secondary)' }}>Loading exams...</div>
        ) : exams.length === 0 && !showAddForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowImportModal(true)} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)', border: '1px solid var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <UploadCloud size={18} /> Import PDF
              </button>
              <button onClick={() => setShowAddForm(true)} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: 'var(--mobile-primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Plus size={18} /> Add Exam
              </button>
            </div>
            
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--mobile-surface)', borderRadius: '24px' }}>
              <Calendar color="var(--mobile-text-tertiary)" size={48} style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>No Exams Scheduled</h3>
              <p style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)', marginTop: '8px' }}>You haven't added any exams for this semester yet.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowImportModal(true)} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)', border: '1px solid var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <UploadCloud size={18} /> Import PDF
              </button>
              <button onClick={() => setShowAddForm(!showAddForm)} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: 'var(--mobile-primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Plus size={18} /> Add Exam
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddExam} style={{ background: 'var(--mobile-surface)', padding: '16px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--mobile-shadow-card)' }}>
                <select required style={{ padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newExam.subjectId} onChange={e => setNewExam({...newExam, subjectId: e.target.value})}>
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code || ''})</option>)}
                </select>
                <select style={{ padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newExam.examType} onChange={e => setNewExam({...newExam, examType: e.target.value})}>
                  <option value="internal1">Internal 1</option>
                  <option value="internal2">Internal 2</option>
                  <option value="endSemester">End Semester</option>
                </select>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input type="date" required style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} />
                  <input type="time" required style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newExam.startTime} onChange={e => setNewExam({...newExam, startTime: e.target.value})} />
                </div>
                <input placeholder="Venue" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newExam.venue} onChange={e => setNewExam({...newExam, venue: e.target.value})} />
                <button type="submit" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mobile-primary)', color: '#fff', border: 'none', fontWeight: 600 }}>Save Exam</button>
              </form>
            )}

            {exams.map(exam => {
              const dateObj = new Date(exam.date);
              const isEndSem = exam.examType === 'endSemester';
              
              return (
                <div key={exam._id} style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)', position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${isEndSem ? 'var(--mobile-danger)' : 'var(--mobile-primary)'}` }}>
                  <button onClick={() => handleDelete(exam._id)} style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px', border: 'none', background: 'var(--mobile-bg)', borderRadius: '50%', color: 'var(--mobile-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                  
                  <div style={{ display: 'inline-block', background: isEndSem ? 'var(--mobile-danger-subtle)' : 'var(--mobile-primary-subtle)', color: isEndSem ? 'var(--mobile-danger)' : 'var(--mobile-primary)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                    {formatExamType(exam.examType)}
                  </div>
                  
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '4px', paddingRight: '40px' }}>{exam.subjectId?.name || 'Unknown Subject'}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--mobile-text-tertiary)', marginBottom: '16px' }}>{exam.subjectId?.code || '—'}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--mobile-text-secondary)', fontWeight: 500 }}>
                      <Calendar size={16} color="var(--mobile-text-tertiary)" />
                      {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--mobile-text-secondary)', fontWeight: 500 }}>
                      <Clock size={16} color="var(--mobile-text-tertiary)" />
                      {exam.startTime}
                    </div>
                    {exam.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--mobile-text-secondary)', fontWeight: 500 }}>
                        <MapPin size={16} color="var(--mobile-text-tertiary)" />
                        {exam.venue}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showImportModal && (
        <ExamImportModal 
          semesterId={activeSemesterId} 
          subjects={subjects}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchExams();
          }}
        />
      )}
    </div>
  );
}
