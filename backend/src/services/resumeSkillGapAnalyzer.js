const { askGroq } = require('./groqService');

/**
 * AI-driven skill-gap analysis using Groq.
 * @param {Object} resume - The resume mongoose document or object.
 * @param {String} [jobDescription] - Optional job description to compare against.
 * @returns {Object} { success: boolean, analysis: Object|null, rawResponse: string }
 */
async function analyzeSkillGap(resume, jobDescription = null) {
  try {
    const { content = {}, targetRole = 'general' } = resume;
    const skills = content.skills || [];
    const projects = content.projects || [];
    const certifications = content.certifications || [];

    const contextStr = JSON.stringify({
      skills,
      projects: projects.map(p => ({ title: p.title, technologies: p.technologies, description: p.description })),
      certifications: certifications.map(c => ({ title: c.title }))
    });

    let prompt = `You are an expert ATS (Applicant Tracking System) and technical recruiter.
Here is the user's resume data (skills, projects, certifications):
${contextStr}

`;

    if (jobDescription && jobDescription.trim().length > 0) {
      prompt += `Your task is to compare this resume against the following job description:
"${jobDescription}"
Identify missing or underrepresented skills/keywords relevant to this specific job description.`;
    } else {
      prompt += `Your task is to evaluate this resume against general expectations for the target role: "${targetRole}".
Identify missing or underrepresented skills/keywords relevant to this role since there's no specific job posting provided.`;
    }

    prompt += `

Return ONLY a valid JSON object matching this exact schema, with no markdown, no preamble, and no explanation:
{
  "missingSkills": ["skill1", "skill2"],
  "weakSections": [
    { "section": "projects", "reason": "Lacks modern framework mentions" }
  ],
  "keywordSuggestions": ["ATS-friendly term 1", "ATS-friendly term 2"]
}`;

    // Using askGroq (the Case A / Finance insight pattern)
    const result = await askGroq(prompt, "You are an expert ATS and technical recruiter.");

    if (!result.success) {
      return { success: false, analysis: null, rawResponse: result.message || '' };
    }

    const rawResponse = result.data || '';
    let analysis = null;

    // Parse using the formatGuard-style safe parser
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(rawResponse);
      }
    } catch (parseError) {
      console.warn("Skill gap analyzer failed to parse Groq response:", parseError);
      return { success: false, analysis: null, rawResponse };
    }

    return {
      success: true,
      analysis,
      rawResponse
    };
  } catch (error) {
    console.error("Error in analyzeSkillGap:", error);
    // Do not throw, so the calling controller can still return rule-based results
    return { success: false, analysis: null, rawResponse: error.message };
  }
}

module.exports = {
  analyzeSkillGap
};
