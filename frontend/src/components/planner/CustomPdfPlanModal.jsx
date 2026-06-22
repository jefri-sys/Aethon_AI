import React, { useState, useRef, useEffect } from 'react';
import { 
  X, UploadCloud, File as FileIcon, Trash2, GripVertical, Plus, 
  Settings, CheckCircle, Clock, Calendar, BookOpen
} from 'lucide-react';
import api from '../../services/api';

const CustomPdfPlanModal = ({ open, onClose, onPlanCreated }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);

  // Step 1: Upload
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [fileNames, setFileNames] = useState([]);
  const fileInputRef = useRef(null);

  // Step 2: Topics
  const [topics, setTopics] = useState([]);
  
  // Step 3: Constraints
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyHours, setDailyHours] = useState(2);
  const [sessionStyle, setSessionStyle] = useState('mixed');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // Step 4: Preview
  const [plan, setPlan] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [addToPlanner, setAddToPlanner] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/subjects').then(res => {
        if (res.data.success) {
          setSubjects(res.data.subjects || []);
        }
      }).catch(console.error);
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (files.length + selected.length > 5) {
      setError('Max 5 files allowed.');
      return;
    }
    setError(null);
    setFiles(prev => [...prev, ...selected].slice(0, 5));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleExtractTopics = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('pdfs', f));
      
      const res = await api.post('/custom-pdf-plan/extract-topics', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setTopics(res.data.topics || []);
      setExtractedText(res.data.extractedText);
      setFileNames(res.data.fileNames);
      setPlanName(res.data.fileNames.length > 0 ? `${res.data.fileNames[0].split('.')[0]} Plan` : 'Custom Plan');
      setStep(2);
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message;
      setError(`Could not extract topics automatically: ${backendError}. You can add them manually.`);
      setTopics([]);
      setStep(2);
    } finally {
      setUploading(false);
    }
  };

  const updateTopic = (index, field, value) => {
    const newTopics = [...topics];
    newTopics[index][field] = value;
    setTopics(newTopics);
  };

  const removeTopic = (index) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const addTopic = (moduleName = 'General') => {
    setTopics([...topics, { module: moduleName, title: '', estimatedHours: 1, difficulty: 'medium' }]);
  };

  const handleGeneratePlan = async () => {
    if (!planName.trim()) { setError('Plan Name is required.'); return; }
    if (!startDate || !endDate) { setError('Start and End dates are required.'); return; }
    if (new Date(startDate) > new Date(endDate)) { setError('Start date must be before end date.'); return; }
    if (topics.length === 0) { setError('At least one topic is required.'); return; }

    setUploading(true);
    setError(null);
    try {
      const res = await api.post('/custom-pdf-plan/generate-plan', {
        topics,
        constraints: { startDate, endDate, dailyHours, sessionStyle }
      });
      setPlan(res.data.plan || []);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError('Plan generation failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmPlan = async () => {
    setConfirming(true);
    setError(null);
    try {
      await api.post('/custom-pdf-plan/confirm', {
        name: planName,
        pdfFileNames: fileNames,
        extractedText,
        topics,
        constraints: { startDate, endDate, dailyHours, sessionStyle },
        generatedPlan: plan,
        addToPlanner,
        subjectId: selectedSubject
      });
      onPlanCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save plan.');
    } finally {
      setConfirming(false);
    }
  };

  const handleSaveAsPdf = async () => {
    if (!selectedSubject) {
      setError('Please go back to Step 3 and select a Subject to save the PDF to.');
      return;
    }
    setSavingPdf(true);
    setError(null);
    try {
      await api.post('/custom-pdf-plan/generate-pdf', {
        name: planName,
        topics,
        generatedPlan: plan,
        subjectId: selectedSubject,
        constraints: { startDate, endDate, dailyHours, sessionStyle }
      });
      
      const el = document.createElement('div');
      el.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4';
      el.innerText = 'PDF saved to Subject files!';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save PDF.');
    } finally {
      setSavingPdf(false);
    }
  };

  const totalTopicHours = topics.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalDays = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1) : 0;
  const totalAvailableHours = totalDays * dailyHours;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatDayTotal = (tasks) => {
    const totalMins = tasks.reduce((s, t) => s + (t.durationMinutes || 0), 0);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  };

  const groupedTopics = topics.reduce((acc, topic, index) => {
    const mod = topic.module || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push({ ...topic, originalIndex: index });
    return acc;
  }, {});
  const moduleNames = Object.keys(groupedTopics);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-4 flex-1">
            {[1, 2, 3, 4].map(s => (
              <React.Fragment key={s}>
                <div className={`flex flex-col items-center flex-1 ${s <= step ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s === step ? 'bg-violet-600 text-white' : s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  <span className="text-[10px] uppercase font-bold mt-1 text-gray-500">
                    {s === 1 ? 'Upload' : s === 2 ? 'Topics' : s === 3 ? 'Constraints' : 'Preview'}
                  </span>
                </div>
                {s < 4 && <div className={`h-0.5 flex-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <button onClick={onClose} className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-violet-300 transition-all"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="application/pdf" 
                  multiple 
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-10 h-10 text-violet-500 mb-3" />
                <h4 className="text-sm font-bold text-gray-900">Browse files</h4>
                <p className="text-xs text-gray-500 mt-1">Only PDF files are supported. Max 5 files.</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-white transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-right text-gray-500">{5 - files.length} remaining</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Topics */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Review & Edit Topics
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {topics.length} topics across {moduleNames.length} modules · {totalTopicHours.toFixed(1)}h total
                  </p>
                </div>
                <button onClick={() => addTopic('General')} className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Topic
                </button>
              </div>

              {moduleNames.map((moduleName) => (
                <div key={moduleName} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  
                  {/* Module header */}
                  <div className="bg-violet-50 dark:bg-violet-900/20 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                        {moduleName}
                      </span>
                      <span className="text-xs text-violet-500 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full">
                        {groupedTopics[moduleName].length} topics · {groupedTopics[moduleName].reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0).toFixed(1)}h
                      </span>
                    </div>
                  </div>

                  {/* Topics under this module */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {groupedTopics[moduleName].map(({ originalIndex, ...topic }) => (
                      <div key={originalIndex} className="px-4 py-3 flex items-center gap-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        
                        {/* Drag handle (visual only) */}
                        <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />

                        {/* Topic title input */}
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => updateTopic(originalIndex, 'title', e.target.value)}
                          className="flex-1 min-w-0 text-sm font-medium !text-gray-900 dark:!text-white bg-white dark:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-violet-500 focus:outline-none rounded-md px-2 py-1 transition-colors"
                          placeholder="Topic title"
                        />

                        {/* Hours input */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input
                            type="number"
                            value={topic.estimatedHours}
                            onChange={(e) => updateTopic(originalIndex, 'estimatedHours', parseFloat(e.target.value) || 0.5)}
                            min={0.5}
                            max={8}
                            step={0.5}
                            className="w-16 text-sm text-center font-medium !text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <span className="text-xs text-gray-400">h</span>
                        </div>

                        {/* Difficulty toggle */}
                        <div className="flex gap-1 flex-shrink-0">
                          {['easy', 'medium', 'hard'].map((level) => (
                            <button
                              key={level}
                              onClick={() => updateTopic(originalIndex, 'difficulty', level)}
                              className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                                topic.difficulty === level
                                  ? level === 'easy'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                    : level === 'medium'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                              }`}
                            >
                              {level === 'easy' ? 'Easy' : level === 'medium' ? 'Med' : 'Hard'}
                            </button>
                          ))}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => removeTopic(originalIndex)}
                          className="flex-shrink-0 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                      <button 
                        onClick={() => addTopic(moduleName)} 
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Topic to {moduleName}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Hours warning */}
              {totalTopicHours < 1 && (
                <p className="text-sm text-red-500 text-center">Add at least one topic with study hours before continuing.</p>
              )}
            </div>
          )}

          {/* STEP 3: Constraints */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Plan Name *</label>
                  <input 
                    type="text" 
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    placeholder='e.g. "DBMS Semester Plan"'
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Subject (for saving PDF) *</label>
                  <select 
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500 outline-none"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Date *</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">End Date *</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                  <span>Daily Study Hours *</span>
                  <span className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">{dailyHours} hours/day</span>
                </label>
                <input 
                  type="range" 
                  min="0.5" max="10" step="0.5" 
                  value={dailyHours}
                  onChange={e => setDailyHours(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Session Style</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${sessionStyle === 'mixed' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="style" value="mixed" checked={sessionStyle === 'mixed'} onChange={() => setSessionStyle('mixed')} className="mt-1 w-4 h-4 text-violet-600" />
                    <div>
                      <div className={`text-sm font-bold ${sessionStyle === 'mixed' ? 'text-violet-900' : 'text-gray-900'}`}>Mixed (Recommended)</div>
                      <div className={`text-xs mt-0.5 ${sessionStyle === 'mixed' ? 'text-violet-700' : 'text-gray-500'}`}>Cover multiple topics per day in blocks to avoid burnout.</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${sessionStyle === 'focused' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="style" value="focused" checked={sessionStyle === 'focused'} onChange={() => setSessionStyle('focused')} className="mt-1 w-4 h-4 text-violet-600" />
                    <div>
                      <div className={`text-sm font-bold ${sessionStyle === 'focused' ? 'text-violet-900' : 'text-gray-900'}`}>Focused</div>
                      <div className={`text-xs mt-0.5 ${sessionStyle === 'focused' ? 'text-violet-700' : 'text-gray-500'}`}>One topic per day maximum, go deep before moving on.</div>
                    </div>
                  </label>
                </div>
              </div>

              {startDate && endDate && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  totalAvailableHours >= totalTopicHours ? 'bg-green-50 border-green-200 text-green-800' :
                  totalAvailableHours >= totalTopicHours * 0.8 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <Settings className={`w-5 h-5 shrink-0 ${
                    totalAvailableHours >= totalTopicHours ? 'text-green-500' :
                    totalAvailableHours >= totalTopicHours * 0.8 ? 'text-yellow-500' :
                    'text-red-500'
                  }`} />
                  <div>
                    <h4 className="text-sm font-bold mb-1">Schedule Summary</h4>
                    <p className="text-xs font-medium">You have {totalDays} days ({totalAvailableHours} hours). Topics need {totalTopicHours} hours.</p>
                    {totalAvailableHours < totalTopicHours && (
                      <p className="text-xs font-bold mt-1 opacity-90">AI will compress the plan proportionally to fit your available time.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Your custom study plan is ready</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{planName} • {plan.length} days • {plan.reduce((sum, day) => sum + day.tasks.length, 0)} study sessions</p>
              </div>

              <div className="space-y-6">
                {plan.map((day) => (
                  <div key={day.date} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    
                    {/* Date header */}
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {formatDate(day.date)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDayTotal(day.tasks)}
                      </span>
                    </div>

                    {/* Tasks for this day */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {day.tasks.map((task, i) => (
                        <div key={i} className="px-4 py-3 bg-white dark:bg-gray-900">
                          
                          {/* Module badge */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                              {task.module}
                            </span>
                            {task.totalSessions > 1 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                Session {task.sessionNumber}/{task.totalSessions}
                              </span>
                            )}
                          </div>

                          {/* Topic title + duration */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {task.topicTitle}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                              {Math.floor(task.durationMinutes / 60) > 0
                                ? `${Math.floor(task.durationMinutes / 60)}h ${task.durationMinutes % 60 > 0 ? `${task.durationMinutes % 60}m` : ''}`
                                : `${task.durationMinutes}m`}
                            </span>
                          </div>

                          {/* AI notes */}
                          {task.notes && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-5 italic">
                              {task.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-100 flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={addToPlanner} 
                    onChange={(e) => setAddToPlanner(e.target.checked)} 
                    className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500" 
                  />
                  <div>
                    <div className="text-sm font-bold text-violet-900">Add to Planner?</div>
                    <div className="text-xs text-violet-700">If enabled, these sessions will be added to your study calendar as tasks.</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            disabled={uploading || confirming}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <div>
            {step === 1 && (
              <button 
                onClick={handleExtractTopics} 
                disabled={files.length === 0 || uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {uploading ? 'Reading PDFs...' : 'Extract Topics'}
              </button>
            )}
            {step === 2 && (
              <button 
                onClick={() => setStep(3)} 
                disabled={topics.length === 0 || totalTopicHours < 0.5}
                className="px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                Set Constraints
              </button>
            )}
            {step === 3 && (
              <button 
                onClick={handleGeneratePlan} 
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {uploading ? 'AI is building...' : 'Generate Plan'}
              </button>
            )}
            {step === 4 && (
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveAsPdf}
                  disabled={savingPdf || confirming}
                  className="px-4 py-2 text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  {savingPdf ? 'Saving...' : 'Save as PDF'}
                </button>
                <button 
                  onClick={handleConfirmPlan} 
                  disabled={confirming}
                  className="px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {confirming ? 'Saving...' : (addToPlanner ? 'Confirm & Add to Planner' : 'Finish & Save')}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomPdfPlanModal;
