function checkAtsStructure(resume) {
  const issues = [];
  const summary = { high: 0, medium: 0, low: 0 };

  const addIssue = (severity, section, message) => {
    issues.push({ severity, section, message });
    summary[severity]++;
  };

  const { content, sectionOrder = [], hiddenSections = [] } = resume;

  if (!content) {
    return { issues, summary };
  }

  // 1. Missing or empty personalInfo.email or personalInfo.phone
  const personalInfo = content.personalInfo || {};
  const emailMissing = !personalInfo.email || String(personalInfo.email).trim() === '';
  const phoneMissing = !personalInfo.phone || String(personalInfo.phone).trim() === '';
  
  if (emailMissing || phoneMissing) {
    addIssue('high', 'personalInfo', 'Missing contact information — recruiters and ATS systems need a way to reach you.');
  }

  // 2. Any visible (non-hidden) section in sectionOrder that has zero entries
  const visibleSections = sectionOrder.filter(sec => !hiddenSections.includes(sec));
  
  visibleSections.forEach(section => {
    if (section === 'personalInfo') return;
    
    const sectionData = content[section];
    let isEmpty = false;
    
    if (!sectionData) {
      isEmpty = true;
    } else if (Array.isArray(sectionData)) {
      if (sectionData.length === 0) {
        isEmpty = true;
      }
    } else if (typeof sectionData === 'object') {
      if (Object.keys(sectionData).length === 0) {
        isEmpty = true;
      }
    }
    
    if (isEmpty) {
      const formattedName = section.charAt(0).toUpperCase() + section.slice(1);
      addIssue('medium', section, `${formattedName} is included but has no content — consider removing it or adding entries.`);
    }
  });

  // 3. Projects section: any project entry missing a description
  const projects = content.projects || [];
  if (Array.isArray(projects)) {
    projects.forEach(project => {
      const title = project.title || 'Untitled Project';
      if (!project.description || String(project.description).trim() === '') {
        addIssue('medium', 'projects', `Project '${title}' has no description — recruiters can't assess it without one.`);
      }
    });
  }

  // 4. Education section: missing cgpa field entirely (not just zero)
  const education = content.education || [];
  if (Array.isArray(education)) {
    education.forEach(edu => {
      if (edu.cgpa === undefined || edu.cgpa === null || String(edu.cgpa).trim() === '') {
        addIssue('low', 'education', 'Consider adding your CGPA if it strengthens your application.');
      }
    });
  }

  // 5. Skills section: fewer than 3 skills listed
  const skills = content.skills || [];
  if (Array.isArray(skills)) {
    if (skills.length < 3) {
      addIssue('medium', 'skills', 'Very few skills listed — ATS keyword matching relies on a reasonably complete skills list.');
    }
  }

  // 6. Date fields: if any entry has endDate before startDate
  const sectionsWithDates = ['education', 'internships', 'experience'];
  sectionsWithDates.forEach(section => {
    const sectionData = content[section] || [];
    if (Array.isArray(sectionData)) {
      sectionData.forEach(entry => {
        if (entry.startDate && entry.endDate) {
          const start = new Date(entry.startDate);
          const end = new Date(entry.endDate);
          
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            if (end < start) {
              addIssue('high', section, 'Date range appears inverted — end date is before start date.');
            }
          }
        }
      });
    }
  });

  return { issues, summary };
}

module.exports = {
  checkAtsStructure
};
