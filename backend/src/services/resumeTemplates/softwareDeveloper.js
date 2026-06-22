const SECTION_TITLES = {
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  internships: 'Internships',
  certifications: 'Certifications',
  research: 'Research Publications',
  achievements: 'Achievements'
};

function renderResumeHTML(resume) {
  const { content, sectionOrder, hiddenSections } = resume;
  if (!content) return '<html><body></body></html>';

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${resume.title || 'Resume'}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.5;
      margin: 0;
      padding: 40px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 5px;
      text-transform: uppercase;
      color: #1a4f76;
    }
    .contact-info {
      margin-bottom: 25px;
      font-size: 14px;
      color: #555;
    }
    h2 {
      font-size: 18px;
      text-transform: uppercase;
      color: #1a4f76;
      border-bottom: 2px solid #1a4f76;
      margin-top: 25px;
      margin-bottom: 15px;
      padding-bottom: 4px;
    }
    .item {
      margin-bottom: 15px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      font-size: 15px;
    }
    .item-subheader {
      display: flex;
      justify-content: space-between;
      font-style: italic;
      margin-bottom: 8px;
      color: #444;
    }
    ul {
      margin: 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 5px;
    }
    p {
      margin: 0 0 8px 0;
      white-space: pre-wrap;
    }
    .tech-stack {
      font-family: monospace;
      font-size: 13px;
      color: #333;
      margin-top: 4px;
      margin-bottom: 8px;
      display: block;
    }
  </style>
</head>
<body>
`;

  // Personal Info
  if (content.personalInfo) {
    const { name, email, phone, linkedin, github, portfolio } = content.personalInfo;
    html += `<h1>${name || ''}</h1>`;
    
    const contactLinks = [];
    if (email) contactLinks.push(`<span>${email}</span>`);
    if (phone) contactLinks.push(`<span>${phone}</span>`);
    if (linkedin) contactLinks.push(`<span>${linkedin}</span>`);
    if (github) contactLinks.push(`<span>${github}</span>`);
    if (portfolio) contactLinks.push(`<span>${portfolio}</span>`);
    
    html += `<div class="contact-info">${contactLinks.join(' | ')}</div>`;
  }

  // Sections
  const order = sectionOrder ? [...sectionOrder] : [
    'education', 'skills', 'projects', 'internships', 
    'experience', 'certifications', 'research', 'achievements'
  ];
  
  // Software Developer logic: Skills near the top
  const hidden = hiddenSections || [];
  
  // Reorder for display: pull 'skills' to the top of the ordered list
  const displayOrder = [];
  if (order.includes('skills')) displayOrder.push('skills');
  order.forEach(s => {
    if (s !== 'skills' && s !== 'personalInfo') displayOrder.push(s);
  });

  displayOrder.forEach(sectionKey => {
    if (hidden.includes(sectionKey)) return;
    
    let sectionData = content[sectionKey];
    if (!sectionData) return;
    if (!Array.isArray(sectionData)) {
      sectionData = typeof sectionData === 'string' ? (sectionKey === 'skills' ? sectionData.split(',').map(s=>s.trim()) : []) : [sectionData];
    }
    if (sectionData.length === 0) return;

    html += `<h2>${SECTION_TITLES[sectionKey] || sectionKey}</h2>`;

    if (sectionKey === 'education') {
      sectionData.forEach(item => {
        html += `<div class="item">
          <div class="item-header">
            <span>${item.institution || ''}</span>
            <span>${item.startDate || ''} ${item.endDate ? '- ' + item.endDate : ''}</span>
          </div>
          <div class="item-subheader">
            <span>${item.degree || ''} ${item.field ? 'in ' + item.field : ''}</span>
            <span>${item.cgpa ? 'CGPA: ' + item.cgpa : ''}</span>
          </div>
          ${item.relevantCoursework && item.relevantCoursework.length > 0 ? 
            `<p>Relevant Coursework: ${item.relevantCoursework.join(', ')}</p>` : ''}
        </div>`;
      });
    } else if (sectionKey === 'skills') {
      html += `<p><strong>Core Competencies:</strong> ${sectionData.join(', ')}</p>`;
    } else if (sectionKey === 'projects') {
      sectionData.forEach(item => {
        html += `<div class="item">
          <div class="item-header">
            <span>${item.title || ''} ${item.link ? `(${item.link})` : ''}</span>
            <span>${item.dateRange || ''}</span>
          </div>
          ${item.technologies && item.technologies.length > 0 ? 
            `<span class="tech-stack">Tech Stack: ${item.technologies.join(', ')}</span>` : ''}
          ${item.description ? `<p>${item.description}</p>` : ''}
        </div>`;
      });
    } else if (sectionKey === 'internships' || sectionKey === 'experience') {
      sectionData.forEach(item => {
        html += `<div class="item">
          <div class="item-header">
            <span>${item.role || ''}</span>
            <span>${item.startDate || ''} ${item.endDate ? '- ' + item.endDate : ''}</span>
          </div>
          <div class="item-subheader">
            <span>${item.company || ''}</span>
          </div>
          ${item.description ? `<p>${item.description}</p>` : ''}
        </div>`;
      });
    } else if (sectionKey === 'certifications') {
      html += `<ul>`;
      sectionData.forEach(item => {
        html += `<li><strong>${item.title || ''}</strong> - ${item.issuer || ''} (${item.date || ''})</li>`;
      });
      html += `</ul>`;
    } else if (sectionKey === 'research') {
      sectionData.forEach(item => {
        html += `<div class="item">
          <div class="item-header">
            <span>${item.title || ''}</span>
            <span>${item.date || ''}</span>
          </div>
          <div class="item-subheader">
            <span>${item.publication || ''}</span>
          </div>
          ${item.description ? `<p>${item.description}</p>` : ''}
        </div>`;
      });
    } else if (sectionKey === 'achievements') {
      html += `<ul>`;
      sectionData.forEach(item => {
        html += `<li><strong>${item.title || ''}</strong> (${item.date || ''})${item.description ? ` - ${item.description}` : ''}</li>`;
      });
      html += `</ul>`;
    }
  });

  html += `
</body>
</html>
`;
  return html;
}

module.exports = { renderResumeHTML };
