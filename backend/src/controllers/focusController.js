const FocusSession = require('../models/FocusSession');
const Subject = require('../models/Subject');

const recordFocusSession = async (req, res) => {
  try {
    const { subjectId, durationMinutes } = req.body;
    
    // Create new session
    await FocusSession.create({
      userId: req.user.id,
      subjectId: subjectId || null,
      durationMinutes: durationMinutes || 25,
      completedAt: new Date()
    });

    // Calculate total hours today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySessions = await FocusSession.find({
      userId: req.user.id,
      completedAt: { $gte: startOfToday }
    });

    const totalMinutesToday = todaySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const totalHoursToday = (totalMinutesToday / 60).toFixed(2);

    res.status(201).json({ success: true, totalHoursToday: parseFloat(totalHoursToday) });
  } catch (error) {
    console.error('Record focus session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFocusStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sessions = await FocusSession.find({
      userId: req.user.id,
      completedAt: { $gte: sevenDaysAgo }
    }).populate('subjectId', 'name');

    const subjectStats = {};
    let totalOtherMinutes = 0;

    for (const session of sessions) {
      if (session.subjectId) {
        const subName = session.subjectId.name;
        if (!subjectStats[subName]) subjectStats[subName] = 0;
        subjectStats[subName] += session.durationMinutes || 0;
      } else {
        totalOtherMinutes += session.durationMinutes || 0;
      }
    }

    const stats = Object.keys(subjectStats).map(name => ({
      subjectName: name,
      hours: parseFloat((subjectStats[name] / 60).toFixed(2))
    }));

    if (totalOtherMinutes > 0) {
      stats.push({
        subjectName: 'General/Other',
        hours: parseFloat((totalOtherMinutes / 60).toFixed(2))
      });
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get focus stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  recordFocusSession,
  getFocusStats
};
