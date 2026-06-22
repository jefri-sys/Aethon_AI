const atsClassic = require('./atsClassic');
const softwareDeveloper = require('./softwareDeveloper');
const researchHigherStudies = require('./researchHigherStudies');

const TEMPLATE_IDS = ["ats_classic", "software_developer", "research_higher_studies"];

function getTemplate(templateId) {
  switch (templateId) {
    case 'software_developer':
      return softwareDeveloper.renderResumeHTML;
    case 'research_higher_studies':
      return researchHigherStudies.renderResumeHTML;
    case 'ats_classic':
    default:
      return atsClassic.renderResumeHTML;
  }
}

module.exports = {
  TEMPLATE_IDS,
  getTemplate
};
