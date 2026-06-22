const CustomEvent = require('../models/CustomEvent');
const Subject = require('../models/Subject');
const StudyTask = require('../models/StudyTask');
const Semester = require('../models/Semester');
const TimetableSlot = require('../models/TimetableSlot');
const ExamSchedule = require('../models/ExamSchedule');

const getCustomColor = (category) => {
  switch (category) {
    case 'birthday': return '#A855F7';
    case 'college': return '#22C55E';
    case 'personal':
    case 'other':
    default: return '#6B7280';
  }
};

const getCalendarEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch exams from Subject (legacy) and ExamSchedule (new)
    const subjects = await Subject.find({ userId, examDate: { $exists: true, $ne: null } }).lean();
    const legacyExamEvents = subjects.map(s => ({
      id: `exam-legacy-${s._id}`,
      title: `${s.name} Exam`,
      date: s.examDate,
      category: 'exam',
      priority: 'high',
      color: '#EF4444',
      source: 'academic',
      referenceId: s._id
    }));

    const examSchedules = await ExamSchedule.find({ userId }).populate('subjectId', 'name code').lean();
    const newExamEvents = examSchedules.map(e => {
      // For end semester, maybe darker red or border? We'll use a very bold red color
      const isEndSem = e.examType === 'endSemester';
      const typeLabel = e.examType === 'internal1' ? 'Internal 1' : e.examType === 'internal2' ? 'Internal 2' : 'End Semester';
      
      const dateObj = new Date(e.date);
      if (e.startTime) {
        const [h, m] = e.startTime.split(':');
        dateObj.setHours(parseInt(h), parseInt(m), 0, 0);
      }

      return {
        id: `exam-${e._id}`,
        title: `${e.subjectId?.name || 'Class'} ${typeLabel}`,
        date: dateObj,
        category: 'exam',
        priority: 'high',
        color: isEndSem ? '#991B1B' : '#DC2626', // Dark red for endSem, standard red for internal
        source: 'academic',
        referenceId: e._id,
        notes: `Venue: ${e.venue || 'TBA'}\nTime: ${e.startTime || 'TBA'}`
      };
    });

    const examEvents = [...legacyExamEvents, ...newExamEvents];

    // 2. Fetch study tasks
    const tasks = await StudyTask.find({ userId }).lean();
    const taskEvents = [];
    tasks.forEach(t => {
      // Add deadline event
      if (t.dueDate) {
        taskEvents.push({
          id: `deadline-${t._id}`,
          title: `${t.title} Due`,
          date: t.dueDate,
          category: 'deadline',
          priority: t.priority?.toLowerCase() || 'medium',
          color: '#F97316',
          source: 'planner',
          referenceId: t._id
        });
      }
      // Add scheduled study task event
      if (t.scheduledDate) {
        taskEvents.push({
          id: `study-${t._id}`,
          title: t.title,
          date: t.scheduledDate,
          category: 'study',
          priority: t.priority?.toLowerCase() || 'medium',
          color: '#3B82F6',
          source: 'planner',
          referenceId: t._id
        });
      }
    });

    // 3. Fetch custom events
    const customEvents = await CustomEvent.find({ userId }).lean();
    const customMapped = customEvents.map(c => ({
      id: `custom-${c._id}`,
      title: c.title,
      date: c.date,
      category: c.category,
      priority: c.priority,
      color: getCustomColor(c.category),
      source: 'custom',
      referenceId: c._id,
      reminderDays: c.reminderDays,
      notes: c.notes
    }));

    // Merge and sort
    const allEvents = [...examEvents, ...taskEvents, ...customMapped];
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, events: allEvents });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomEvent = async (req, res) => {
  try {
    const { title, date, category, priority, reminderDays, notes } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required.' });
    }

    const newEvent = new CustomEvent({
      userId: req.user.id,
      title,
      date,
      category,
      priority,
      reminderDays,
      notes
    });

    await newEvent.save();

    res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating custom event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await CustomEvent.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Custom event not found.' });
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating custom event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCustomEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await CustomEvent.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Custom event not found.' });
    }

    res.json({ success: true, message: 'Custom event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting custom event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCalendarEvents,
  createCustomEvent,
  updateCustomEvent,
  deleteCustomEvent
};
