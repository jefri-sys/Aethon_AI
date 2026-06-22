async function addAINotes(plan, callAI) {
  // Flatten all tasks to a numbered list for the AI
  const allTasks = [];
  for (const day of plan) {
    for (const task of day.tasks) {
      if (task.module !== 'Revision') { // skip revision tasks — they already have notes
        allTasks.push({
          index: allTasks.length,
          module: task.module,
          title: task.topicTitle
        });
      }
    }
  }

  if (allTasks.length === 0) return plan;

  const taskListText = allTasks
    .map(t => `${t.index}. [${t.module}] ${t.title}`)
    .join('\n');

  const prompt = `You are helping a college student prepare for exams. For each topic below, write one short, specific study note (maximum 12 words). The note should tell the student exactly what to focus on — not generic advice.

Topics:
${taskListText}

Return ONLY a valid JSON array of strings, one per topic, in the exact same order. No explanation, no markdown, no code fences. Example format:
["Focus on skewness formula and positive vs negative curves", "Compare observation vs interview data quality", ...]

Rules:
- Maximum 12 words per note
- Be specific to the topic — mention key formulas, comparisons, or concepts
- Do not write generic notes like "review this topic" or "understand the basics"
- If a topic is a session split (e.g. Session 2/2), note what the second half should cover`;

  try {
    const aiResponse = await callAI(prompt);
    
    // Strip any accidental code fences before parsing
    const cleaned = aiResponse.replace(/```json|```/g, '').trim();
    const notes = JSON.parse(cleaned);

    if (!Array.isArray(notes) || notes.length !== allTasks.length) {
      // AI returned wrong shape — return plan without notes rather than crashing
      console.warn('AI notes response shape mismatch — skipping notes');
      return plan;
    }

    // Map notes back onto plan tasks by index
    let noteIndex = 0;
    return plan.map(day => ({
      ...day,
      tasks: day.tasks.map(task => {
        if (task.module === 'Revision') return task; // revision notes already set
        const note = notes[noteIndex] || '';
        noteIndex++;
        return { ...task, notes: note };
      })
    }));

  } catch (err) {
    console.warn('AI notes generation failed — returning plan without notes:', err.message);
    return plan; // plan is still perfectly valid without notes
  }
}

module.exports = { addAINotes };
