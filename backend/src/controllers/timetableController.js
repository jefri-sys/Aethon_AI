const TimetableSlot = require('../models/TimetableSlot');
const Subject = require('../models/Subject');

const getTimetable = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const slots = await TimetableSlot.find({ userId: req.user.id, semesterId }).populate('subjectId', 'name code');
    res.json({ success: true, slots });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveTimetable = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { slots } = req.body;

    if (!Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'Slots array is required' });
    }

    // Delete existing slots for this semester
    await TimetableSlot.deleteMany({ userId: req.user.id, semesterId });

    // Map and insert new slots
    const newSlots = slots.map(slot => ({
      userId: req.user.id,
      semesterId,
      subjectId: slot.subjectId,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      teacherName: slot.teacherName
    }));

    const createdSlots = await TimetableSlot.insertMany(newSlots);
    res.status(201).json({ success: true, slots: createdSlots });
  } catch (error) {
    console.error('Save timetable error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTimetableSlot = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const slot = await TimetableSlot.create({
      ...req.body,
      userId: req.user.id,
      semesterId
    });
    
    // Populate subject for frontend
    await slot.populate('subjectId', 'name code');
    
    res.status(201).json({ success: true, slot });
  } catch (error) {
    console.error('Add timetable slot error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await TimetableSlot.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    console.error('Delete timetable slot error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTimetable,
  saveTimetable,
  addTimetableSlot,
  deleteTimetableSlot
};
