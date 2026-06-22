const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { verifyToken } = require('../middleware/auth');
const CustomPdfPlan = require('../models/CustomPdfPlan');
const StudyTask = require('../models/StudyTask');
const { routeRequest } = require('../services/aiRouter');
const { buildPersonalizedSystemPrompt } = require('../services/buildPersonalizedPrompt');
const User = require('../models/User');
const { scheduleTopics } = require('../utils/plannerScheduler');
const { addAINotes } = require('../utils/aiNotes');

const router = express.Router();
router.use(verifyToken);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 } // 10MB, max 5 files
});

// POST /api/custom-pdf-plan/extract-topics
router.post('/extract-topics', upload.array('pdfs', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No PDF files provided.' });
    }

    const fileNames = [];
    let combinedText = '';

    for (const file of req.files) {
      if (file.mimetype !== 'application/pdf') {
        continue;
      }
      fileNames.push(file.originalname);
      const data = await pdfParse(file.buffer);
      combinedText += data.text + '\n\n---\n\n';
    }

    // Truncate to 12000 characters
    if (combinedText.length > 12000) {
      combinedText = combinedText.substring(0, 12000);
    }

    if (combinedText.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the PDF. It may be a scanned image or protected.' });
    }

    const prompt = `You are analysing study material extracted from a PDF — likely a university syllabus, textbook chapter list, or course outline.

Your job is to extract EVERY distinct topic exactly as it appears in the source material, preserving the original structure and granularity. Do NOT merge, summarise, or collapse topics.

Return ONLY a valid JSON array. No explanation, no markdown, no code fences. Format:
[
  {
    "module": "Module name or chapter heading this topic belongs to",
    "title": "Exact topic title as it appears in the source",
    "estimatedHours": 2,
    "difficulty": "medium"
  }
]

Rules:
- "module": use the section/module/chapter heading this topic falls under. If the PDF has "Module I — Introduction to Research Methodology", every topic under it gets module: "Module I — Introduction to Research Methodology". If there are no explicit headings, use "General".
- "title": copy the topic name as faithfully as possible. Do not paraphrase. Do not merge two rows into one.
- "estimatedHours": realistic self-study time for a college student (0.5 to 4 per topic). Base this on the topic's breadth — a single concept is 0.5–1h, a multi-part topic is 1.5–3h.
- "difficulty": "easy" for recall/definition topics, "medium" for conceptual topics, "hard" for mathematical/analytical topics (statistics, regression, experimental design).
- If a syllabus row contains multiple items separated by dashes or commas (e.g. "Editing - Coding - Classification - Tabulation"), keep them together as ONE topic with that full title — do not split them.
- Preserve the order topics appear in the PDF — do not reorder.
- No artificial cap on topic count. Extract everything present. A 5-module syllabus typically yields 20–35 topics.

PDF Content:
${combinedText}`;

    const userDoc = await User.findById(req.user.id).select('aiPreferences');
    const finalPrompt = buildPersonalizedSystemPrompt({
      basePrompt: prompt,
      scope: 'planner',
      aiPreferences: userDoc?.aiPreferences,
      formatGuard: true
    });

    let responseText = await routeRequest("study-planner", { prompt: finalPrompt, userId: req.user.id });
    
    // Safely parse JSON
    let jsonStart = responseText.indexOf('[');
    let jsonEnd = responseText.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }
    
    let topics = [];
    try {
      topics = JSON.parse(responseText);
    } catch (err) {
      throw new Error("AI failed to output valid JSON for topics. Raw response: " + responseText.substring(0, 200) + "...");
    }

    res.json({
      topics,
      extractedTextLength: combinedText.length,
      fileNames,
      extractedText: combinedText
    });
  } catch (error) {
    console.error('Extract topics error:', error);
    res.status(500).json({ error: error.message });
  }
});


// POST /api/custom-pdf-plan/generate-plan
router.post('/generate-plan', async (req, res) => {
  try {
    const { topics, constraints } = req.body;

    // --- Validation ---
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'At least one topic is required' });
    }
    if (!constraints?.startDate || !constraints?.endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    if (new Date(constraints.startDate) >= new Date(constraints.endDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    if (!constraints.dailyHours || constraints.dailyHours < 0.5 || constraints.dailyHours > 16) {
      return res.status(400).json({ error: 'Daily hours must be between 0.5 and 16' });
    }

    // --- Step 1: Schedule with pure Node.js math ---
    const scheduledPlan = scheduleTopics(topics, constraints);

    // --- Step 2: Add AI notes (non-blocking — plan is valid even if this fails) ---
    const callAI = async (prompt) => {
      const userDoc = await User.findById(req.user.id).select('aiPreferences');
      const finalPrompt = buildPersonalizedSystemPrompt({
        basePrompt: prompt,
        scope: 'planner',
        aiPreferences: userDoc?.aiPreferences,
        formatGuard: true
      });
      return await routeRequest("study-planner", { prompt: finalPrompt, userId: req.user.id });
    };
    
    const planWithNotes = await addAINotes(scheduledPlan, callAI);

    // --- Final filter: ensure no 0m tasks slip through (defensive) ---
    const finalPlan = planWithNotes
      .map(day => ({
        ...day,
        tasks: day.tasks.filter(t => t.durationMinutes > 0)
      }))
      .filter(day => day.tasks.length > 0);

    return res.json({ plan: finalPlan });

  } catch (err) {
    console.error('Generate plan error:', err);
    return res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// POST /api/custom-pdf-plan/confirm
router.post('/confirm', async (req, res) => {
  try {
    const { name, pdfFileNames, extractedText, topics, constraints, generatedPlan, addToPlanner } = req.body;
    
    if (!name || !generatedPlan) {
      return res.status(400).json({ error: 'Name and generatedPlan are required.' });
    }

    const customPdfPlan = new CustomPdfPlan({
      user: req.user.id,
      name,
      pdfFileNames: pdfFileNames || [],
      extractedText: extractedText || '',
      topics: topics || [],
      constraints: constraints || {},
      generatedPlan
    });

    const safePlan = generatedPlan.map(day => ({
      ...day,
      tasks: (day.tasks || []).filter(task => task.durationMinutes && task.durationMinutes > 0)
    })).filter(day => day.tasks.length > 0);

    const studyTaskIds = [];
    
    for (const day of safePlan) {
      for (const task of day.tasks) {
        const sessionSuffix = task.totalSessions > 1 ? ` (Session ${task.sessionNumber}/${task.totalSessions})` : '';
        const taskTitle = `${task.topicTitle}${sessionSuffix}`;
        const taskNotes = `[${task.module}] ${task.notes || ''}`.trim();
        
        let priority = 'Medium';
        if (task.difficulty === 'hard') priority = 'High';
        else if (task.difficulty === 'easy') priority = 'Low';

        if (addToPlanner !== false) {
          const studyTask = new StudyTask({
            userId: req.user.id,
            title: taskTitle,
            dueDate: new Date(day.date),
            scheduledDate: new Date(day.date),
            estimatedHours: task.durationMinutes ? (task.durationMinutes / 60) : 1,
            status: 'Pending',
            source: 'custom_pdf_plan',
            notes: taskNotes,
            priority: priority,
            isAIGenerated: true
          });
          
          await studyTask.save();
          studyTaskIds.push(studyTask._id);
        }
      }
    }
    
    customPdfPlan.studyTaskIds = studyTaskIds;
    await customPdfPlan.save();
    
    res.status(201).json({ planId: customPdfPlan._id, tasksCreated: studyTaskIds.length });
  } catch (error) {
    console.error('Confirm plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/custom-pdf-plan
router.get('/', async (req, res) => {
  try {
    const plans = await CustomPdfPlan.find({ user: req.user.id }).sort({ createdAt: -1 });
    const formattedPlans = plans.map(p => ({
      _id: p._id,
      name: p.name,
      pdfFileNames: p.pdfFileNames,
      createdAt: p.createdAt,
      taskCount: p.studyTaskIds ? p.studyTaskIds.length : 0
    }));
    res.json(formattedPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/custom-pdf-plan/:id
router.delete('/:id', async (req, res) => {
  try {
    const plan = await CustomPdfPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    
    if (plan.studyTaskIds && plan.studyTaskIds.length > 0) {
      await StudyTask.deleteMany({ _id: { $in: plan.studyTaskIds } });
    }
    
    await CustomPdfPlan.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/custom-pdf-plan/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const plan = await CustomPdfPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    let summaryText = `# ${plan.name}\n\n`;
    for (const day of plan.generatedPlan) {
      const d = new Date(day.date).toLocaleDateString();
      summaryText += `## ${d}\n\n`;
      for (const task of day.tasks) {
        summaryText += `### ${task.module} - ${task.topicTitle}\n`;
        const time = Math.floor(task.durationMinutes / 60) > 0 
          ? `${Math.floor(task.durationMinutes / 60)}h ${task.durationMinutes % 60}m` 
          : `${task.durationMinutes}m`;
        summaryText += `- Time: ${time}\n`;
        if (task.notes) summaryText += `- Notes: ${task.notes}\n`;
        summaryText += `\n`;
      }
    }

    const { generateSummaryPdf } = require('../utils/generateSummaryPdf');
    const pdfBuffer = await generateSummaryPdf({
      title: plan.name,
      summaryText
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${plan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/custom-pdf-plan/generate-pdf
router.post('/generate-pdf', async (req, res) => {
  try {
    const { name, generatedPlan, subjectId } = req.body;
    if (!name || !generatedPlan || !subjectId) {
      return res.status(400).json({ error: 'Missing required fields for PDF generation.' });
    }

    // Format the text
    let summaryText = `# ${name}\n\n`;
    for (const day of generatedPlan) {
      const d = new Date(day.date).toLocaleDateString();
      summaryText += `## ${d}\n\n`;
      for (const task of day.tasks) {
        summaryText += `### ${task.module} - ${task.topicTitle}\n`;
        const time = Math.floor(task.durationMinutes / 60) > 0 
          ? `${Math.floor(task.durationMinutes / 60)}h ${task.durationMinutes % 60}m` 
          : `${task.durationMinutes}m`;
        summaryText += `- Time: ${time}\n`;
        if (task.notes) summaryText += `- Notes: ${task.notes}\n`;
        summaryText += `\n`;
      }
    }

    const { generateSummaryPdf } = require('../utils/generateSummaryPdf');
    const pdfBuffer = await generateSummaryPdf({
      title: name,
      summaryText
    });

    const { uploadPdfBuffer } = require('../utils/cloudinaryHelper');
    const uploadResult = await uploadPdfBuffer(pdfBuffer, req.user.id);

    const SubjectFile = require('../models/SubjectFile');
    const subjectFile = new SubjectFile({
      userId: req.user.id,
      subjectId,
      fileName: `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      originalName: `${name}.pdf`,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileSize: pdfBuffer.length,
      fileType: 'application/pdf',
      resourceType: 'raw'
    });
    
    await subjectFile.save();
    res.status(201).json({ success: true, file: subjectFile });

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
