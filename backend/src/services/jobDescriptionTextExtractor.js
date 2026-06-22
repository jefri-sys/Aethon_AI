const { extractText } = require('./textExtractorService');

async function extractTextFromJobDescriptionFile(fileBuffer, mimetype) {
  const result = await extractText(fileBuffer, mimetype);
  
  if (!result || !result.text || result.text.trim() === '') {
    throw new Error('Could not extract text from this file');
  }

  return result.text.trim();
}

module.exports = {
  extractTextFromJobDescriptionFile,
};
