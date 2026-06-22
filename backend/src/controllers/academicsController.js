const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const { calculateCGPA, whatIfCGPA } = require('../services/academicService');
const { calculateReadiness } = require('../services/readinessService');
const pdfParse = require('pdf-parse');
const { routeRequest } = require('../services/aiRouter');

// Subjects
const createSubject = async (req, res) => {
  try {
    const payload = { ...req.body, userId: req.user.id };
    
    if (!payload.semesterId) {
      const Semester = require('../models/Semester');
      const activeSem = await Semester.findOne({ userId: req.user.id, isActive: true });
      if (activeSem) payload.semesterId = activeSem._id;
    }

    const subject = await Subject.create(payload);
    
    // Auto-create an attendance record for this subject
    await Attendance.create({ 
      userId: req.user.id, 
      subjectId: subject._id, 
      attendedClasses: 0, 
      totalClasses: 0 
    });
    
    res.status(201).json({ success: true, subject });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const bulkCreateSubjects = async (req, res) => {
  try {
    const { courses } = req.body;
    if (!Array.isArray(courses)) {
      return res.status(400).json({ success: false, message: 'Invalid courses array' });
    }

    const subjects = [];
    const Semester = require('../models/Semester');
    const activeSem = await Semester.findOne({ userId: req.user.id, isActive: true });

    for (const course of courses) {
      const subject = await Subject.create({
        name: course.name,
        code: course.code,
        professor: course.professor,
        semester: course.semester,
        credits: course.credits,
        userId: req.user.id,
        semesterId: course.semesterId || activeSem?._id
      });
      
      // Auto-create an attendance record for this subject
      await Attendance.create({ 
        userId: req.user.id, 
        subjectId: subject._id, 
        attendedClasses: 0, 
        totalClasses: 0 
      });
      
      subjects.push(subject);
    }
    
    res.status(201).json({ success: true, subjects });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user.id });
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, subject });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    
    // Clean up dependent documents
    await Mark.deleteMany({ subjectId: req.params.id, userId: req.user.id });
    await Attendance.deleteMany({ subjectId: req.params.id, userId: req.user.id });
    
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Marks
const addMark = async (req, res) => {
  try {
    const mark = await Mark.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, mark });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getMarks = async (req, res) => {
  try {
    const query = { userId: req.user.id };
    if (req.query.subjectId) query.subjectId = req.query.subjectId;
    
    const marks = await Mark.find(query);
    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMark = async (req, res) => {
  try {
    const mark = await Mark.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!mark) return res.status(404).json({ success: false, message: 'Mark not found' });
    res.json({ success: true, message: 'Mark deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Attendance
const updateAttendance = async (req, res) => {
  try {
    const { attendedClasses, totalClasses } = req.body;
    
    let attendance = await Attendance.findOne({ subjectId: req.params.subjectId, userId: req.user.id });
    
    if (!attendance) {
      attendance = new Attendance({ 
        subjectId: req.params.subjectId, 
        userId: req.user.id, 
        attendedClasses: attendedClasses || 0, 
        totalClasses: totalClasses || 0 
      });
    } else {
      if (attendedClasses !== undefined) attendance.attendedClasses = attendedClasses;
      if (totalClasses !== undefined) attendance.totalClasses = totalClasses;
    }
    
    await attendance.save();
    
    if (attendance.percentage < 75) {
      const subject = await Subject.findById(req.params.subjectId);
      await Notification.create({
        userId: req.user.id,
        type: 'ATTENDANCE_WARNING',
        title: 'Attendance Warning',
        message: `Your attendance in ${subject?.name || 'a subject'} has fallen below 75% (${attendance.percentage.toFixed(1)}%). Please attend upcoming classes.`
      });
    }
    
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.user.id }).populate('subjectId', 'name code');
    res.json({ success: true, attendance: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CGPA
const getCGPA = async (req, res) => {
  try {
    const result = await calculateCGPA(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Readiness
const getReadiness = async (req, res) => {
  try {
    const result = await calculateReadiness(req.user.id, req.params.subjectId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const postWhatIf = async (req, res) => {
  try {
    const { hypotheticalScores } = req.body;
    
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    // Fetch current subjects and aggregate their marks
    const subjects = await Subject.find({ userId: req.user.id }).lean();
    
    for (const subject of subjects) {
      const marks = await Mark.find({ userId: req.user.id, subjectId: subject._id }).lean();
      subject.marks = marks;
    }
    
    const predictedCGPA = whatIfCGPA(subjects, hypotheticalScores, user?.course);
    res.json({ success: true, predictedCGPA });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const importGradeCard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }
    
    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    console.log("=== PDF TEXT START ===");
    console.log(text);
    console.log("=== PDF TEXT END ===");
    console.log("Text length:", text.length);

    const semMatch = text.match(/Semester[\s:]*(?:S|0)?(\d+)/i);
    const semNumber = semMatch ? parseInt(semMatch[1]) : null;

    const sgpaMatch = text.match(/SGPA[\s:]*([\d.]+)/i);
    const sgpa = sgpaMatch ? parseFloat(sgpaMatch[1]) : null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Here is the raw text extracted from a student's grade card PDF:\n\n${text}\n\nExtract all academic subjects from this grade card text. Return a JSON object with a single 'subjects' array. Each subject should have: 'code' (string), 'name' (string), 'credits' (number), 'grade' (string), and 'semester' (number) representing which semester this subject belongs to. If you cannot determine the semester for a subject, try to infer it from the course code (e.g. 101 -> 1, 402 -> 4) or the section headers. Also extract 'sgpa' (number) and include it in the root of the JSON object. Only include subjects that have a valid letter grade. Ensure credits are a number. Do not include any other text besides the JSON.`;
        
        const contentText = await routeRequest("import-grade-card", { prompt, userId: req.user.id });
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.subjects && parsed.subjects.length > 0) {
            return res.status(200).json({
              success: true,
              preview: {
                subjects: parsed.subjects.map(s => ({...s, semester: s.semester || semNumber})),
                semester: semNumber,
                sgpa: parsed.sgpa || sgpa,
                totalCredits: parsed.subjects.reduce((sum, s) => sum + Number(s.credits) || 0, 0),
                count: parsed.subjects.length
              }
            });
          }
        }
      } catch (aiErr) {
        console.error('AI parsing failed, falling back to heuristic:', aiErr);
      }
    }

    const subjects = [];
    const validGrades = ['O', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'W', 'I', 'R'];
    const lines = text.split('\n');

    const mergedRegex = /^(.*?)(O|S|A\+|A|B\+|B|C\+|C|D|P|F|FE|W|I|R)(\d(?:\.\d+)?)(?:January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:\d{4})?$/;

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.toLowerCase().includes('course') || cleanLine.toLowerCase().includes('subject')) return;

      // Strategy 1: Merged text (Saintgits format)
      const mergedMatch = cleanLine.match(mergedRegex);
      if (mergedMatch) {
        const prefix = mergedMatch[1].trim();
        const gradeStr = mergedMatch[2];
        const creditsStr = mergedMatch[3];

        // Safely split the prefix into Code (ends in digit) and Name (starts with letter)
        const splitRegex = /^([A-Z0-9]+\d{1,3})\s*([A-Za-z\s\(\)\-&,].*)$/;
        const splitMatch = prefix.match(splitRegex);

        if (splitMatch && splitMatch[2].trim().length > 2) {
          subjects.push({
            code: splitMatch[1].toUpperCase(),
            name: splitMatch[2].trim(),
            grade: gradeStr.toUpperCase(),
            credits: parseFloat(creditsStr)
          });
          return;
        }
      }

      // Strategy 2: Space-separated tokens
      const tokens = cleanLine.split(/\s+/);
      if (tokens.length < 3) return;

      let grade = null;
      let gradeIndex = -1;
      
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (validGrades.includes(tokens[i].toUpperCase())) {
          grade = tokens[i].toUpperCase();
          gradeIndex = i;
          break;
        }
      }
      
      if (!grade) return;

      let credits = 3;
      let creditsIndex = -1;
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (i !== gradeIndex && /^\d(?:\.\d+)?$/.test(tokens[i])) {
          credits = parseFloat(tokens[i]);
          creditsIndex = i;
          break;
        }
      }

      let code = null;
      let codeIndex = -1;
      for (let i = 0; i < Math.min(gradeIndex, 5); i++) {
        if (/^[A-Z]{2,6}[0-9]{2,6}$/i.test(tokens[i]) || /^[A-Z0-9\-]{4,12}$/i.test(tokens[i])) {
          if (!/^\d+$/.test(tokens[i])) {
            code = tokens[i].toUpperCase();
            codeIndex = i;
            break;
          }
        }
      }

      if (!code || codeIndex >= gradeIndex) return;

      const endIdx = Math.min(gradeIndex, creditsIndex !== -1 ? creditsIndex : tokens.length);
      if (endIdx <= codeIndex + 1) return;

      const name = tokens.slice(codeIndex + 1, endIdx).join(' ');
      
      if (name.length < 3) return;

      subjects.push({
        code: code,
        name: name,
        grade: grade,
        credits: credits
      });
    });

    if (subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not extract subjects from this PDF. The file may be a scanned image or in an unreadable format. Please use manual entry instead.",
        debug_text: text.substring(0, 500)
      });
    }

    res.status(200).json({
      success: true,
      preview: {
        subjects,
        semester: semNumber,
        sgpa,
        totalCredits: subjects.reduce((sum, s) => sum + s.credits, 0),
        count: subjects.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function gradeToMarks(grade) {
  const map = { 'S': 95, 'A+': 90, 'A': 80, 'B+': 70, 'B': 60, 'C': 50, 'F': 35 };
  return map[grade] || 50;
}

const confirmImport = async (req, res) => {
  try {
    const { subjects, semester } = req.body;
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid subjects data provided.' });
    }

    const Semester = require('../models/Semester');
    
    // Resolve or create Semester documents for each subject
    for (let s of subjects) {
      let semNum = s.semester || semester || null;
      if (semNum) {
        let semDoc = await Semester.findOne({ userId: req.user.id, semesterNumber: semNum });
        if (!semDoc) {
          // Auto-create semester if it doesn't exist to prevent orphaned subjects
          semDoc = await Semester.create({ 
            userId: req.user.id, 
            semesterNumber: semNum, 
            academicYear: '2025-2026',
            isActive: false // Prevent hijacking the dashboard when importing past grade cards
          });
        }
        s.resolvedSemesterId = semDoc._id;
        s.resolvedSemesterNum = semNum;
      }
    }

    const createdSubjects = await Subject.insertMany(
      subjects.map(s => ({
        userId: req.user.id,
        name: s.name,
        code: s.code,
        credits: s.credits,
        semester: s.resolvedSemesterNum || null,
        semesterId: s.resolvedSemesterId || null
      }))
    );

    await Mark.insertMany(
      subjects.map((s, i) => ({
        userId: req.user.id,
        subjectId: createdSubjects[i]._id,
        assessmentType: 'Final',
        marksObtained: gradeToMarks(s.grade),
        totalMarks: 100,
        grade: s.grade.toUpperCase()
      }))
    );

    res.status(201).json({
      success: true,
      created: createdSubjects.length,
      message: `${createdSubjects.length} subjects imported successfully`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const migrateSubjects = async (req, res) => {
  try {
    const { semesterId } = req.body;
    if (!semesterId) {
      return res.status(400).json({ success: false, message: 'semesterId is required' });
    }

    const result = await Subject.updateMany(
      { userId: req.user.id, semesterId: { $exists: false } },
      { $set: { semesterId } }
    );

    // Also update subjects that have semesterId as null
    const result2 = await Subject.updateMany(
      { userId: req.user.id, semesterId: null },
      { $set: { semesterId } }
    );

    res.json({ 
      success: true, 
      message: 'Subjects migrated successfully',
      modifiedCount: result.modifiedCount + result2.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const importTimetable = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }
    
    const data = await pdfParse(req.file.buffer);
    const text = data.text.trim();
    
    if (process.env.GEMINI_API_KEY) {
      let contentText = "";
      try {
        let prompt = "";
        let files = [];
        
        if (!text) {
          // If no text, it's an image/scan. Pass the PDF directly to Gemini Vision.
          prompt = `Extract the weekly class timetable from this attached scanned PDF document.
Return ONLY a valid JSON object with an array 'slots'. Do not wrap it in markdown block quotes.
Each slot must have:
- 'dayOfWeek' (string: strictly one of 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
- 'periodNumber' (number, e.g., 1, 2) - optional
- 'startTime' (string: HH:MM in 24-hour format)
- 'endTime' (string: HH:MM in 24-hour format)
- 'subjectName' (string)
- 'courseCode' (string, optional)
- 'room' (string, optional)
- 'teacherName' (string, optional)

Make sure to map the subjects logically across the week.`;
          files = [{ data: req.file.buffer.toString('base64'), mimeType: 'application/pdf' }];
        } else {
          prompt = `Here is the raw text extracted from a student's college weekly timetable PDF:
        
${text}

Extract the weekly class timetable from this text. 
Return ONLY a valid JSON object with an array 'slots'. Do not wrap it in markdown block quotes.
Each slot must have:
- 'dayOfWeek' (string: strictly one of 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
- 'periodNumber' (number, e.g., 1, 2) - optional
- 'startTime' (string: HH:MM in 24-hour format)
- 'endTime' (string: HH:MM in 24-hour format)
- 'subjectName' (string)
- 'courseCode' (string, optional)
- 'room' (string, optional)
- 'teacherName' (string, optional)

Make sure to map the subjects logically across the week.`;
        }

        contentText = await routeRequest("import-timetable", { prompt, userId: req.user.id, files });
        console.log("=== GEMINI TIMETABLE RESPONSE START ===");
        console.log(contentText);
        console.log("=== GEMINI TIMETABLE RESPONSE END ===");

        let cleanContent = contentText.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/) || cleanContent.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          try {
            let parsed = JSON.parse(jsonMatch[0]);
            
            // If Gemini returned an array directly instead of { slots: [] }
            if (Array.isArray(parsed)) {
              parsed = { slots: parsed };
            }

            if (parsed.slots && parsed.slots.length > 0) {
              return res.status(200).json({
                success: true,
                slots: parsed.slots
              });
            } else {
              console.log("Gemini returned JSON but slots array was empty.");
            }
          } catch (parseErr) {
             console.error("JSON Parse Error:", parseErr);
             return res.status(400).json({
                success: false,
                message: "Synapse AI returned invalid JSON.",
                debug: contentText
             });
          }
        } else {
          console.log("Regex could not find JSON object in Gemini response.");
          return res.status(400).json({
             success: false,
             message: "Synapse AI couldn't find a timetable format.",
             debug: contentText
          });
        }
      } catch (aiErr) {
        console.error('AI parsing failed:', aiErr);
        return res.status(500).json({ success: false, message: 'AI processing error: ' + aiErr.message });
      }
    }

    return res.status(400).json({
      success: false,
      message: "Could not extract timetable from this PDF. Ensure it has readable text and not an image. Check the server logs for details.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const importExamSchedule = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }
    
    const data = await pdfParse(req.file.buffer);
    const text = data.text.trim();

    if (process.env.GEMINI_API_KEY) {
      try {
        let prompt = "";
        let files = [];
        
        if (!text) {
          prompt = `Extract the exam schedule from this attached scanned PDF document.
Return ONLY a valid JSON object with an array 'exams'. Do not wrap it in markdown block quotes.
Each exam must have:
- 'subjectName' (string)
- 'courseCode' (string, optional)
- 'examType' (string: strictly one of 'internal1', 'internal2', 'endSemester')
- 'date' (string: YYYY-MM-DD format, guess the year if missing based on current context)
- 'startTime' (string: HH:MM in 24-hour format)
- 'venue' (string, optional)

Ensure you capture all valid exams found.`;
          files = [{ data: req.file.buffer.toString('base64'), mimeType: 'application/pdf' }];
        } else {
          prompt = `Here is the raw text extracted from a student's college exam schedule PDF:
        
${text}

Extract the exam schedule from this text. 
Return ONLY a valid JSON object with an array 'exams'. Do not wrap it in markdown block quotes.
Each exam must have:
- 'subjectName' (string)
- 'courseCode' (string, optional)
- 'examType' (string: strictly one of 'internal1', 'internal2', 'endSemester')
- 'date' (string: YYYY-MM-DD format, guess the year if missing based on current context)
- 'startTime' (string: HH:MM in 24-hour format)
- 'venue' (string, optional)

Ensure you capture all valid exams found.`;
        }

        const contentText = await routeRequest("import-exams", { prompt, userId: req.user.id, files });
        const jsonMatch = contentText.match(/\{[\s\S]*\}/) || contentText.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          let parsed = JSON.parse(jsonMatch[0]);
          
          if (Array.isArray(parsed)) {
            parsed = { exams: parsed };
          }

          if (parsed.exams && parsed.exams.length > 0) {
            return res.status(200).json({
              success: true,
              exams: parsed.exams
            });
          }
        }
      } catch (aiErr) {
        console.error('AI parsing failed:', aiErr);
      }
    }

    return res.status(400).json({
      success: false,
      message: "Could not extract exams from this PDF. Ensure it has readable text and not an image.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createSubject,
  bulkCreateSubjects,
  getSubjects,
  updateSubject,
  deleteSubject,
  addMark,
  getMarks,
  deleteMark,
  updateAttendance,
  getAttendance,
  getCGPA,
  postWhatIf,
  getReadiness,
  importGradeCard,
  confirmImport,
  migrateSubjects,
  importTimetable,
  importExamSchedule
};
