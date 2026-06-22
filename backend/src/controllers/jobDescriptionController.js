const JobDescription = require('../models/JobDescription');
const cloudinary = require('../config/cloudinary');
const { extractTextFromJobDescriptionFile } = require('../services/jobDescriptionTextExtractor');
const { extractKeywords } = require('../services/jobDescriptionKeywordExtractor');

exports.createJobDescription = async (req, res) => {
  try {
    const { title, companyName, text } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let jobDescriptionData = {
      userId: req.user.id,
      title,
      companyName
    };

    if (req.file) {
      // Handle file upload
      const extractedText = await extractTextFromJobDescriptionFile(req.file.buffer, req.file.mimetype);
      
      const uploadResult = await cloudinary.uploadCareerDocToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      jobDescriptionData.sourceType = 'uploaded';
      jobDescriptionData.rawText = extractedText;
      jobDescriptionData.originalFileUrl = uploadResult.cloudinaryUrl;
      jobDescriptionData.cloudinaryPublicId = uploadResult.publicId;

    } else if (text) {
      // Handle pasted text
      if (!text.trim()) {
        return res.status(400).json({ message: 'Text cannot be empty' });
      }
      jobDescriptionData.sourceType = 'pasted';
      jobDescriptionData.rawText = text.trim();
    } else {
      return res.status(400).json({ message: 'Either a file or text is required' });
    }

    let jobDescription = await JobDescription.create(jobDescriptionData);
    
    // Extract keywords deterministically
    const { success, keywords } = await extractKeywords(jobDescription.rawText);
    if (success && keywords && keywords.length > 0) {
      jobDescription.extractedKeywords = keywords;
      await jobDescription.save();
    }
    
    res.status(201).json({ jobDescription });

  } catch (error) {
    console.error('Error creating job description:', error);
    res.status(error.message === 'Could not extract text from this file' ? 400 : 500)
       .json({ message: error.message || 'Failed to create job description' });
  }
};

exports.getJobDescriptions = async (req, res) => {
  try {
    const jobDescriptions = await JobDescription.find({ userId: req.user.id })
      .select('title companyName sourceType createdAt')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ jobDescriptions });
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    res.status(500).json({ message: 'Failed to fetch job descriptions' });
  }
};

exports.getJobDescription = async (req, res) => {
  try {
    const jobDescription = await JobDescription.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!jobDescription) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    res.status(200).json({ jobDescription });
  } catch (error) {
    console.error('Error fetching job description:', error);
    res.status(500).json({ message: 'Failed to fetch job description' });
  }
};

exports.deleteJobDescription = async (req, res) => {
  try {
    const jobDescription = await JobDescription.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!jobDescription) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    if (jobDescription.sourceType === 'uploaded' && jobDescription.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(jobDescription.cloudinaryPublicId);
    }

    await JobDescription.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Job description deleted successfully' });
  } catch (error) {
    console.error('Error deleting job description:', error);
    res.status(500).json({ message: 'Failed to delete job description' });
  }
};
