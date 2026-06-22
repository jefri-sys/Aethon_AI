const { routeRequest } = require('./aiRouter');
const { extractText } = require('./textExtractorService');

const RESUME_SCHEMA_PROMPT = `
Extract and map its content into EXACTLY this JSON shape:
{
  "personalInfo": { "name": "string", "email": "string", "phone": "string", "linkedin": "string", "github": "string", "portfolio": "string" },
  "education": [{ "institution": "string", "degree": "string", "field": "string", "startDate": "string", "endDate": "string", "cgpa": "string", "relevantCoursework": ["string"] }],
  "skills": ["string"],
  "projects": [{ "title": "string", "description": "string", "technologies": ["string"], "link": "string", "dateRange": "string" }],
  "certifications": [{ "title": "string", "issuer": "string", "date": "string" }],
  "internships": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "description": "string" }],
  "achievements": [{ "title": "string", "description": "string", "date": "string" }],
  "research": [{ "title": "string", "publication": "string", "date": "string", "description": "string" }],
  "experience": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "description": "string" }]
}

Map whatever section headings/structure the original resume uses onto this schema as sensibly as possible (e.g. a resume with "Work History" instead of "Experience" should still map into the experience array).
If a section doesn't exist in the original resume, return an empty array/object for it rather than omitting the key.
Return ONLY valid JSON, no markdown formatting, no preamble.`;

async function parseUploadedResume(fileBuffer, mimetype) {
  let rawResponse = '';
  try {
    const isDocx = mimetype === 'application/msword' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    let prompt;
    let files = [];

    if (isDocx) {
      // DOCX goes through text extraction -> Gemini Case A (text only)
      const extractResult = await extractText(fileBuffer, mimetype);
      if (!extractResult || !extractResult.text || extractResult.text.trim() === '') {
        throw new Error('Could not extract text from this document');
      }
      
      prompt = `Read the following plain text extracted from a resume document.\n\nText:\n${extractResult.text}\n\n${RESUME_SCHEMA_PROMPT}`;
      // No files needed for Case A
    } else {
      // PDF/Images go through Gemini Case B (vision)
      const base64 = fileBuffer.toString('base64');
      prompt = `Read the attached resume document (PDF or image).\n\n${RESUME_SCHEMA_PROMPT}`;
      files = [{ data: base64, mimeType: mimetype }];
    }
    
    rawResponse = await routeRequest("resume-parsing", { prompt, files });
    
    // formatGuard-style safe JSON parser
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }
    
    const content = JSON.parse(jsonStr);
    
    return { success: true, content, rawResponse };
  } catch (error) {
    console.error('Resume parsing failed:', error);
    return { success: false, content: null, rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  parseUploadedResume
};
