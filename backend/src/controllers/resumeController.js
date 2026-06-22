const Resume = require('../models/Resume');
const { generateResumeContent } = require('../services/resumeGenerator');
const { getTemplate, TEMPLATE_IDS } = require('../services/resumeTemplates');
const { generateResumePdf } = require('../services/resumePdfExporter');
const { checkAtsStructure } = require('../services/atsStructureChecker');
const { analyzeSkillGap } = require('../services/resumeSkillGapAnalyzer');
const { generateRecruiterAnalysis } = require('../services/recruiterAnalysisService');
const { generateRewriteSuggestions } = require('../services/resumeRewriteService');
const JobDescription = require('../models/JobDescription');
const { extractKeywords } = require('../services/jobDescriptionKeywordExtractor');
const { parseUploadedResume } = require('../services/resumeParser');
const { validateAtsCompatibility } = require('../services/atsValidationService');
const { simulateHiringManagerReview } = require('../services/hiringManagerSimulationService');
const cloudinary = require('../config/cloudinary');

const defaultContent = {
  personalInfo: { name: "", email: "", phone: "", linkedin: "", github: "", portfolio: "" },
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  internships: [],
  achievements: [],
  research: [],
  experience: []
};

const createResume = async (req, res) => {
  try {
    const { targetRole, title } = req.body;
    if (!targetRole || !title) {
      return res.status(400).json({ success: false, message: 'Target role and title are required' });
    }

    const { success, content, sourceSnapshot } = await generateResumeContent(req.user.id, targetRole);

    const resume = await Resume.create({
      userId: req.user.id,
      targetRole,
      title,
      content: success && content ? content : defaultContent,
      sourceSnapshot: sourceSnapshot || {},
      lastGeneratedAt: success ? new Date() : undefined
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { success, content, rawResponse } = await parseUploadedResume(req.file.buffer, req.file.mimetype);

    if (!success) {
      return res.status(400).json({ success: false, message: 'Failed to parse resume: ' + rawResponse });
    }

    // Un-wrap if Gemini put everything inside a "content" or "resume" root key
    let finalContent = content;
    if (finalContent && finalContent.content && !finalContent.personalInfo) {
      finalContent = finalContent.content;
    } else if (finalContent && finalContent.resume && !finalContent.personalInfo) {
      finalContent = finalContent.resume;
    }

    let cloudinaryUrl, publicId;
    try {
      const uploadResult = await cloudinary.uploadCareerDocToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      cloudinaryUrl = uploadResult.cloudinaryUrl;
      publicId = uploadResult.publicId;
    } catch (err) {
      console.error('Cloudinary upload failed for resume', err);
    }

    const defaultSectionOrder = [
      'personalInfo',
      'education',
      'skills',
      'projects',
      'internships',
      'experience',
      'certifications',
      'research',
      'achievements'
    ];

    const resume = await Resume.create({
      userId: req.user.id,
      title: req.file.originalname,
      content: finalContent,
      sectionOrder: defaultSectionOrder,
      hiddenSections: [],
      origin: 'uploaded',
      originalFileUrl: cloudinaryUrl,
      cloudinaryPublicId: publicId,
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const listResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .select('id title targetRole lastGeneratedAt')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    res.status(200).json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateResume = async (req, res) => {
  try {
    const { content, sectionOrder, hiddenSections, templateId, title } = req.body;

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (sectionOrder !== undefined) updates.sectionOrder = sectionOrder;
    if (hiddenSections !== undefined) updates.hiddenSections = hiddenSections;
    if (templateId !== undefined) updates.templateId = templateId;
    if (title !== undefined) updates.title = title;

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    res.status(200).json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const regenerateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const { success, content, sourceSnapshot } = await generateResumeContent(req.user.id, resume.targetRole);

    if (success && content) {
      resume.content = content;
      resume.sourceSnapshot = sourceSnapshot || {};
      resume.lastGeneratedAt = new Date();
      await resume.save();
      res.status(200).json({ success: true, resume });
    } else {
      res.status(500).json({ success: false, message: 'Failed to regenerate resume content' });
    }
  } catch (error) {
    console.error('Regenerate resume error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    res.status(200).json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const previewResumeHTML = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const renderFunc = getTemplate(resume.templateId);
    const html = renderFunc(resume);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateResumeTemplate = async (req, res) => {
  try {
    const { templateId } = req.body;
    if (!templateId || !TEMPLATE_IDS.includes(templateId)) {
      return res.status(400).json({ success: false, message: 'Invalid templateId' });
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { templateId } },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    res.status(200).json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportResumePdf = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const { pdfUrl } = await generateResumePdf(resume);

    resume.lastExportedPdfUrl = pdfUrl;
    resume.lastExportedAt = new Date();
    await resume.save();

    res.status(200).json({ success: true, pdfUrl });
  } catch (error) {
    console.error('Export resume error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const analyzeResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const { jobDescription } = req.body;

    const structureIssues = checkAtsStructure(resume);
    const skillGapResult = await analyzeSkillGap(resume, jobDescription || null);

    const combinedAnalysis = {
      structureIssues,
      skillGapAnalysis: skillGapResult.success ? skillGapResult.analysis : null,
      jobDescriptionUsed: jobDescription || null,
      analyzedAt: new Date()
    };

    if (!skillGapResult.success) {
      combinedAnalysis.skillGapAnalysisFailed = true;
      combinedAnalysis.skillGapErrorNote = "AI skill gap analysis failed or timed out. Showing only structural checks.";
    }

    resume.lastAnalysis = combinedAnalysis;
    await resume.save();

    res.status(200).json({ success: true, analysis: combinedAnalysis });
  } catch (error) {
    console.error('Analyze resume error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const runRecruiterAnalysis = async (req, res) => {
  try {
    const { jobDescriptionId } = req.body;
    
    if (!jobDescriptionId) {
      return res.status(400).json({ success: false, message: 'A specific Job Description must be selected for this analysis.' });
    }

    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const jobDescription = await JobDescription.findOne({ _id: jobDescriptionId, userId: req.user.id });
    if (!jobDescription) {
      return res.status(404).json({ success: false, message: 'Job Description not found' });
    }

    if (!jobDescription.extractedKeywords || jobDescription.extractedKeywords.length === 0) {
      const { success: extractSuccess, keywords } = await extractKeywords(jobDescription.rawText);
      if (extractSuccess && keywords && keywords.length > 0) {
        jobDescription.extractedKeywords = keywords;
        await jobDescription.save();
      }
    }

    const { success, analysis, rawResponse } = await generateRecruiterAnalysis(resume, jobDescription);

    if (success && analysis) {
      resume.recruiterAnalysis = {
        jobDescriptionId,
        analysis,
        analyzedAt: new Date()
      };
      await resume.save();
      
      res.status(200).json({ success: true, analysis });
    } else {
      res.status(500).json({ success: false, message: 'Failed to generate recruiter analysis', details: rawResponse });
    }

  } catch (error) {
    console.error('Recruiter analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateRewriteSuggestionsController = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    if (!resume.recruiterAnalysis || !resume.recruiterAnalysis.jobDescriptionId) {
      return res.status(400).json({ success: false, message: 'Recruiter Analysis must be run before generating rewrite suggestions.' });
    }

    const jobDescription = await JobDescription.findOne({ _id: resume.recruiterAnalysis.jobDescriptionId, userId: req.user.id });
    if (!jobDescription) {
      return res.status(404).json({ success: false, message: 'Associated Job Description not found' });
    }

    const { success, suggestions, rawResponse } = await generateRewriteSuggestions(resume, jobDescription, resume.recruiterAnalysis.analysis);

    if (success && suggestions) {
      resume.pendingRewriteSuggestions = suggestions;
      await resume.save();
      
      res.status(200).json({ success: true, suggestions });
    } else {
      res.status(500).json({ success: false, message: 'Failed to generate rewrite suggestions', details: rawResponse });
    }
  } catch (error) {
    console.error('Rewrite suggestions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const applyRewriteController = async (req, res) => {
  try {
    const { section, entryIndex, action } = req.body;
    
    if (!section || entryIndex === undefined || !action) {
      return res.status(400).json({ success: false, message: 'Missing required fields: section, entryIndex, action' });
    }
    
    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ success: false, message: 'Action must be "accept" or "reject"' });
    }

    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    if (!resume.pendingRewriteSuggestions || !resume.pendingRewriteSuggestions[section]) {
      return res.status(400).json({ success: false, message: 'No pending suggestions for this section' });
    }

    const suggestionIndex = resume.pendingRewriteSuggestions[section].findIndex(s => s.entryIndex === entryIndex);
    if (suggestionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Suggestion not found for this entry' });
    }

    const suggestion = resume.pendingRewriteSuggestions[section][suggestionIndex];

    if (action === 'accept') {
      if (resume.content && resume.content[section] && resume.content[section][entryIndex]) {
        // Use markModified to ensure Mongoose detects the deep object change
        resume.content[section][entryIndex].description = suggestion.rewritten;
        resume.markModified('content');
      }
    }

    // Always remove the suggestion from pending after handling
    resume.pendingRewriteSuggestions[section].splice(suggestionIndex, 1);
    resume.markModified('pendingRewriteSuggestions');

    await resume.save();

    res.status(200).json({ success: true, resume });
  } catch (error) {
    console.error('Apply rewrite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const simulateReviewController = async (req, res) => {
  try {
    const { jobDescriptionId } = req.body;
    if (!jobDescriptionId) {
      return res.status(400).json({ success: false, message: 'jobDescriptionId is required' });
    }

    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const jobDescription = await JobDescription.findOne({ _id: jobDescriptionId, userId: req.user.id });
    if (!jobDescription) {
      return res.status(404).json({ success: false, message: 'Job Description not found' });
    }

    // 1. Run deterministic ATS validation (synchronous)
    const atsValidationResult = validateAtsCompatibility(resume);
    resume.atsValidation = atsValidationResult;

    // 2. Run AI Hiring Manager Simulation (async, isolated failure)
    const simResult = await simulateHiringManagerReview(resume, jobDescription);
    if (simResult.success && simResult.simulation) {
      resume.hiringManagerSimulation = {
        jobDescriptionId,
        simulation: simResult.simulation,
        analyzedAt: new Date().toISOString()
      };
    } else {
      // If AI fails, we still want to save ATS and not crash
      console.warn('Hiring Manager simulation failed silently:', simResult.rawResponse);
    }

    await resume.save();

    res.status(200).json({
      success: true,
      atsValidation: resume.atsValidation,
      hiringManagerSimulation: resume.hiringManagerSimulation
    });
  } catch (error) {
    console.error('Simulate review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createResume,
  uploadResume,
  listResumes,
  getResume,
  updateResume,
  regenerateResume,
  deleteResume,
  previewResumeHTML,
  updateResumeTemplate,
  exportResumePdf,
  analyzeResume,
  runRecruiterAnalysis,
  generateRewriteSuggestionsController,
  applyRewriteController,
  simulateReviewController
};
