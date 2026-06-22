const ExamSchedule = require('../models/ExamSchedule');

const getExams = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const exams = await ExamSchedule.find({ userId: req.user.id, semesterId }).populate('subjectId', 'name code').sort({ date: 1 });
    res.json({ success: true, exams });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveExams = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { exams } = req.body;

    if (!Array.isArray(exams)) {
      return res.status(400).json({ success: false, message: 'Exams array is required' });
    }

    const newExams = exams.map(e => ({
      userId: req.user.id,
      semesterId,
      subjectId: e.subjectId,
      examType: e.examType,
      date: e.date,
      startTime: e.startTime,
      venue: e.venue,
      notes: e.notes
    }));

    const createdExams = await ExamSchedule.insertMany(newExams);
    res.status(201).json({ success: true, exams: createdExams });
  } catch (error) {
    console.error('Save exams error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addExam = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const exam = await ExamSchedule.create({
      ...req.body,
      userId: req.user.id,
      semesterId
    });
    
    await exam.populate('subjectId', 'name code');
    res.status(201).json({ success: true, exam });
  } catch (error) {
    console.error('Add exam error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await ExamSchedule.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExams,
  saveExams,
  addExam,
  deleteExam
};
