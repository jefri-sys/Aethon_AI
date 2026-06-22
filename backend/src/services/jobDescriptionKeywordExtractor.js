const { routeRequest } = require('./aiRouter');

async function extractKeywords(jobDescriptionText) {
  let rawResponse = '';
  try {
    const prompt = `Extract every concrete skill, technology, tool, programming language, framework, certification, or qualification EXPLICITLY mentioned in this job description text. 
Return ONLY a JSON object in this exact shape: { "keywords": ["string"] }.
Each string must be a term that literally appears in or is a direct, unambiguous synonym of text in the provided document. Do NOT include generic role descriptions, soft skills phrased vaguely, or industry buzzwords not explicitly named in the text. If the document mentions 'Python' that is valid. If the document does not mention cloud computing at all, do not include any cloud-related term.

Job Description:
${jobDescriptionText || ''}`;

    rawResponse = await routeRequest("keyword-extraction", { prompt, files: [] });

    // formatGuard-style safe JSON parser
    let jsonStr = rawResponse;
    let jsonStart = jsonStr.indexOf('{');
    let jsonEnd = jsonStr.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);
    const keywords = parsed.keywords && Array.isArray(parsed.keywords) ? parsed.keywords : [];

    return { success: true, keywords, rawResponse };
  } catch (error) {
    console.error('Keyword extraction failed:', error);
    return { success: false, keywords: [], rawResponse: rawResponse || error.message };
  }
}

module.exports = {
  extractKeywords
};
