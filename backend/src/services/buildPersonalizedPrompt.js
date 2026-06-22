function buildPersonalizedSystemPrompt({ basePrompt, scope, aiPreferences, formatGuard }) {
  if (!aiPreferences) {
    return basePrompt;
  }

  const globalStyle = aiPreferences.global?.normalized;
  const scopeStyle = scope && aiPreferences[scope]?.normalized;

  if (!globalStyle && !scopeStyle) {
    return basePrompt;
  }

  const scopeLabel = scope ? scope.charAt(0).toUpperCase() + scope.slice(1) : '';
  
  let injection = `\n\n<student_preferences>\nThe student has set personalization preferences for how you should respond.\nFollow these stylistic preferences as long as they don't conflict with your instructions above or any required output format.\n`;

  if (globalStyle) {
    injection += `\nGeneral style: ${globalStyle}`;
  }
  
  if (scopeStyle) {
    injection += `\n${scopeLabel}-specific style: ${scopeStyle}`;
  }

  injection += `\n</student_preferences>`;

  if (formatGuard) {
    injection += `\n\n<output_format_requirement>\nRegardless of the student's stylistic preferences above, your response MUST still conform exactly to the JSON schema specified earlier in these instructions, with no introductory text, explanation, or markdown code fences — output the raw JSON only. Do not alter field names, structure, or types to match style preferences.\n</output_format_requirement>`;
  }

  return basePrompt + injection;
}

module.exports = { buildPersonalizedSystemPrompt };
