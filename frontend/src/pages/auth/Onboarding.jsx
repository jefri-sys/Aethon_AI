import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Trash2, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';

const budgetCategories = [
  'Food',
  'Transport',
  'Books',
  'Entertainment',
  'Hostel',
  'Miscellaneous',
];

const habitSuggestions = [
  'Sleep 7 hours',
  'Study 4 hours',
  'Drink 8 glasses of water',
];

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [monthlyBudget, setMonthlyBudget] = useState(
    user?.monthlyBudget || 5000
  );
  const [categorySplit, setCategorySplit] = useState(() =>
    budgetCategories.reduce(
      (categories, category) => ({
        ...categories,
        [category]: '',
      }),
      {}
    )
  );
  const [subjects, setSubjects] = useState([
    {
      code: '',
      name: '',
      professor: '',
    },
  ]);
  const [selectedHabits, setSelectedHabits] = useState(habitSuggestions);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedSlots, setExtractedSlots] = useState([]);

  const budgetSplitTotal = useMemo(
    () =>
      Object.values(categorySplit).reduce(
        (total, value) => total + Number(value || 0),
        0
      ),
    [categorySplit]
  );

  const validSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          subject.code.trim() && subject.name.trim() && subject.professor.trim()
      ),
    [subjects]
  );

  const canProceed = step !== 2 || validSubjects.length >= 1;

  const handleCategoryChange = (category, value) => {
    setCategorySplit((current) => ({
      ...current,
      [category]: value,
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    setSubjects((current) =>
      current.map((subject, subjectIndex) =>
        subjectIndex === index
          ? {
              ...subject,
              [field]: value,
            }
          : subject
      )
    );
  };

  const addSubject = () => {
    setSubjects((current) => [
      ...current,
      {
        code: '',
        name: '',
        professor: '',
      },
    ]);
  };

  const removeSubject = (index) => {
    setSubjects((current) =>
      current.length === 1
        ? current
        : current.filter((_, subjectIndex) => subjectIndex !== index)
    );
  };

  const toggleHabit = (habit) => {
    setSelectedHabits((current) =>
      current.includes(habit)
        ? current.filter((selectedHabit) => selectedHabit !== habit)
        : [...current, habit]
    );
  };

  const nextStep = () => {
    setError('');

    if (!canProceed) {
      setError('Add at least one subject to continue.');
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  const handleTimetableImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      setError('');
      const res = await api.post('/timetable/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const uniqueSubjectsMap = {};
        res.data.slots.forEach(slot => {
          if (slot.subjectName) {
            uniqueSubjectsMap[slot.subjectName] = {
              name: slot.subjectName,
              code: slot.courseCode || '',
              professor: slot.teacherName || ''
            };
          }
        });

        const extractedSubjects = Object.values(uniqueSubjectsMap);
        if (extractedSubjects.length > 0) {
          if (subjects.length === 1 && !subjects[0].name && !subjects[0].code) {
             setSubjects(extractedSubjects);
          } else {
             setSubjects([...subjects, ...extractedSubjects]);
          }
          setExtractedSlots(res.data.slots);
        } else {
          setError('No subjects could be extracted from the timetable.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process Timetable PDF.');
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  const completeOnboarding = async () => {
    setError('');

    if (validSubjects.length < 1) {
      setStep(2);
      setError('Add at least one subject to continue.');
      return;
    }

    try {
      setSaving(true);
      
      const createdSubjectsMap = {};
      for (const subject of validSubjects) {
        const res = await api.post('/subjects', subject);
        createdSubjectsMap[subject.name] = res.data.subject._id;
      }

      if (extractedSlots.length > 0) {
        try {
          const semRes = await api.get('/semesters');
          const activeSem = semRes.data.semesters.find(s => s.isActive);
          if (activeSem) {
            const finalSlots = extractedSlots.map(s => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room,
              teacherName: s.teacherName,
              subjectId: createdSubjectsMap[s.subjectName]
            })).filter(s => s.subjectId);

            if (finalSlots.length > 0) {
              await api.post(`/semesters/${activeSem._id}/timetable/bulk`, { slots: finalSlots });
            }
          }
        } catch (timetableErr) {
          console.error("Failed to save timetable slots during onboarding", timetableErr);
        }
      }

      try {
        await api.patch('/users/budget', {
          totalBudget: Number(monthlyBudget),
          categories: {
            food: Number(categorySplit['Food'] || 0),
            transport: Number(categorySplit['Transport'] || 0),
            books: Number(categorySplit['Books'] || 0),
            entertainment: Number(categorySplit['Entertainment'] || 0),
            hostel: Number(categorySplit['Hostel'] || 0),
            miscellaneous: Number(categorySplit['Miscellaneous'] || 0)
          }
        });
      } catch (budgetErr) {
        console.error("Failed to save initial budget", budgetErr);
      }

      if (selectedHabits.length > 0) {
        try {
          for (const habitName of selectedHabits) {
            await api.post('/habits', { name: habitName, targetFrequency: 'daily' });
          }
        } catch (habitErr) {
          console.error("Failed to save initial habits", habitErr);
        }
      }

      const { data } = await api.patch('/users/profile', {
        monthlyBudget: Number(monthlyBudget),
        onboardingDone: true,
      });

      updateUser(data.user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setError(error.response?.data?.message || 'Could not save onboarding.');
    } finally {
      setSaving(false);
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 text-slate-950">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-300/20 blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-300/20 blur-[120px]" />
      </div>

      <motion.section 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/50 bg-white/80 backdrop-blur-xl p-6 shadow-2xl sm:p-10"
      >
        <div className="mb-8">
          <p className="text-sm font-bold text-indigo-600 tracking-wide uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Step {step} of 3
          </p>
          <h1 className="mt-2 text-3xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Finish setting up Synapse
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 font-medium">
            These details help Synapse personalize your academic dashboard.
          </p>
        </div>

        <div className="mb-10 flex gap-2">
          {[1, 2, 3].map((item) => (
            <motion.div
              layout
              className={`h-2 rounded-full ${
                item <= step ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
              style={{ flex: item === step ? 2 : 1 }}
              key={item}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
            <div>
              <h2 className="text-lg font-semibold">Monthly Budget</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add your total budget and an optional category split.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Total budget
              <input
                className={`${inputClass} mt-2`}
                min="0"
                onChange={(event) => setMonthlyBudget(event.target.value)}
                type="number"
                value={monthlyBudget}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {budgetCategories.map((category) => (
                <label
                  className="block text-sm font-medium text-slate-700"
                  key={category}
                >
                  {category}
                  <input
                    className={`${inputClass} mt-2`}
                    min="0"
                    onChange={(event) =>
                      handleCategoryChange(category, event.target.value)
                    }
                    type="number"
                    value={categorySplit[category]}
                  />
                </label>
              ))}
            </div>

            <p className="text-sm text-slate-600">
              Category split total: Rs {budgetSplitTotal}
            </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Add first subjects</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Add at least one subject to continue.
                  </p>
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleTimetableImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={importing}
                  />
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:shadow-md transition-all pointer-events-none overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-indigo-100 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {importing ? 'Processing AI...' : 'Auto-Import Timetable'}
                    </span>
                  </motion.button>
                </div>
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <AnimatePresence>
                  {subjects.map((subject, index) => (
                    <motion.div
                      variants={itemVariants}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0, padding: 0, overflow: 'hidden' }}
                      className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[100px_1fr_1fr_auto] hover:border-indigo-200 transition-colors"
                      key={index}
                    >
                  <label className="block text-sm font-medium text-slate-700">
                    Code
                    <input
                      className={`${inputClass} mt-2`}
                      onChange={(event) =>
                        handleSubjectChange(index, 'code', event.target.value)
                      }
                      type="text"
                      value={subject.code}
                      placeholder="Ex: 20IMCAT"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Name
                    <input
                      className={`${inputClass} mt-2`}
                      onChange={(event) =>
                        handleSubjectChange(index, 'name', event.target.value)
                      }
                      type="text"
                      value={subject.name}
                      placeholder="Ex: Database Management"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Professor
                    <input
                      className={`${inputClass} mt-2`}
                      onChange={(event) =>
                        handleSubjectChange(
                          index,
                          'professor',
                          event.target.value
                        )
                      }
                      type="text"
                      value={subject.professor}
                      placeholder="Ex: LIBIN M JOSEPH"
                    />
                  </label>

                  <button
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-slate-500 transition hover:bg-slate-100 sm:mt-7"
                    onClick={() => removeSubject(index)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                onClick={addSubject}
                type="button"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add another subject
              </motion.button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-800">Create first habits</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose any habits you want Synapse to keep visible.
                </p>
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-wrap gap-3"
              >
                {habitSuggestions.map((habit) => {
                  const selected = selectedHabits.includes(habit);

                  return (
                    <motion.button
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold transition-all shadow-sm ${
                        selected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                      key={habit}
                      onClick={() => toggleHabit(habit)}
                      type="button"
                    >
                    {selected ? <Check className="h-4 w-4" /> : null}
                    {habit}
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between border-t border-slate-100 pt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
            disabled={step === 1 || saving}
            onClick={() => {
              setError('');
              setStep((current) => Math.max(current - 1, 1));
            }}
            type="button"
          >
            Back
          </motion.button>

          {step < 3 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
              onClick={nextStep}
              type="button"
            >
              Continue
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 flex items-center gap-2"
              disabled={saving}
              onClick={completeOnboarding}
              type="button"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
              {saving ? 'Setting up Workspace...' : 'Finish onboarding'}
            </motion.button>
          )}
        </div>
      </motion.section>
    </main>
  );
}

export default Onboarding;
