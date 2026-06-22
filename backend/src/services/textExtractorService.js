const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts text from a given buffer based on the mimeType.
 * Supported types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
 * @param {Buffer} buffer - File buffer
 * @param {String} mimeType - File mimetype
 * @returns {Promise<{text: String, pageCount: Number}>} Extracted text and page count
 */
async function extractText(buffer, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      let text = data.text;
      let pageCount = data.numpages;

      // Fallback for scanned PDFs (image-based)
      if (!text || text.trim().length < 50) {
        try {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
          const base64Data = buffer.toString('base64');
          
          let result;
          let retries = 2;
          while (retries > 0) {
            try {
              result = await model.generateContent([
                { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
                'Extract all text from this PDF exactly as written.'
              ]);
              break;
            } catch (err) {
              retries--;
              if (retries === 0) throw err;
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          text = result.response.text();
        } catch (ocrErr) {
          console.error('Gemini OCR fallback failed:', ocrErr.message);
          let errMsg = ocrErr.message;
          if (ocrErr.status === 429 || (errMsg && errMsg.includes('429'))) {
             errMsg = 'The AI service is receiving too many requests right now. Please wait about 30-60 seconds and try again.';
          } else if (errMsg && errMsg.includes('503')) {
             errMsg = 'The AI service is currently overloaded. Please try again in a few moments.';
          } else if (errMsg && errMsg.includes('fetch failed')) {
             errMsg = 'Network connection dropped while uploading the PDF to the AI. Please try again.';
          }
          throw new Error('AI OCR failed: ' + errMsg);
        }
      }

      return { text, pageCount };
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, pageCount: Math.ceil(result.value.length / 1500) || 1 };
    } else {
      throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(error.message || 'Failed to extract text from file.');
  }
}

module.exports = { extractText };
