const { routeRequest } = require('../services/aiRouter');
const { buildStudentContext } = require('../services/aiContextBuilder');
const Briefing = require('../models/Briefing');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const StudyTask = require('../models/StudyTask');
const CustomEvent = require('../models/CustomEvent');
const ExamSchedule = require('../models/ExamSchedule');
const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const { calculateCGPA } = require('../services/academicService');
const { askGroq } = require('../services/groqService');
const { buildPersonalizedSystemPrompt } = require('../services/buildPersonalizedPrompt');

const extractCourses = async (req, res) => {
  try {
    const { document } = req.body;
    
    if (!document || !document.source || !document.source.data) {
      return res.status(400).json({ success: false, message: 'Invalid document block provided.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return a mock response so the user can test the flow without a real API key
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.json({
        success: true,
        courses: [
          {
            name: "Mocked AI Course 1",
            code: "AI101",
            professor: "Dr. AI Mock",
            semester: 1,
            credits: 3,
            schedule: "Mon 10:00",
            room: "Room 101"
          },
          {
            name: "Mocked Lab Course",
            code: "AILAB1",
            professor: "Prof. System",
            semester: 1,
            credits: 1,
            schedule: "Wed 14:00",
            room: "Lab B"
          }
        ]
      });
    }

    const prompt = `Extract all academic courses from this timetable or document. Return a JSON object with a single 'courses' array. Each course should be an object with the following string fields: 'name', 'code', 'professor', 'semester', 'credits', 'schedule', 'room'. For fields that are not present in the document, use an empty string, except for 'credits' which should be a number (default 3 if unknown), and 'semester' which should be a number (default 1 if unknown). Do not include any other text besides the JSON.\n\nDocument:\n${document}`;

    const contentText = await routeRequest("extract-courses", { prompt, userId: req.user.id });
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json({ success: true, courses: parsed.courses || [] });
  } catch (err) {
    console.error('AI Extraction Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const context = await buildStudentContext(userId);

    let systemPrompt = `You are Synapse AI, an academic assistant for Indian college students. 
  Help with study planning, CGPA analysis, habits, and academic advice. Be concise and friendly.
  You have access to this student's real data:
  ${context}`;

    const userDoc = await User.findById(userId).select('aiPreferences');
    systemPrompt = buildPersonalizedSystemPrompt({
      basePrompt: systemPrompt,
      scope: null,
      aiPreferences: userDoc?.aiPreferences
    });

    const result = await askGroq(message, systemPrompt, conversationHistory);
    
    if (!result.success) {
      return res.status(result.limitHit ? 429 : 500).json({
        success: false,
        limitHit: result.limitHit,
        message: result.message
      });
    }

    return res.json({ success: true, reply: result.data });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return res.status(500).json({ error: 'Failed to process AI chat.' });
  }
};

const getBriefing = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];

    const existingBriefing = await Briefing.findOne({ userId, date: dateStr });
    if (existingBriefing) {
      return res.json({ success: true, content: existingBriefing.content });
    }

    // Fetch user and CGPA
    const student = await User.findById(userId).lean() || { name: 'Student' };
    const cgpaData = await calculateCGPA(userId);
    const cgpa = cgpaData?.cgpa ?? 'N/A';

    // Fetch budget
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    const expenses = await Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }).lean();
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetDoc = await Budget.findOne({ userId }).lean();
    const budgetRemaining = (budgetDoc ? budgetDoc.totalBudget : 5000) - totalSpent;

    // Fetch habits
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const habitsCompletedYesterday = await HabitLog.countDocuments({ userId, date: yesterdayStr, completed: true });
    
    // Quick overall current streak (just the highest current streak of any habit)
    let habitStreak = 0;
    const allHabitLogs = await HabitLog.find({ userId }).sort({ date: -1 }).lean();
    const habits = await Habit.find({ userId }).lean();
    if (habits.length > 0) {
      for (const h of habits) {
        const logs = allHabitLogs.filter(l => l.habitId.toString() === h._id.toString());
        let currentStreak = 0;
        let checkDate = new Date(today);
        const todayStr = today.toISOString().split('T')[0];
        const todayLog = logs.find(l => l.date === todayStr);
        if (!todayLog || !todayLog.completed) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
        while (true) {
          const checkDateStr = checkDate.toISOString().split('T')[0];
          const log = logs.find(l => l.date === checkDateStr);
          if (log && log.completed) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        if (currentStreak > habitStreak) habitStreak = currentStreak;
      }
    }

    // --- Phase C: Calendar Data ---
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    // Fetch exams in next 7 days (legacy)
    const upcomingExams = await Subject.find({
      userId,
      examDate: { $gte: today, $lte: next7Days }
    }).sort({ examDate: 1 }).lean();

    // Fetch exams from new ExamSchedule in next 7 days
    const upcomingScheduledExams = await ExamSchedule.find({
      userId,
      date: { $gte: today, $lte: next7Days }
    }).populate('subjectId', 'name').sort({ date: 1 }).lean();

    // Fetch deadlines and tasks in next 7 days
    const upcomingTasks = await StudyTask.find({
      userId,
      dueDate: { $gte: today, $lte: next7Days },
      status: { $in: ['Pending', 'In Progress'] }
    }).sort({ dueDate: 1, priority: -1 }).lean();

    // Fetch custom events in next 7 days
    const upcomingCustomEvents = await CustomEvent.find({
      userId,
      date: { $gte: today, $lte: next7Days }
    }).sort({ date: 1, priority: -1 }).lean();

    // Format days away helper
    const formatDaysAway = (date) => {
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "today";
      if (diff === 1) return "tomorrow";
      return `in ${diff} days`;
    };

    let calendarContext = "UPCOMING EVENTS (next 7 days, priority order):\n";

    if (upcomingExams.length > 0 || upcomingScheduledExams.length > 0) {
      calendarContext += "\nEXAMS (highest priority):\n";
      upcomingExams.forEach(e => {
        calendarContext += `- ${e.name} exam ${formatDaysAway(e.examDate)}\n`;
      });
      upcomingScheduledExams.forEach(e => {
        const typeLabel = e.examType === 'internal1' ? 'Internal 1' : e.examType === 'internal2' ? 'Internal 2' : 'End Semester';
        const subjectName = e.subjectId?.name || 'Class';
        const timeVenueStr = (e.startTime || e.venue) ? ` at ${e.startTime || 'TBA'} in ${e.venue || 'TBA'}` : '';
        calendarContext += `- ${subjectName} ${typeLabel} exam ${formatDaysAway(e.date)}${timeVenueStr}\n`;
      });
    }

    if (upcomingTasks.length > 0) {
      calendarContext += "\nDEADLINES & STUDY TASKS:\n";
      upcomingTasks.forEach(t => {
        calendarContext += `- ${t.title} due ${formatDaysAway(t.dueDate)} (${t.priority} priority)\n`;
      });
    }

    if (upcomingCustomEvents.length > 0) {
      calendarContext += "\nOTHER EVENTS:\n";
      upcomingCustomEvents.forEach(e => {
        calendarContext += `- ${e.title} ${formatDaysAway(e.date)} (${e.category})\n`;
      });
    }

    if (upcomingExams.length === 0 && upcomingScheduledExams.length === 0 && upcomingTasks.length === 0 && upcomingCustomEvents.length === 0) {
      calendarContext += "No events in the next 7 days.\n";
    }

    const briefingPrompt = `
You are a personal academic advisor for ${student.name.split(' ')[0]}, an Indian college student.

STUDENT DATA:
- CGPA: ${cgpa}
- Budget remaining this month: ₹${budgetRemaining}
- Current habit streak: ${habitStreak} days
- Habits completed yesterday: ${habitsCompletedYesterday}

${calendarContext}

Write a short, warm, personalised morning briefing (4-5 sentences max).
Rules:
- Lead with the highest priority upcoming event (exam beats everything)
- Mention specific subject names, actual numbers, actual dates
- If a birthday or personal event is coming up mention it warmly at the end
- Tone: like a helpful senior student or mentor, not a robot
- Do not use bullet points — flowing sentences only
- Do not make up data — only reference what is provided above
`;

    const result = await askGroq(briefingPrompt, "You are Synapse AI, a friendly personal advisor for students.");
    
    if (!result.success) {
      return res.status(result.limitHit ? 429 : 500).json({
        success: false,
        limitHit: result.limitHit,
        message: result.message
      });
    }

    const responseText = result.data;

    const newBriefing = new Briefing({
      userId,
      content: responseText.trim(),
      date: dateStr,
    });
    await newBriefing.save();

    return res.json({ success: true, content: newBriefing.content });
  } catch (error) {
    console.error('Error in generating briefing:', error);
    return res.status(500).json({ error: 'Failed to generate briefing.' });
  }
};

const explainMarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('targetCGPA');
    const subjects = await Subject.find({ userId }).lean();
    const marks = await Mark.find({ userId }).populate('subjectId', 'name').lean();

    const marksContext = JSON.stringify({
      targetCGPA: user?.targetCGPA || 8.0,
      subjects: subjects.map(s => ({ id: s._id, name: s.name, credits: s.credits })),
      marks: marks.map(m => ({
        subjectName: m.subjectId?.name,
        marksObtained: m.marksObtained,
        totalMarks: m.totalMarks,
        assessmentType: m.assessmentType,
        grade: m.grade,
      }))
    });

    const prompt = `Analyze this student's marks and identify the top 2 subjects 
    dragging their CGPA below target. For each: name the subject, 
    calculate exactly how many marks improvement is needed, 
    and give one specific study action. Data: ${marksContext}
    
    Return ONLY a valid JSON object with the following structure:
    {
      "explanation": "Brief explanation...",
      "subjectRecommendations": [
        { "subject": "Name", "marksNeeded": "X marks", "action": "Action..." }
      ]
    }`;

    let responseText = await routeRequest('explain-marks', { prompt, userId });

    let jsonStart = responseText.indexOf('{');
    let jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }
    
    const parsedData = JSON.parse(responseText);

    return res.json({
      explanation: parsedData.explanation,
      subjectRecommendations: parsedData.subjectRecommendations,
    });
  } catch (error) {
    console.error('Error in explain-marks:', error);
    return res.status(500).json({ error: 'Failed to explain marks.' });
  }
};

const getFinanceInsight = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query; // 'YYYY-MM'
    
    let startOfMonth, endOfMonth;
    if (month) {
      const [year, m] = month.split('-');
      startOfMonth = new Date(year, parseInt(m) - 1, 1);
      endOfMonth = new Date(year, parseInt(m), 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const expenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const currentMonthStr = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    let budget = await Budget.findOne({ userId, month: currentMonthStr }) 
              || await Budget.findOne({ userId, month: { $exists: false } }) 
              || await Budget.findOne({ userId });

    const totalBudget = budget ? budget.totalBudget : 5000;
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalBudget - totalSpent;
    const isOverBudget = remaining < 0;
    const overBy = isOverBudget ? Math.abs(remaining) : 0;

    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const contextStr = JSON.stringify({
      totalBudget,
      totalSpent,
      remaining,
      isOverBudget,
      overBy,
      categorySpending: categoryTotals,
      overspendSources: expenses.filter(e => e.overspendSource).map(e => e.overspendSource)
    });

    let prompt = `Analyze this student's monthly finance data: ${contextStr}
    Write a brief 2-3 sentence financial insight. Tone: Helpful, not punishing.`;
    
    if (isOverBudget) {
      prompt += `\nCRITICAL: The student has overspent their budget by ₹${overBy}. You MUST explicitly mention this overspend, identify the top categories causing it, and give one constructive piece of advice for next month. Do not scold them.`;
    } else {
      prompt += `\nThe student is within budget. Highlight their top spending category and encourage them.`;
    }

    const result = await askGroq(prompt, "You are a friendly student finance advisor.");
    
    if (!result.success) {
      return res.status(result.limitHit ? 429 : 500).json({ success: false, limitHit: result.limitHit, message: result.message });
    }

    return res.json({ success: true, insight: result.data });
  } catch (error) {
    console.error('Error getting finance insight:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate finance insight.' });
  }
};

module.exports = {
  extractCourses,
  chat,
  getBriefing,
  explainMarks,
  getFinanceInsight
};
