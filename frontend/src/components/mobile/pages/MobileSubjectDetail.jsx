import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Plus } from 'lucide-react';
import api from '../../../services/api';
import AddSubjectSheet from '../AddSubjectSheet.jsx';
import AddMarkSheet from '../AddMarkSheet.jsx';

export default function MobileSubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [cgpaInfo, setCgpaInfo] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showAddMark, setShowAddMark] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, markRes, attRes, cgpaRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/marks'),
        api.get('/attendance'),
        api.get('/academics/cgpa')
      ]);
      
      const sub = subRes.data.subjects.find(s => s._id === id);
      setSubject(sub);
      
      if (sub) {
        setMarks(markRes.data.marks.filter(m => m.subjectId === id));
        setAttendance(attRes.data.attendance.find(a => a.subjectId === id || a.subjectId?._id === id));
        setCgpaInfo(cgpaRes.data?.subjects?.find(s => s.name === sub.name));
      }
    } catch (err) {
      console.error('Failed to fetch subject details', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await api.delete(`/subjects/${id}`);
        navigate(-1);
      } catch (err) {
        console.error('Failed to delete subject', err);
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--mobile-text-secondary)', textAlign: 'center' }}>Loading...</div>;
  }

  if (!subject) {
    return <div style={{ padding: '20px', color: 'var(--mobile-text-secondary)', textAlign: 'center' }}>Subject not found</div>;
  }

  const attPercent = attendance && attendance.totalClasses > 0 
    ? ((attendance.attendedClasses / attendance.totalClasses) * 100).toFixed(1) 
    : 0;

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      position: 'relative'
    }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: '0 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subject.name}
        </h1>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <MoreVertical color="var(--mobile-text-primary)" size={20} />
          </button>
          
          {/* Action Menu */}
          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
              <div style={{ position: 'absolute', top: '48px', right: 0, background: 'var(--mobile-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, width: '120px', overflow: 'hidden' }}>
                <div onClick={() => { setShowMenu(false); setShowEditSheet(true); }} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: 'var(--mobile-text-primary)', borderBottom: '1px solid var(--mobile-border)', cursor: 'pointer' }}>
                  Edit
                </div>
                <div onClick={handleDelete} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: 'var(--mobile-danger)', cursor: 'pointer' }}>
                  Delete
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SUBJECT META CARD */}
      <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>Code</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{subject.code || '—'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>Credits</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{subject.credits || 0}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>Professor</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{subject.professor || '—'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>Type</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{subject.type || 'Core'}</span>
          </div>
        </div>
      </div>

      {/* ANALYTICS ROW */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginBottom: '8px' }}>Grade</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--mobile-primary)' }}>{cgpaInfo?.grade || 'N/A'}</span>
        </div>
        <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginBottom: '8px' }}>Attendance</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: attPercent < 75 ? 'var(--mobile-warning)' : 'var(--mobile-success)' }}>{attPercent}%</span>
          <div style={{ width: '100%', height: '4px', background: 'var(--mobile-border)', borderRadius: '999px', marginTop: '8px' }}>
            <div style={{ height: '100%', borderRadius: '999px', width: `${Math.min(100, attPercent)}%`, background: attPercent < 75 ? 'var(--mobile-warning)' : 'var(--mobile-success)' }} />
          </div>
        </div>
      </div>

      {/* MARKS TABLE */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '12px' }}>Marks & Assessments</h3>
      <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)' }}>
        {marks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', fontSize: '14px', padding: '16px 0' }}>No marks added yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {marks.map((m, idx) => (
              <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx < marks.length - 1 ? '1px solid var(--mobile-border)' : 'none' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{m.assessmentType}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mobile-text-secondary)' }}>
                  {m.grade ? m.grade : `${m.marksObtained} / ${m.totalMarks}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setShowAddMark(true)}
        style={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))', right: '24px', width: '56px', height: '56px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 8px 24px rgba(255,122,89,0.4)', zIndex: 50 }}
      >
        <Plus size={24} color="#fff" />
      </button>

      {showEditSheet && (
        <AddSubjectSheet 
          initialData={subject}
          onClose={() => setShowEditSheet(false)}
          onSuccess={() => {
            setShowEditSheet(false);
            fetchData();
          }}
        />
      )}

      {showAddMark && (
        <AddMarkSheet 
          subjectId={id}
          onClose={() => setShowAddMark(false)}
          onSuccess={() => {
            setShowAddMark(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
