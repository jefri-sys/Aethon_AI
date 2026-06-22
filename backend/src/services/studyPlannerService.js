const { routeRequest } = require("./aiRouter");
const { buildPersonalizedSystemPrompt } = require("./buildPersonalizedPrompt");
const Subject = require("../models/Subject");
const Mark = require("../models/Mark");
const StudyTask = require("../models/StudyTask");
const User = require("../models/User");
const SubjectFile = require("../models/SubjectFile");
const { extractText } = require("./textExtractorService");
const { scheduleSubjectTopics } = require("../utils/plannerScheduler");
const { addAINotes } = require("../utils/aiNotes");

async function extractTopicsFromSubjects(subjects, callAI) {
  const results = [];

  for (const subject of subjects) {
    // Fallback for subjects with no PDF text
    if (!subject.pdfText || subject.pdfText.trim().length < 50) {
      results.push({
        ...subject,
        topics: [{
          module: subject.subjectName,
          title: `Study ${subject.subjectName}`,
          estimatedHours: subject.creditHours || 2,
          difficulty: subject.isWeak ? 'hard' : 'medium'
        }]
      });
      continue;
    }

    const truncated = subject.pdfText.slice(0, 10000);
    const weakNote = subject.isWeak
      ? '\nIMPORTANT: This is a weak subject (student scored below 60%). Be thorough — extract every subtopic without exception.'
      : '';

    const prompt = `You are analysing study material for the university subject "${subject.subjectName}".

Extract every distinct topic exactly as it appears. Do NOT merge, summarise, or skip topics.${weakNote}

Return ONLY a valid JSON array. No explanation, no markdown, no code fences:
[
  {
    "module": "Module or chapter heading this topic belongs to (use subject name if no headings exist)",
    "title": "Exact topic title from the source material",
    "estimatedHours": 1.5,
    "difficulty": "medium"
  }
]

Rules:
- Preserve original topic order from the source
- estimatedHours: 0.5 to 4 per topic based on breadth
- difficulty: "easy" (definitions/recall), "medium" (conceptual), "hard" (mathematical/analytical)
- No cap on topic count — extract everything

Course material:
${truncated}`;

    try {
      const raw = await callAI(prompt);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const topics = JSON.parse(cleaned);
      if (Array.isArray(topics) && topics.length > 0) {
        results.push({ ...subject, topics });
      } else {
        throw new Error('Empty topics array returned');
      }
    } catch (err) {
      console.warn(`Topic extraction failed for "${subject.subjectName}":`, err.message);
      results.push({
        ...subject,
        topics: [{
          module: subject.subjectName,
          title: `Study ${subject.subjectName}`,
          estimatedHours: subject.creditHours || 2,
          difficulty: subject.isWeak ? 'hard' : 'medium'
        }]
      });
    }
  }

  return results;
}

async function generateStudyPlan(userId, notebookIds = [], settings = {}) {
  const { dailyHours = 4, daysOff = [], knowledgeText = '', targetDate = '', availableDays = '' } = settings;
  const user = await User.findById(userId).select('semester aiPreferences');
  if (!user) throw new Error('User not found.');
  const currentSemester = user.semester;

  // 1. Fetch user subjects for the current semester with exam dates and credits
  const subjects = await Subject.find({ userId, semester: currentSemester }).select('name code credits examDate');
  
  if (!subjects.length) {
    throw new Error('No subjects found for your current semester. Cannot generate study plan.');
  }

  const subjectIds = subjects.map(s => s._id);

  // 2. Fetch current marks to identify weak subjects
  const marks = await Mark.find({ userId, subjectId: { $in: subjectIds } }).populate('subjectId', 'name');
  
  const subjectMarks = {};
  for (const mark of marks) {
    if (!mark.subjectId) continue;
    const subId = mark.subjectId._id.toString();
    if (!subjectMarks[subId]) {
      subjectMarks[subId] = { totalObtained: 0, totalMax: 0, name: mark.subjectId.name };
    }
    if (mark.marksObtained != null && mark.totalMarks != null) {
      subjectMarks[subId].totalObtained += mark.marksObtained;
      subjectMarks[subId].totalMax += mark.totalMarks;
    }
  }

  const weakSubjects = [];
  for (const [subId, data] of Object.entries(subjectMarks)) {
    if (data.totalMax > 0) {
      const percentage = (data.totalObtained / data.totalMax) * 100;
      if (percentage < 60) {
        weakSubjects.push({ subjectId: subId, name: data.name, percentage });
      }
    }
  }

  // 3. Calculate available study days per subject
  const examDates = subjects.map(s => {
    const daysUntilExam = s.examDate ? Math.ceil((new Date(s.examDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    return {
      subjectId: s._id,
      name: s.name,
      credits: s.credits,
      examDate: s.examDate,
      daysUntilExam
    };
  });

  // 3.5 Fetch syllabus data from SubjectFiles
  if (!notebookIds || notebookIds.length === 0) {
    throw new Error('Please select at least one syllabus document to generate an accurate, module-wise plan.');
  }

  const syllabiFiles = await SubjectFile.find({
    userId,
    _id: { $in: notebookIds }
  });

  if (syllabiFiles.length === 0) {
    throw new Error('Selected syllabus documents could not be found.');
  }

  const syllabi = [];
  const fileErrors = [];
  
  for (const file of syllabiFiles) {
    try {
      const response = await fetch(file.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const { text } = await extractText(buffer, file.fileType || 'application/pdf');
      
      if (!text || text.trim().length < 50) {
        throw new Error(`The file ${file.originalName || file.fileName || 'document'} appears to be empty or is a scanned image without readable text.`);
      }

      syllabi.push({
        subjectId: file.subjectId,
        content: text.substring(0, 15000)
      });
      
      // Delay to avoid hitting the 15 Requests-Per-Minute Google API burst limit if OCR is triggered
      await new Promise(resolve => setTimeout(resolve, 2500));
    } catch (err) {
      console.error(`Error extracting text for file ${file._id}:`, err);
      fileErrors.push(err.message);
    }
  }

  if (syllabi.length === 0) {
    throw new Error(fileErrors.length > 0 ? fileErrors[0] : 'Failed to extract readable text from the selected syllabus documents. Ensure your PDFs contain selectable text and are not just scanned images.');
  }

  // 3.8 Filter context data to ONLY include subjects that have selected syllabi
  const selectedSubjectIds = [...new Set(syllabiFiles.map(f => f.subjectId.toString()))];
  const filteredSubjects = subjects.filter(s => selectedSubjectIds.includes(s._id.toString()));
  const filteredExamDates = examDates.filter(e => selectedSubjectIds.includes(e.subjectId.toString()));
  const filteredWeakSubjects = weakSubjects.filter(w => selectedSubjectIds.includes(w.subjectId.toString()));

  // --- 3.8 Append knowledgeText to the relevant subject's pdfText ---
  const knowledgeString = knowledgeText ? `\n\nStudent Self-Assessment:\n${knowledgeText}` : '';
  
  // --- Build subjects array for the pipeline ---
  const weakSubjectIds = new Set(filteredWeakSubjects.map(w => w.subjectId));
  
  const subjectsForPipeline = filteredSubjects.map(s => {
    // Find matching syllabus content
    const syllabusContext = syllabi.find(syll => syll.subjectId.toString() === s._id.toString());
    const pdfText = syllabusContext ? syllabusContext.content + knowledgeString : knowledgeString;
    
    return {
      subjectId: s._id,
      subjectName: s.name,           
      examDate: s.examDate || null,  
      creditHours: s.credits || 3, 
      isWeak: weakSubjectIds.has(s._id.toString()),
      pdfText
    };
  });

  const callAI = async (prompt) => {
    const finalPrompt = buildPersonalizedSystemPrompt({
      basePrompt: prompt,
      scope: 'planner',
      aiPreferences: user?.aiPreferences,
      formatGuard: true
    });
    return await routeRequest("study-planner", { prompt: finalPrompt, userId });
  };

  // --- STEP 1: AI extracts topics per subject ---
  const subjectsWithTopics = await extractTopicsFromSubjects(subjectsForPipeline, callAI);

  // --- STEP 2: Node.js schedules everything ---
  const startDayStr = new Date().toISOString().split('T')[0];

  const scheduledPlan = scheduleSubjectTopics(subjectsWithTopics, {
    startDate: startDayStr,
    dailyHours: Number(dailyHours),
    daysOff,
    sessionStyle: 'mixed'
  });

  // --- STEP 3: AI adds notes (non-blocking) ---
  const planWithNotes = await addAINotes(scheduledPlan, callAI);

  // --- Final filter: remove 0m tasks ---
  const finalPlan = planWithNotes
    .map(day => ({
      ...day,
      tasks: day.tasks.filter(t => t.durationMinutes > 0)
    }))
    .filter(day => day.tasks.length > 0);

  // --- Map and Save StudyTask records ---
  await StudyTask.deleteMany({ userId, isAIGenerated: true });

  const studyTasks = [];
  for (const day of finalPlan) {
    for (const task of day.tasks) {
      studyTasks.push({
        userId,
        subjectId: task.subjectId,
        title: task.totalSessions > 1
          ? `${task.topicTitle} (Session ${task.sessionNumber}/${task.totalSessions})`
          : task.topicTitle,
        dueDate: new Date(day.date),
        scheduledDate: new Date(day.date),
        estimatedHours: task.durationMinutes / 60,
        topics: [task.module], // Optional mapping
        notes: `[${task.module}] ${task.notes || ''}`.trim(),
        status: 'Pending',
        source: 'ai_planner',
        priority: task.isWeak ? 'High' : 'Medium',
        isAIGenerated: true
      });
    }
  }

  let createdTasks = [];
  let planId = null;
  if (studyTasks.length > 0) {
    createdTasks = await StudyTask.insertMany(studyTasks);
    
    // Create StudyPlan to group these tasks
    const StudyPlan = require('../models/StudyPlan');
    const studyPlan = await StudyPlan.create({
      user: userId,
      title: `Dashboard Plan - ${new Date().toLocaleDateString()}`,
      studyTaskIds: createdTasks.map(t => t._id)
    });
    planId = studyPlan._id;
  }

  return {
    tasksCreated: studyTasks.length,
    tasks: createdTasks,
    planId,
    warning: null
  };
}

module.exports = {
  generateStudyPlan
};
