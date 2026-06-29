import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, AlertCircle, Trash2, Plus, UploadCloud } from 'lucide-react';
import api from '../../../services/api';
import TimetableImportModal from '../../../pages/academics/TimetableImportModal.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MobileTimetable({ activeSemesterId, onBack }) {
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    subjectId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '', teacherName: ''
  });

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const [res, subRes] = await Promise.all([
        api.get(`/semesters/${activeSemesterId}/timetable`),
        api.get('/subjects')
      ]);
      if (res.data.success) {
        setSlots(res.data.slots);
      }
      if (subRes.data.success) {
        setSubjects(subRes.data.subjects.filter(s => s.semesterId === activeSemesterId));
      }
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSemesterId) {
      setLoading(false);
      return;
    }
    fetchTimetable();
  }, [activeSemesterId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class slot?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      setSlots(slots.filter(s => s._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/semesters/${activeSemesterId}/timetable`, newSlot);
      if (res.data.success) {
        setSlots([...slots, res.data.slot]);
        setShowAddForm(false);
        setNewSlot({ ...newSlot, startTime: '09:00', endTime: '10:00', room: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add slot');
    }
  };

  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  return (
    <div className="mobile-shell" style={{ minHeight: '100dvh', background: 'var(--mobile-bg)', overflowY: 'auto', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', position: 'sticky', top: 0, background: 'var(--mobile-bg)', zIndex: 10 }}>
        <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, marginRight: '40px' }}>Timetable</h1>
      </div>

      <div style={{ padding: '0 20px 80px 20px' }}>
        {!activeSemesterId ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--mobile-surface)', borderRadius: '24px' }}>
            <AlertCircle color="var(--mobile-warning)" size={32} style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>No Semester Selected</h3>
            <p style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)', marginTop: '8px' }}>Please select a specific semester from the overview to view its timetable.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mobile-text-secondary)' }}>Loading timetable...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowImportModal(true)} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)', border: '1px solid var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <UploadCloud size={18} /> Import PDF
              </button>
              <button onClick={() => setShowAddForm(!showAddForm)} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: 'var(--mobile-primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Plus size={18} /> Add Class
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddSlot} style={{ background: 'var(--mobile-surface)', padding: '16px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--mobile-shadow-card)' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newSlot.dayOfWeek} onChange={e => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input type="time" required style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newSlot.startTime} onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })} />
                  <span style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)' }}>to</span>
                  <input type="time" required style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newSlot.endTime} onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })} />
                </div>
                <select required style={{ padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newSlot.subjectId} onChange={e => setNewSlot({ ...newSlot, subjectId: e.target.value })}>
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code || ''})</option>)}
                </select>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input placeholder="Room" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newSlot.room} onChange={e => setNewSlot({ ...newSlot, room: e.target.value })} />
                  <input placeholder="Teacher" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)' }} value={newSlot.teacherName} onChange={e => setNewSlot({ ...newSlot, teacherName: e.target.value })} />
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: '12px', background: 'var(--mobile-primary)', color: '#fff', border: 'none', fontWeight: 600 }}>Save Class</button>
              </form>
            )}

            {DAYS.map(day => {
              const daySlots = slotsByDay[day];
              if (day === 'Sunday' && daySlots.length === 0) return null;

              return (
                <div key={day} style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-primary)', marginBottom: '16px' }}>{day}</h3>
                  {daySlots.length === 0 ? (
                    <div style={{ fontSize: '14px', color: 'var(--mobile-text-tertiary)', fontStyle: 'italic' }}>No classes</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {daySlots.map(slot => (
                        <div key={slot._id} style={{ display: 'flex', gap: '12px', background: 'var(--mobile-bg)', borderRadius: '16px', padding: '12px', border: '1px solid var(--mobile-border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '60px', borderRight: '1px solid var(--mobile-border)', paddingRight: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>{slot.startTime}</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>to {slot.endTime}</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '4px' }}>{slot.subjectId?.name || 'Unknown'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--mobile-text-secondary)' }}>
                              {slot.room && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {slot.room}</span>}
                            </div>
                          </div>
                          <button onClick={() => handleDelete(slot._id)} style={{ padding: '8px', border: 'none', background: 'transparent', color: 'var(--mobile-danger)' }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showImportModal && (
        <TimetableImportModal
          semesterId={activeSemesterId}
          subjects={subjects}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchTimetable();
          }}
        />
      )}
    </div>
  );
}
