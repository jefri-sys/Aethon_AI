import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isSameDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { Plus, X, Trash } from 'lucide-react';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {}
});

const CustomToolbar = ({ label, onNavigate, onView, view }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <button onClick={() => onNavigate('PREV')} className="p-2 hover:bg-slate-100 rounded-md transition-colors">&larr;</button>
      <span className="font-semibold text-lg min-w-[150px] text-center">{label}</span>
      <button onClick={() => onNavigate('NEXT')} className="p-2 hover:bg-slate-100 rounded-md transition-colors">&rarr;</button>
      <button onClick={() => onNavigate('TODAY')} className="px-3 py-1 text-sm font-medium hover:bg-slate-100 rounded-md transition-colors ml-2">Today</button>
    </div>
    <div className="flex gap-2 bg-slate-100 p-1 rounded-md">
      <button 
        onClick={() => onView('month')} 
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${view === 'month' ? 'bg-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
      >
        Month
      </button>
      <button 
        onClick={() => onView('week')} 
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${view === 'week' ? 'bg-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
      >
        Week
      </button>
    </div>
  </div>
);

const eventPropGetter = (event) => ({
  style: {
    backgroundColor: event.resource.color,
    borderRadius: '4px',
    border: 'none',
    color: 'white',
    fontSize: '12px',
    padding: '2px 6px'
  }
});

function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [date, setDate] = useState(new Date());

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/calendar/events');
      if (res.data.success) {
        setEvents(res.data.events);
        setError(false);
      }
    } catch (err) {
      console.error('Failed to load events', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const mappedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.date),
    end: new Date(event.date),
    allDay: true,
    resource: event
  }));

  const getNext7DaysEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return events.filter(e => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= nextWeek;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const upcomingEvents = getNext7DaysEvents();
  
  // Group by date
  const groupedUpcoming = upcomingEvents.reduce((acc, ev) => {
    const dStr = new Date(ev.date).toDateString();
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(ev);
    return acc;
  }, {});

  const handleEventClick = (event) => {
    setSelectedEvent(event.resource);
  };

  const handleDeleteCustom = async (id) => {
    try {
      const actualId = id.replace('custom-', '');
      await api.delete(`/calendar/events/${actualId}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const calculateDaysAway = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `${diffDays} days away`;
  };

  const getSourceLabel = (source) => {
    if (source === 'academic') return 'From Academic Tracker';
    if (source === 'planner') return 'From Study Planner';
    return 'Custom Event';
  };

  return (
    <ProtectedPage
      title="Calendar"
      description="Your smart academic calendar containing all exams, deadlines, and personal events."
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[800px] mt-4">
        
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-6 flex-shrink-0">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1 overflow-y-auto">
            <h3 className="font-semibold text-slate-800 mb-4">Next 7 Days</h3>
            
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nothing coming up in the next 7 days</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedUpcoming).map(([dateStr, evs]) => (
                  <div key={dateStr}>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {isSameDay(new Date(dateStr), new Date()) ? 'Today' : format(new Date(dateStr), 'EEEE, MMM d')}
                    </h4>
                    <div className="space-y-2">
                      {evs.map(ev => (
                        <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded transition-colors">
                          <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ev.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 font-medium truncate">{ev.title}</p>
                            <p className="text-xs text-slate-500">{calculateDaysAway(ev.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Calendar */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          {error ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Could not load calendar. Please refresh.
            </div>
          ) : loading ? (
            <div className="flex-1 animate-pulse">
              <div className="h-10 bg-slate-100 rounded w-full mb-4"></div>
              <div className="grid grid-cols-7 gap-2 h-full">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 rounded border border-slate-100"></div>
                ))}
              </div>
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={mappedEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month', 'week']}
              view={view}
              date={date}
              onNavigate={(d) => setDate(d)}
              onView={(v) => setView(v)}
              components={{
                toolbar: CustomToolbar
              }}
              eventPropGetter={eventPropGetter}
              onSelectEvent={handleEventClick}
              popup
            />
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-center text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> Exam</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#F97316]"></span> Deadline</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span> Study Task</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#A855F7]"></span> Birthday</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#22C55E]"></span> College Event</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#6B7280]"></span> Personal</span>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            fetchEvents();
          }} 
        />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => handleDeleteCustom(selectedEvent.id)}
          daysAway={calculateDaysAway(selectedEvent.date)}
          sourceLabel={getSourceLabel(selectedEvent.source)}
        />
      )}
    </ProtectedPage>
  );
}

const CalendarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const AddEventModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'personal',
    priority: 'medium',
    reminderDays: 1,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      setError('Title and date are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/calendar/events', formData);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Add Custom Event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
              placeholder="E.g. College Fest"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="birthday">Birthday</option>
                <option value="college">College Event</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reminder</label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={formData.reminderDays}
              onChange={e => setFormData({...formData, reminderDays: parseInt(e.target.value)})}
            >
              <option value={0}>Same day</option>
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea 
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" 
              rows="3"
              placeholder="Any extra details..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventDetailModal = ({ event, onClose, onDelete, daysAway, sourceLabel }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-start justify-between p-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white mb-2 uppercase tracking-wide" style={{ backgroundColor: event.color }}>
              {event.category}
            </div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight pr-4">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">Date</p>
            <p className="text-slate-800 font-medium">{format(new Date(event.date), 'EEEE, d MMMM yyyy')}</p>
            <p className="text-indigo-600 font-medium text-sm mt-0.5">{daysAway}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">Priority</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize
                ${event.priority === 'high' ? 'bg-red-100 text-red-700' : 
                  event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'}`}>
                {event.priority || 'Medium'}
              </span>
            </div>
            {event.reminderDays !== undefined && (
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">Reminder</p>
                <p className="text-sm font-medium text-slate-700">{event.reminderDays === 0 ? 'Same day' : `${event.reminderDays} days before`}</p>
              </div>
            )}
          </div>

          {event.notes && (
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">Notes</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-md border border-slate-100 whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-slate-400 font-medium italic">{sourceLabel}</p>
          </div>
        </div>

        {event.source === 'custom' && (
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this event?')) {
                  onDelete();
                }
              }} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 font-medium hover:bg-red-50 rounded-md transition-colors text-sm"
            >
              <Trash className="w-4 h-4" /> Delete Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
