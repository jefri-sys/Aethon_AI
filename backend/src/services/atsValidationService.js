const { checkAtsStructure } = require('./atsStructureChecker');

function validateAtsCompatibility(resume) {
  const issues = [];
  const content = resume.content || {};

  // Note: Structural layout risks (multi-column, tables, text boxes, images/icons)
  // are already inherently prevented by our predefined template system (ATS Classic, etc).
  // This deterministic check focuses purely on raw content parsing risks.

  // 1. Missing Contact Info Fields (reuse basic check logic implicitly)
  const personalInfo = content.personalInfo || {};
  if (!personalInfo.email || !personalInfo.phone) {
    issues.push({ severity: 'high', message: 'Missing essential contact info (Email or Phone) required for ATS matching.' });
  }

  // 2. Inconsistent Date Formats
  const dateFormats = new Set();
  const dateFields = [];

  const collectDates = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (item.startDate) dateFields.push(item.startDate);
        if (item.endDate && item.endDate.toLowerCase() !== 'present') dateFields.push(item.endDate);
        if (item.date) dateFields.push(item.date);
      });
    }
  };

  collectDates(content.experience);
  collectDates(content.projects);
  collectDates(content.internships);
  collectDates(content.education);
  collectDates(content.certifications);

  dateFields.forEach(d => {
    const trimmed = d.trim();
    if (!trimmed) return;
    
    if (/^\d{4}$/.test(trimmed)) dateFormats.add('YYYY');
    else if (/^\d{1,2}\/\d{4}$/.test(trimmed)) dateFormats.add('MM/YYYY');
    else if (/^[A-Za-z]{3}\s\d{4}$/.test(trimmed)) dateFormats.add('MMM YYYY');
    else if (/^[A-Za-z]+\s\d{4}$/.test(trimmed)) dateFormats.add('Month YYYY');
    else dateFormats.add('unknown');
  });

  // Remove unknown formats from strict consistency check to avoid false positives on complex dates
  dateFormats.delete('unknown');

  if (dateFormats.size > 1) {
    issues.push({ severity: 'medium', message: 'Inconsistent date formats detected across sections (e.g., mixing "2023" with "Jan 2023" or "01/2023").' });
  }

  // 3. Special Characters / Emojis / Text Bullets
  let hasSpecialChars = false;
  // This regex looks for common emojis and literal text bullets
  const specialCharRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|•|▪)/g;

  const searchSpecialChars = (obj) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      if (specialCharRegex.test(obj)) hasSpecialChars = true;
    } else if (Array.isArray(obj)) {
      obj.forEach(searchSpecialChars);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(searchSpecialChars);
    }
  };

  searchSpecialChars(content);

  if (hasSpecialChars) {
    issues.push({ severity: 'high', message: 'Detected special characters, emojis, or raw text bullets which can break legacy ATS parsing systems.' });
  }

  return { passes: issues.length === 0, issues };
}

module.exports = {
  validateAtsCompatibility
};
