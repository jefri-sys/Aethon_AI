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
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      line-height: 1.5;
      margin: 0;
      padding: 40px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 5px;
      text-align: center;
      text-transform: uppercase;
    }
    .contact-info {
      text-align: center;
      margin-bottom: 20px;
      font-size: 14px;
    }
    h2 {
      font-size: 16px;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 2px;
    }
    .item {
      margin-bottom: 15px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }
    .item-subheader {
      display: flex;
      justify-content: space-between;
      font-style: italic;
      margin-bottom: 5px;
    }
    ul {
      margin: 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 3px;
    }
    p {
      margin: 0 0 5px 0;
      white-space: pre-wrap;
    }
    .research-title {
      font-weight: bold;
      font-size: 15px;
    }
    .research-publication {
      font-style: italic;
      margin-bottom: 4px;
      display: block;
    }
    .research-desc {
      margin-top: 5px;
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
  const hidden = hiddenSections || [];

  // Research & Higher Studies Logic: Education and Research near the top
  const displayOrder = [];
  if (order.includes('education')) displayOrder.push('education');
  if (order.includes('research')) displayOrder.push('research');
  
  order.forEach(s => {
    if (s !== 'education' && s !== 'research' && s !== 'personalInfo') {
      displayOrder.push(s);
    }
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
      html += `<p>${sectionData.join(', ')}</p>`;
    } else if (sectionKey === 'projects') {
      sectionData.forEach(item => {
        html += `<div class="item">
          <div class="item-header">
            <span>${item.title || ''} ${item.link ? `(${item.link})` : ''}</span>
            <span>${item.dateRange || ''}</span>
          </div>
          ${item.technologies && item.technologies.length > 0 ? 
            `<p><em>Technologies: ${item.technologies.join(', ')}</em></p>` : ''}
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
            <span class="research-title">${item.title || ''}</span>
            <span>${item.date || ''}</span>
          </div>
          ${item.publication ? `<span class="research-publication">Published in: ${item.publication}</span>` : ''}
          ${item.description ? `<p class="research-desc">${item.description}</p>` : ''}
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
