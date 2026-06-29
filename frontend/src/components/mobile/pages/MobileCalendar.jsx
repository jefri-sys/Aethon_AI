import React, { useState, useEffect } from 'react';
import { format, isSameDay, addDays, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, Plus, BookOpen, Clock, Gift, GraduationCap, User, AlertCircle, FileText } from 'lucide-react';
import api from '../../../services/api';

const getEventStyles = (category) => {
  const styles = {
    exam: { bg: 'var(--mobile-danger-subtle)', text: 'var(--mobile-danger)', icon: FileText, label: 'Exam' },
    deadline: { bg: 'var(--mobile-warning-subtle)', text: 'var(--mobile-warning)', icon: Clock, label: 'Deadline' },
    study: { bg: 'var(--mobile-primary-subtle)', text: 'var(--mobile-primary)', icon: BookOpen, label: 'Study Task' },
    birthday: { bg: 'var(--mobile-info-subtle)', text: 'var(--mobile-info)', icon: Gift, label: 'Birthday' },
    college: { bg: 'var(--mobile-success-subtle)', text: 'var(--mobile-success)', icon: GraduationCap, label: 'College Event' },
    personal: { bg: 'var(--mobile-secondary-subtle)', text: 'var(--mobile-secondary)', icon: User, label: 'Personal' },
    default: { bg: 'var(--mobile-surface-raised)', text: 'var(--mobile-text-secondary)', icon: AlertCircle, label: 'Other' }
  };
  return styles[category] || styles.default;
};

export default function MobileCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "personal",
    priority: "medium",
    reminderDays: 1,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/calendar/events');
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;
    try {
      setSubmitting(true);
      const res = await api.post("/calendar/events", formData);
      if (res.data.success) {
        setShowAddSheet(false);
        fetchEvents();
        setFormData({ ...formData, title: "", notes: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const actualId = id.replace("custom-", "");
      await api.delete(`/calendar/events/${actualId}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Generate a simple week view header
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));

  const eventsForSelectedDay = events.filter(e => isSameDay(new Date(e.date), selectedDate));

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Calendar
        </h1>
        <button 
          onClick={() => { setFormData({ ...formData, date: format(selectedDate, "yyyy-MM-dd") }); setShowAddSheet(true); }}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)' }}
        >
          <Plus color="#fff" size={24} />
        </button>
      </div>

      {/* WEEK STRIP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', background: 'var(--mobile-surface)', padding: '16px 12px', borderRadius: '20px', boxShadow: 'var(--mobile-shadow-card)' }}>
        {weekDays.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
          
          return (
            <div 
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                padding: '8px 4px', borderRadius: '12px',
                background: isSelected ? 'var(--mobile-primary)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--mobile-text-secondary)',
                cursor: 'pointer',
                minWidth: '36px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{format(day, 'EEE')}</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#fff' : (isToday ? 'var(--mobile-primary)' : 'var(--mobile-text-primary)') }}>
                {format(day, 'd')}
              </span>
              <div style={{ display: 'flex', gap: '2px', height: '4px' }}>
                {dayEvents.slice(0,3).map((e, i) => (
                  <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#fff' : getEventStyles(e.category).text }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* EVENTS FOR SELECTED DAY */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '16px' }}>
          {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>Loading...</div>
          ) : eventsForSelectedDay.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CalendarIcon size={48} color="var(--mobile-border)" style={{ marginBottom: '16px' }} />
              <div>No events scheduled for this day.</div>
            </div>
          ) : (
            eventsForSelectedDay.map(ev => {
              const style = getEventStyles(ev.category);
              const Icon = style.icon;
              return (
                <div 
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  style={{ background: 'var(--mobile-surface)', borderRadius: '20px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', gap: '16px' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: style.bg, color: style.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={24} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, marginBottom: '4px' }}>
                      {ev.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ADD EVENT SHEET */}
      {showAddSheet && (
        <>
          <div onClick={() => setShowAddSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--mobile-text-primary)' }}>Add Event</h3>
              <button onClick={() => setShowAddSheet(false)} style={{ background: 'none', border: 'none', color: 'var(--mobile-text-secondary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--mobile-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Title</label>
                <input 
                  type="text" required placeholder="e.g. Final Exam"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', color: 'var(--mobile-text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--mobile-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Date</label>
                  <input 
                    type="date" required
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', color: 'var(--mobile-text-primary)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--mobile-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
                  <select 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', color: 'var(--mobile-text-primary)', outline: 'none' }}
                  >
                    <option value="exam">Exam</option>
                    <option value="deadline">Deadline</option>
                    <option value="study">Study Task</option>
                    <option value="birthday">Birthday</option>
                    <option value="college">College Event</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" disabled={submitting}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--mobile-primary)', color: '#fff', fontWeight: 'bold', border: 'none', marginTop: '8px', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Adding...' : 'Add Event'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* EVENT DETAIL SHEET */}
      {selectedEvent && (
        <>
          <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: getEventStyles(selectedEvent.category).bg, color: getEventStyles(selectedEvent.category).text, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px' }}>
                  {getEventStyles(selectedEvent.category).label}
                </div>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--mobile-text-primary)' }}>{selectedEvent.title}</h3>
                <div style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)', marginTop: '4px' }}>
                  {format(new Date(selectedEvent.date), 'EEEE, MMMM do, yyyy')}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'var(--mobile-text-secondary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {selectedEvent.notes && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--mobile-bg)', borderRadius: '16px', fontSize: '14px', color: 'var(--mobile-text-secondary)', border: '1px solid var(--mobile-border)' }}>
                {selectedEvent.notes}
              </div>
            )}

            <button 
              onClick={() => handleDelete(selectedEvent.id)}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--mobile-danger-subtle)', color: 'var(--mobile-danger)', fontWeight: 'bold', border: 'none' }}
            >
              Delete Event
            </button>
          </div>
        </>
      )}
    </div>
  );
}
