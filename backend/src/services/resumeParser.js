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

Map whatever section headings/structure the original resume uses onto this schema as sensibly as possible.
If a section doesn't exist, return an empty array/object for it.
CRITICAL RULES FOR JSON:
1. Return strictly valid JSON. 
2. DO NOT include any unescaped double quotes inside string values. Replace them with single quotes.
3. DO NOT include literal newlines or tabs inside string values.
4. Output nothing but the JSON object. No markdown fencing, no preamble.`;

async function parseUploadedResume(fileBuffer, mimetype) {
  let rawResponse = '';
  console.log(`\n--- [parseUploadedResume] START ---`);
  console.log(`[parseUploadedResume] ENTRY: mimetype=${mimetype}, bufferSize=${fileBuffer ? fileBuffer.length : 'undefined'} bytes`);
  
  try {
    const isDocx = mimetype === 'application/msword' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    let prompt;
    let files = [];

    if (isDocx) {
      console.log(`[parseUploadedResume] PATH: DOCX text-extraction path taken`);
      const extractResult = await extractText(fileBuffer, mimetype);
      if (!extractResult || !extractResult.text || extractResult.text.trim() === '') {
        console.error(`[parseUploadedResume] FAILURE: extractText returned empty or no text`);
        throw new Error('Could not extract text from this document');
      }
      prompt = `Read the following plain text extracted from a resume document.\n\nText:\n${extractResult.text}\n\n${RESUME_SCHEMA_PROMPT}`;
    } else {
      console.log(`[parseUploadedResume] PATH: Vision path taken for PDF/image`);
      const base64 = fileBuffer.toString('base64');
      prompt = `Read the attached resume document (PDF or image).\n\n${RESUME_SCHEMA_PROMPT}`;
      files = [{ data: base64, mimeType: mimetype }];
    }
    
    let content;
    let lastError = null;

    // Retry loop for JSON parsing
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[parseUploadedResume] Calling routeRequest("resume-parsing") - Attempt ${attempt}...`);
        
        let currentPrompt = prompt;
        if (attempt > 1) {
           currentPrompt += `\n\nWARNING: Your previous response contained invalid JSON syntax (likely unescaped quotes or newlines). Please fix these issues and output STRICTLY valid JSON without formatting. Replace any inner double quotes with single quotes.`;
        }

        rawResponse = await routeRequest("resume-parsing", { prompt: currentPrompt, files, responseMimeType: "application/json" });
        
        if (!rawResponse || rawResponse.trim() === '') {
          throw new Error('Empty response from AI');
        }

        let jsonStr = rawResponse;
        
        // Remove markdown formatting if present
        if (jsonStr.startsWith('```')) {
          const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) {
            jsonStr = match[1];
          }
        }

        let jsonStart = jsonStr.indexOf('{');
        let jsonEnd = jsonStr.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
          
          // Replace actual line breaks and tabs with spaces to prevent parsing errors inside strings
          jsonStr = jsonStr.replace(/[\n\r\t]+/g, ' ');
          
          // Unescape any single quotes the LLM might have incorrectly escaped
          jsonStr = jsonStr.replace(/\\'/g, "'");
          
          // Clean up trailing commas right before closing brackets/braces
          jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        } else {
          throw new Error('No JSON boundaries found in response');
        }
        
        content = JSON.parse(jsonStr);
        console.log(`[parseUploadedResume] SUCCESS: Parsed JSON content on attempt ${attempt}`);
        break; // Break the loop if successful
      } catch (parseError) {
        lastError = parseError;
        console.error(`[parseUploadedResume] FAILURE on attempt ${attempt}: JSON.parse threw error:`, parseError.message);
        if (attempt === 3) {
          return { success: false, content: null, rawResponse: 'Failed to parse JSON: ' + parseError.message };
        }
      }
    }
    
    console.log(`--- [parseUploadedResume] END ---\n`);
    return { success: true, content, rawResponse };
  } catch (error) {
    console.error(`[parseUploadedResume] FAILURE in CATCH block:`, error);
    return { success: false, content: null, rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  parseUploadedResume
};
