function scheduleTopics(topics, constraints) {
  const { startDate, endDate, dailyHours, sessionStyle } = constraints;

  // --- Setup ---
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Build array of all available dates (inclusive, no days excluded)
  const allDates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    allDates.push(cursor.toISOString().split('T')[0]); // "YYYY-MM-DD"
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalDays = allDates.length;
  const dailyMinutes = Math.round(dailyHours * 60);

  // Reserve revision days at the end — minimum 1, maximum 5
  const revisionDayCount = Math.min(5, Math.max(1, Math.floor(totalDays * 0.10)));
  const studyDates = allDates.slice(0, totalDays - revisionDayCount);
  const revisionDates = allDates.slice(totalDays - revisionDayCount);

  // --- Sort topics ---
  // Primary: preserve module order (topics array already ordered by module)
  // Secondary within each module: hard topics first, then medium, then easy
  const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
  
  // Group by module preserving insertion order
  const moduleMap = {};
  const moduleOrder = [];
  for (const topic of topics) {
    if (!moduleMap[topic.module]) {
      moduleMap[topic.module] = [];
      moduleOrder.push(topic.module);
    }
    moduleMap[topic.module].push(topic);
  }
  
  // Sort within each module by difficulty
  for (const mod of moduleOrder) {
    moduleMap[mod].sort((a, b) => 
      (difficultyOrder[a.difficulty] ?? 1) - (difficultyOrder[b.difficulty] ?? 1)
    );
  }

  // Flatten back to ordered array
  const sortedTopics = moduleOrder.flatMap(mod => moduleMap[mod]);

  // --- Pre-calculate session splits ---
  // For each topic, determine how many sessions it needs and their durations
  // A session is at most dailyMinutes long (for focused style)
  // For mixed style, a session can be smaller (topic fits in remaining day budget)
  
  const topicSessions = []; // flat list of {module, topicTitle, durationMinutes, sessionNumber, totalSessions}

  for (const topic of sortedTopics) {
    const totalMinutes = Math.round(topic.estimatedHours * 60);
    
    if (sessionStyle === 'focused') {
      // One topic per day — split by dailyMinutes
      const numSessions = Math.ceil(totalMinutes / dailyMinutes);
      let remaining = totalMinutes;
      for (let i = 1; i <= numSessions; i++) {
        const duration = Math.min(remaining, dailyMinutes);
        topicSessions.push({
          module: topic.module,
          topicTitle: topic.title,
          durationMinutes: duration,
          sessionNumber: i,
          totalSessions: numSessions,
          notes: '' // filled by AI later
        });
        remaining -= duration;
      }
    } else {
      // Mixed style — keep topic as one logical block; scheduler will split it
      // across days based on remaining budget
      topicSessions.push({
        module: topic.module,
        topicTitle: topic.title,
        durationMinutes: totalMinutes, // full duration; splitter handles overflow
        sessionNumber: 1,
        totalSessions: 1,             // updated below if split occurs
        notes: ''
      });
    }
  }

  // --- Assign sessions to dates (mixed style needs the splitter) ---
  const plan = []; // array of { date, tasks[] }

  if (sessionStyle === 'focused') {
    // Each session already sized to dailyMinutes — one session per day
    let dateIndex = 0;
    for (const session of topicSessions) {
      if (dateIndex >= studyDates.length) break;
      plan.push({
        date: studyDates[dateIndex],
        tasks: [session]
      });
      dateIndex++;
    }
  } else {
    // Mixed: fill each day up to dailyMinutes, splitting topics across days as needed
    const expandedSessions = []; // final flat list after splitting
    
    // First pass: split any topic that exceeds dailyMinutes
    for (const session of topicSessions) {
      if (session.durationMinutes <= dailyMinutes) {
        expandedSessions.push({ ...session, sessionNumber: 1, totalSessions: 1 });
      } else {
        const numSessions = Math.ceil(session.durationMinutes / dailyMinutes);
        let remaining = session.durationMinutes;
        for (let i = 1; i <= numSessions; i++) {
          const duration = Math.min(remaining, dailyMinutes);
          expandedSessions.push({
            ...session,
            durationMinutes: duration,
            sessionNumber: i,
            totalSessions: numSessions
          });
          remaining -= duration;
        }
      }
    }

    // Second pass: pack sessions into days
    let dateIndex = 0;
    let dayBudgetRemaining = dailyMinutes;
    let currentDayTasks = [];

    for (const session of expandedSessions) {
      if (dateIndex >= studyDates.length) break;

      if (session.durationMinutes <= dayBudgetRemaining) {
        // Fits in current day
        currentDayTasks.push(session);
        dayBudgetRemaining -= session.durationMinutes;

        // If day is exactly full, close it
        if (dayBudgetRemaining === 0) {
          plan.push({ date: studyDates[dateIndex], tasks: currentDayTasks });
          dateIndex++;
          dayBudgetRemaining = dailyMinutes;
          currentDayTasks = [];
        }
      } else {
        // Doesn't fit — close current day first (if it has tasks)
        if (currentDayTasks.length > 0) {
          plan.push({ date: studyDates[dateIndex], tasks: currentDayTasks });
          dateIndex++;
          dayBudgetRemaining = dailyMinutes;
          currentDayTasks = [];
        }

        if (dateIndex >= studyDates.length) break;

        // Now try to fit in the new day
        if (session.durationMinutes <= dailyMinutes) {
          currentDayTasks.push(session);
          dayBudgetRemaining -= session.durationMinutes;
        } else {
          // Session itself exceeds dailyMinutes (shouldn't happen after pre-splitting, but safe fallback)
          plan.push({ date: studyDates[dateIndex], tasks: [{ ...session, durationMinutes: dailyMinutes }] });
          dateIndex++;
          dayBudgetRemaining = dailyMinutes;
          currentDayTasks = [];
        }
      }
    }

    // Close any remaining open day
    if (currentDayTasks.length > 0 && dateIndex < studyDates.length) {
      plan.push({ date: studyDates[dateIndex], tasks: currentDayTasks });
    }
  }

  // --- Build revision days ---
  // Distribute modules across revision days — different modules each day
  const revisionDayTasks = revisionDates.map(() => []); // one task array per revision day

  moduleOrder.forEach((mod, modIndex) => {
    const targetRevDay = modIndex % revisionDayCount; // round-robin across revision days
    const keyTopics = moduleMap[mod]
      .slice(0, 3) // top 3 topics per module (already sorted hard-first)
      .map(t => t.title)
      .join(', ');
    
    const revMinutes = Math.floor(dailyMinutes / Math.ceil(moduleOrder.length / revisionDayCount));
    
    revisionDayTasks[targetRevDay].push({
      module: 'Revision',
      topicTitle: `Revise ${mod}`,
      durationMinutes: Math.max(30, revMinutes), // minimum 30m per revision block
      sessionNumber: 1,
      totalSessions: 1,
      notes: `Key topics: ${keyTopics}`
    });
  });

  // Add revision days to plan
  revisionDates.forEach((date, i) => {
    if (revisionDayTasks[i].length > 0) {
      plan.push({ date, tasks: revisionDayTasks[i] });
    }
  });

  return plan;
}

/**
 * scheduleSubjectTopics
 * Extended scheduler for the main Study Planner.
 * Handles multiple subjects with exam deadlines, daysOff, and weak subject priority.
 *
 * @param {Array} subjects
 * [{
 *   subjectId: ObjectId,
 *   subjectName: String,
 *   examDate: Date|null,
 *   creditHours: Number,
 *   isWeak: Boolean,
 *   topics: [{ module, title, estimatedHours, difficulty }]
 * }]
 *
 * @param {Object} constraints
 * { startDate: String, dailyHours: Number, daysOff: [String], sessionStyle: String }
 *
 * @returns {Array} [{ date: String, tasks: [...] }]
 */
function scheduleSubjectTopics(subjects, constraints) {
  const { startDate, dailyHours, daysOff = [], sessionStyle = 'mixed' } = constraints;
  const dailyMinutes = Math.round(dailyHours * 60);
  const daysOffSet = new Set(daysOff);

  // --- Sort subjects by priority ---
  // 1. Weak subjects first
  // 2. Earlier exam dates first
  // 3. Higher credit hours first
  const sortedSubjects = [...subjects].sort((a, b) => {
    if (a.isWeak !== b.isWeak) return a.isWeak ? -1 : 1;
    const examA = a.examDate ? new Date(a.examDate) : new Date('9999-12-31');
    const examB = b.examDate ? new Date(b.examDate) : new Date('9999-12-31');
    if (examA.getTime() !== examB.getTime()) return examA - examB;
    return (b.creditHours || 0) - (a.creditHours || 0);
  });

  // --- Find overall end boundary (latest exam date or 60 days out) ---
  const start = new Date(startDate);
  const latestExam = sortedSubjects.reduce((latest, s) => {
    if (!s.examDate) return latest;
    const d = new Date(s.examDate);
    return d > latest ? d : latest;
  }, new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000));

  // --- Build all available dates (excluding daysOff) ---
  const allAvailableDates = [];
  const cursor = new Date(start);
  while (cursor <= latestExam) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (!daysOffSet.has(dateStr)) allAvailableDates.push(dateStr);
    cursor.setDate(cursor.getDate() + 1);
  }

  // --- Build flat session list ---
  const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
  const allSessions = [];

  for (const subject of sortedSubjects) {
    // Deadline: day before exam, or last available date if no exam
    const deadline = subject.examDate
      ? new Date(new Date(subject.examDate).getTime() - 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
      : allAvailableDates[allAvailableDates.length - 1];

    // Sort topics within subject: hard first
    const sortedTopics = [...subject.topics].sort(
      (a, b) => (difficultyOrder[a.difficulty] ?? 1) - (difficultyOrder[b.difficulty] ?? 1)
    );

    for (const topic of sortedTopics) {
      // Weak subject bonus: 20% more time
      const baseMinutes = Math.round((topic.estimatedHours || 1) * 60);
      const totalMinutes = subject.isWeak ? Math.round(baseMinutes * 1.2) : baseMinutes;
      const numSessions = Math.ceil(totalMinutes / dailyMinutes);
      let remaining = totalMinutes;

      for (let i = 1; i <= numSessions; i++) {
        const duration = Math.min(remaining, dailyMinutes);
        if (duration > 0) {
          allSessions.push({
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            module: topic.module || subject.subjectName,
            topicTitle: topic.title,
            durationMinutes: duration,
            sessionNumber: i,
            totalSessions: numSessions,
            deadline,
            isWeak: subject.isWeak,
            notes: ''
          });
        }
        remaining -= duration;
      }
    }
  }

  // --- Assign sessions to dates ---
  const plan = {}; // dateStr -> tasks[]
  let dateIndex = 0;
  let dayBudget = dailyMinutes;

  for (const session of allSessions) {
    // Advance past dates that exceed this session's deadline
    while (
      dateIndex < allAvailableDates.length &&
      allAvailableDates[dateIndex] > session.deadline
    ) {
      dateIndex++;
      dayBudget = dailyMinutes;
    }
    if (dateIndex >= allAvailableDates.length) {
      console.warn(`scheduleSubjectTopics: no available date for topic "${session.topicTitle}" before deadline ${session.deadline}`);
      break;
    }

    let date = allAvailableDates[dateIndex];

    if (session.durationMinutes <= dayBudget) {
      if (!plan[date]) plan[date] = [];
      plan[date].push(session);
      dayBudget -= session.durationMinutes;
      if (dayBudget === 0) { dateIndex++; dayBudget = dailyMinutes; }
    } else {
      // Close current day, move to next
      dateIndex++;
      dayBudget = dailyMinutes;
      if (dateIndex >= allAvailableDates.length) break;
      date = allAvailableDates[dateIndex];
      if (!plan[date]) plan[date] = [];
      plan[date].push(session);
      dayBudget -= session.durationMinutes;
    }
  }

  // --- Add per-subject revision day (1-2 days before exam) ---
  for (const subject of sortedSubjects) {
    if (!subject.examDate) continue;
    const examDay = new Date(subject.examDate).toISOString().split('T')[0];
    const revisionCandidates = allAvailableDates.filter(d => d < examDay).slice(-2);
    const revDate = revisionCandidates[0];
    if (!revDate) continue;
    if (!plan[revDate]) plan[revDate] = [];
    const keyTopics = subject.topics.slice(0, 3).map(t => t.title).join(', ');
    plan[revDate].push({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      module: 'Revision',
      topicTitle: `Revise ${subject.subjectName}`,
      durationMinutes: Math.min(dailyMinutes, 90),
      sessionNumber: 1,
      totalSessions: 1,
      notes: `Key topics: ${keyTopics}`,
      isRevision: true
    });
  }

  // --- Return sorted plan array ---
  return Object.keys(plan)
    .sort()
    .map(date => ({ date, tasks: plan[date] }));
}

module.exports = { scheduleTopics, scheduleSubjectTopics };
