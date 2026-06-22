const Notebook = require('../models/Notebook');
const NotebookChat = require('../models/NotebookChat');
const SavedSummary = require('../models/SavedSummary');
const Subject = require('../models/Subject');
const { extractText } = require('../services/textExtractorService');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { routeRequest } = require('../services/aiRouter');
const ragService = require('../services/ragService');
const { generateSummaryPdf } = require('../utils/generateSummaryPdf');
const { uploadPdfBuffer, deletePdfFromCloudinary } = require('../utils/cloudinaryHelper');
const { buildPersonalizedSystemPrompt } = require('../services/buildPersonalizedPrompt');
const User = require('../models/User');

const uploadNotebook = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Extract text and page count
    const { text, pageCount } = await extractText(req.file.buffer, req.file.mimetype);
    
    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `synapse/notebooks`, resource_type: 'auto' },
      async (error, result) => {
        if (error) return res.status(500).json({ success: false, message: error.message });

        const title = req.body.title || req.file.originalname;

        const notebook = await Notebook.create({
          userId: req.user.id,
          subjectId: req.body.subjectId || null,
          title,
          fileName: req.file.originalname,
          fileType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx',
          fileUrl: result.secure_url,
          pageCount: pageCount,
          extractedText: text
        });

        // Trigger RAG indexing asynchronously (fire and forget or await, but here we'll let it run and update)
        ragService.indexDocument(req.file.buffer, req.file.mimetype, notebook._id.toString(), req.file.originalname, pageCount)
          .then(async (ragResult) => {
            notebook.indexed = true;
            notebook.chunksCount = ragResult.chunksIndexed;
            notebook.indexedAt = new Date();
            notebook.chromaCollectionId = `notebook_${notebook._id.toString()}`;
            await notebook.save();
          })
          .catch((err) => {
            console.error('Failed to index notebook for RAG:', err.message);
          });

        res.status(201).json({ success: true, notebookId: notebook._id, title, pageCount });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    console.error('Upload notebook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNotebooks = async (req, res) => {
  try {
    const notebooks = await Notebook.find({ userId: req.user.id }).select('-extractedText').sort('-createdAt');
    res.json({ success: true, notebooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.user.id }).select('-extractedText');
    if (!notebook) return res.status(404).json({ success: false, message: 'Notebook not found' });

    const chats = await NotebookChat.find({ notebookId: notebook._id }).sort('-createdAt').limit(20);
    
    res.json({ success: true, notebook, chats: chats.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notebook) return res.status(404).json({ success: false, message: 'Notebook not found' });

    await NotebookChat.deleteMany({ notebookId: notebook._id });
    await Notebook.findByIdAndDelete(notebook._id);
    
    // Delete from ChromaDB
    await ragService.deleteNotebookIndex(notebook._id.toString());
    
    res.json({ success: true, message: 'Notebook deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notebook) return res.status(404).json({ success: false, message: 'Notebook not found' });

    let assembledPrompt;
    try {
      assembledPrompt = await ragService.queryNotebook(question, notebook._id.toString());
      if (!assembledPrompt && !notebook.indexed) {
        // Collection might not exist or not indexed yet, fallback
        console.log('Notebook not indexed or no RAG results, falling back to full text.');
      }
    } catch (err) {
      console.error('RAG query failed, falling back to full text:', err.message);
      if (err.message && err.message.toLowerCase().includes('does not exist')) {
        console.log('Collection does not exist. Triggering automatic re-indexing in background...');
        fetch(notebook.fileUrl).then(res => res.arrayBuffer()).then(ab => {
          const buffer = Buffer.from(ab);
          const mimeType = notebook.fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          ragService.indexDocument(buffer, mimeType, notebook._id.toString(), notebook.fileName, notebook.pageCount)
            .then(async (ragResult) => {
              notebook.indexed = true;
              notebook.chunksCount = ragResult.chunksIndexed;
              notebook.indexedAt = new Date();
              await notebook.save();
            }).catch(e => console.error('Background re-indexing failed', e));
        }).catch(e => console.error('Failed to fetch notebook file for re-indexing', e));
      }
    }

    const prompt = `You are an expert academic tutor. The student is asking a question about their course material.
I will provide you with excerpts from their uploaded notes below. 

Instructions:
1. Primarily base your answer on the provided STUDENT NOTES.
2. Explain the concepts clearly, comprehensively, and smartly. If the student asks for "more content" or details, expand on the concepts to ensure they fully understand.
3. If the specific details aren't in the notes, use your own extensive academic knowledge to answer the question, but clarify that you are supplementing their notes. Never just say "I cannot find this in your notes". Always be helpful!
4. Format your answer beautifully with bolding, bullet points, and clear paragraphs to make it easy to study.

STUDENT QUESTION:
${question}

${assembledPrompt ? assembledPrompt : `STUDENT NOTES:\n${(notebook.extractedText || '').slice(0, 100000)}`}`;

    const userDoc = await User.findById(req.user.id).select('aiPreferences');
    const finalPrompt = buildPersonalizedSystemPrompt({
      basePrompt: prompt,
      scope: 'notebook',
      aiPreferences: userDoc?.aiPreferences
    });

    const reply = await routeRequest("notebook-chat", { prompt: finalPrompt, userId: req.user.id });

    await NotebookChat.create({
      notebookId: notebook._id,
      userId: req.user.id,
      role: 'user',
      message: question
    });

    await NotebookChat.create({
      notebookId: notebook._id,
      userId: req.user.id,
      role: 'assistant',
      message: reply
    });

    res.json({ success: true, reply });
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateSummary = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notebook) return res.status(404).json({ success: false, message: 'Notebook not found' });

    const prompt = `Summarize these notes into structured bullet points with headers for each main topic. Notes: ${(notebook.extractedText || '').slice(0, 100000)}`;
    
    const userDoc = await User.findById(req.user.id).select('aiPreferences');
    const finalPrompt = buildPersonalizedSystemPrompt({
      basePrompt: prompt,
      scope: 'notebook',
      aiPreferences: userDoc?.aiPreferences
    });

    const summary = await routeRequest("notebook-summary", { prompt: finalPrompt, userId: req.user.id });

    await NotebookChat.create({
      notebookId: notebook._id,
      userId: req.user.id,
      role: 'assistant',
      message: summary
    });

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateQuiz = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notebook) return res.status(404).json({ success: false, message: 'Notebook not found' });

    const prompt = `Generate 10 MCQs from these notes. Return JSON only. No markdown, no code fences. Just the raw JSON array.
Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correct": "A", "explanation": "..."}]
Notes: ${(notebook.extractedText || '').slice(0, 100000)}`;

    const userDoc = await User.findById(req.user.id).select('aiPreferences');
    const finalPrompt = buildPersonalizedSystemPrompt({
      basePrompt: prompt,
      scope: 'notebook',
      aiPreferences: userDoc?.aiPreferences,
      formatGuard: true
    });

    let jsonStr = await routeRequest("notebook-quiz", { prompt: finalPrompt, userId: req.user.id });
    let jsonStart = jsonStr.indexOf('[');
    let jsonEnd = jsonStr.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }
    const quizData = JSON.parse(jsonStr);

    const chat = await NotebookChat.create({
      notebookId: notebook._id,
      userId: req.user.id,
      role: 'assistant',
      message: 'Generated a quiz for you.',
      quizData
    });

    res.json({ success: true, quiz: quizData, chatId: chat._id });
  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; 
    let score = 0;
    const breakdown = [];

    for (const ans of answers) {
      const isCorrect = ans.userAnswer === ans.correct;
      if (isCorrect) score++;
      breakdown.push({
        question: ans.question,
        userAnswer: ans.userAnswer,
        correct: ans.correct,
        isCorrect,
        explanation: ans.explanation
      });
    }

    res.json({ success: true, score, total: answers.length, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getIndexStatus = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notebook) return res.status(404).json({ success: false, message: 'Notebook not found' });

    res.json({ indexed: notebook.indexed, chunksCount: notebook.chunksCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveSummaryAsPdf = async (req, res) => {
  try {
    const { subjectId, title, summaryText } = req.body;
    const { id: notebookId } = req.params;

    if (!summaryText) return res.status(400).json({ success: false, message: 'Summary text is required' });
    if (!subjectId) return res.status(400).json({ success: false, message: 'Subject is required' });

    const notebook = await Notebook.findOne({ _id: notebookId, userId: req.user.id });
    if (!notebook) return res.status(404).json({ success: false, message: 'Notebook not found' });

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const pdfTitle = title || `${notebook.title} Summary`;

    // Generate PDF
    const pdfBuffer = await generateSummaryPdf({
      title: pdfTitle,
      subjectName: subject.name,
      notebookName: notebook.title,
      summaryText
    });

    // Upload to Cloudinary
    const uploadResult = await uploadPdfBuffer(pdfBuffer, req.user.id);

    // Save Record
    const savedSummary = await SavedSummary.create({
      user: req.user.id,
      notebook: notebook._id,
      subject: subject._id,
      title: pdfTitle,
      summaryText,
      pdfUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id
    });

    res.status(201).json({ success: true, savedSummary });
  } catch (error) {
    console.error('Save summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSavedSummaries = async (req, res) => {
  try {
    const { id: notebookId } = req.params;
    const summaries = await SavedSummary.find({ notebook: notebookId, user: req.user.id })
      .populate('subject', 'name')
      .sort('-createdAt');
    res.json({ success: true, summaries });
  } catch (error) {
    console.error('Get saved summaries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSavedSummary = async (req, res) => {
  try {
    const { summaryId } = req.params;
    const summary = await SavedSummary.findOne({ _id: summaryId, user: req.user.id });
    if (!summary) return res.status(404).json({ success: false, message: 'Summary not found' });

    await deletePdfFromCloudinary(summary.cloudinaryPublicId);
    await SavedSummary.findByIdAndDelete(summaryId);

    res.json({ success: true, message: 'Summary deleted' });
  } catch (error) {
    console.error('Delete saved summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadNotebook,
  getNotebooks,
  getNotebook,
  deleteNotebook,
  askQuestion,
  generateSummary,
  generateQuiz,
  submitQuiz,
  getIndexStatus,
  saveSummaryAsPdf,
  getSavedSummaries,
  deleteSavedSummary
};
