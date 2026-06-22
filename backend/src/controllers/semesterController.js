const Semester = require('../models/Semester');

const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({ userId: req.user.id }).sort({ semesterNumber: 1 });
    res.json({ success: true, semesters });
  } catch (error) {
    console.error('Get semesters error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSemester = async (req, res) => {
  try {
    const { semesterNumber, academicYear, startDate, endDate, isActive } = req.body;
    
    if (!semesterNumber || !academicYear) {
      return res.status(400).json({ success: false, message: 'Semester Number and Academic Year are required' });
    }

    // Unset isActive for other semesters ONLY if this one is active
    if (isActive) {
      await Semester.updateMany({ userId: req.user.id }, { isActive: false });
    }

    const semester = await Semester.create({
      userId: req.user.id,
      semesterNumber,
      academicYear,
      startDate,
      endDate,
      isActive: isActive || false,
      isCompleted: false
    });

    res.status(201).json({ success: true, semester });
  } catch (error) {
    console.error('Create semester error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    res.json({ success: true, semester });
  } catch (error) {
    console.error('Update semester error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findOneAndDelete({ _id: id, userId: req.user.id });
    
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    res.json({ success: true, message: 'Semester deleted' });
  } catch (error) {
    console.error('Delete semester error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isCompleted: true, isActive: false },
      { new: true }
    );

    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    res.json({ success: true, semester });
  } catch (error) {
    console.error('Mark complete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  markComplete
};
