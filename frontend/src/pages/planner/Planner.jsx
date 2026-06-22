import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { 
  Sparkles, ListTodo, Timer, Clock, AlertCircle, 
  Pin, PinOff, Trash2, Check, X, Folder as FolderIcon, FileText, ChevronRight, ChevronDown, ArrowLeft
} from 'lucide-react';
import FocusMode from './FocusMode.jsx';
import CustomPdfPlanModal from '../../components/planner/CustomPdfPlanModal.jsx';
import { useAuth } from '../../hooks/useAuth.js';

function Planner() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [loadingContents, setLoadingContents] = useState(false);
  const [selectedNotebookIds, setSelectedNotebookIds] = useState([]);
  const [customPlanOpen, setCustomPlanOpen] = useState(false);
  
  const [dashboardPlans, setDashboardPlans] = useState([]);
  const [customPlans, setCustomPlans] = useState([]);

  // Advanced Planner Settings
  const [dailyHours, setDailyHours] = useState(4);
  const [daysOff, setDaysOff] = useState([]);
  const [knowledgeText, setKnowledgeText] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [availableDays, setAvailableDays] = useState('');
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDayOff = (day) => {
    setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
      fetchPlans();
    }
  }, [activeTab]);

  const fetchPlans = async () => {
    try {
      const [dashRes, customRes] = await Promise.all([
        api.get('/planner/plans'),
        api.get('/custom-pdf-plan')
      ]);
      if (dashRes.data.success) setDashboardPlans(dashRes.data.plans);
      if (customRes.data) setCustomPlans(customRes.data);
    } catch (err) {
      console.error('Failed to load plans', err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const semRes = await api.get('/semesters');
      let currentSem = null;
      if (semRes.data.success) {
        const workingSemId = localStorage.getItem('synapse_working_semester_id');
        if (workingSemId) {
          currentSem = semRes.data.semesters.find(s => s._id === workingSemId);
        }
        if (!currentSem) {
          currentSem = semRes.data.semesters.find(s => s.isActive);
        }
      }

      // Fetch subjects and filter by active semester
      const res = await api.get('/subjects');
      const allSubjects = res.data.subjects || [];
      
      let currentSubjects = [];
      if (currentSem) {
        currentSubjects = allSubjects.filter(sub => sub.semesterId === currentSem._id);
      } else {
        // Fallback to legacy field if no active semester is found
        currentSubjects = allSubjects.filter(sub => sub.semester === user?.semester);
      }
      
      setSubjects(currentSubjects);
    } catch (err) {
      console.error('Failed to load subjects', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchContents = async (subjectId, folderId) => {
    setLoadingContents(true);
    try {
      const res = await api.get(`/subjects/${subjectId}/storage/contents`, {
        params: { folderId }
      });
      setContents(res.data || { folders: [], files: [] });
    } catch (err) {
      console.error('Failed to load contents', err);
    } finally {
      setLoadingContents(false);
    }
  };

  const handleSubjectClick = (subjectId) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
      return;
    }
    setExpandedSubject(subjectId);
    setCurrentFolderId(null);
    setFolderStack([]);
    fetchContents(subjectId, null);
  };

  const handleFolderClick = (folderId, folderName) => {
    setFolderStack([...folderStack, { id: currentFolderId, name: folderName }]);
    setCurrentFolderId(folderId);
    fetchContents(expandedSubject, folderId);
  };

  const handleBack = () => {
    const prev = folderStack[folderStack.length - 1];
    setFolderStack(folderStack.slice(0, -1));
    setCurrentFolderId(prev.id);
    fetchContents(expandedSubject, prev.id);
  };

  const handleOpenModal = () => {
    setShowModal(true);
    if (subjects.length === 0) fetchSubjects();
  };

  const generatePlan = async () => {
    if (selectedNotebookIds.length === 0) {
      setError('Please select at least one syllabus document to generate the plan.');
      return;
    }

    setGenerating(true);
    setError(null);
    setWarning(null);
    setShowModal(false);
    try {
      const res = await api.post('/planner/generate', { 
        notebookIds: selectedNotebookIds,
        dailyHours,
        daysOff,
        knowledgeText,
        targetDate,
        availableDays
      });
      if (res.data.warning) {
        setWarning(res.data.warning);
      }
      await fetchTasks();
      await fetchPlans();
      // Refetch user to update token usage
      const userRes = await api.get('/auth/me');
      if (userRes.data?.user) updateUser(userRes.data.user);
    } catch (err) {
      console.error('Failed to generate plan', err);
      setError(err.response?.data?.message || 'Error generating plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const togglePin = async (id) => {
    try {
      await api.patch(`/tasks/${id}/pin`);
      fetchTasks();
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const deleteAllTasks = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete ALL study tasks? This cannot be undone.')) return;
    try {
      await api.delete('/tasks/all');
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete all tasks', err);
      setError('Failed to clear all tasks. Please try again.');
    }
  };

  const deleteDashboardPlan = async (id) => {
    if (!window.confirm('Delete this Dashboard Plan and all its tasks?')) return;
    try {
      await api.delete(`/planner/plans/${id}`);
      fetchTasks();
      fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan', err);
    }
  };

  const deleteCustomPlan = async (id) => {
    if (!window.confirm('Delete this Custom Plan and all its tasks?')) return;
    try {
      await api.delete(`/custom-pdf-plan/${id}`);
      fetchTasks();
      fetchPlans();
    } catch (err) {
      console.error('Failed to delete custom plan', err);
    }
  };

  const downloadCustomPlanPdf = async (id, name) => {
    try {
      const response = await api.get(`/custom-pdf-plan/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download PDF', err);
    }
  };

  const coverTopic = async (id, topic) => {
    try {
      await api.patch(`/tasks/${id}/cover-topic`, { topic });
      fetchTasks();
    } catch (err) {
      console.error('Failed to cover topic', err);
    }
  };

  const getPriorityColor = (label) => {
    switch(label) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pinned': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'In Progress': return 'text-blue-600 bg-blue-50';
      case 'Missed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <ProtectedPage
      title="Planner"
      description="Plan study sessions, deadlines, routines, and weekly academic goals."
    >
      <div className="mb-6 flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <ListTodo className="w-4 h-4" />
          Smart Tasks
        </button>
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'focus' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Timer className="w-4 h-4" />
          Focus Mode
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Study Plan</h3>
              <p className="text-sm text-gray-500 mt-1 mb-3">Generate a dynamically prioritized study schedule based on your exams and weak subjects.</p>
              <div className="max-w-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-500" /> AI Usage</span>
                  <span className="text-xs font-medium text-gray-500">
                    {((user?.aiTokensUsed || 0) / 1000).toFixed(1)}k / {((user?.aiTokenLimit || 500000) / 1000).toFixed(0)}k tokens
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) > 0.8 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min(100, ((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setCustomPlanOpen(true)}
                className="flex justify-center items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Custom Plan
              </button>
              <button
                onClick={handleOpenModal}
                disabled={generating}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {generating ? <Clock className="w-5 h-5 animate-spin" /> : <ListTodo className="w-5 h-5 text-indigo-500" />}
                {generating ? 'Generating Plan...' : 'Generate from Dashboard'}
              </button>
              {tasks.length > 0 && (
                <button
                  onClick={deleteAllTasks}
                  disabled={generating}
                  className="flex justify-center items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Plans
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {warning && (
            <div className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-200 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-600" />
              <div>
                <h4 className="text-sm font-bold text-orange-900 mb-1">AI Planner Warning: Feasibility Alert</h4>
                <p className="text-sm font-medium text-orange-800">{warning}</p>
              </div>
            </div>
          )}

          {((dashboardPlans && dashboardPlans.length > 0) || (customPlans && customPlans.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              {(dashboardPlans || []).map(plan => (
                <div key={plan._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-bold text-gray-900">{plan.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">{plan.studyTaskIds?.length || 0} tasks</p>
                  </div>
                  <button onClick={() => deleteDashboardPlan(plan._id)} className="mt-3 text-xs font-semibold text-red-600 hover:bg-red-50 py-1.5 px-3 rounded-lg w-fit transition-colors">
                    Delete Plan
                  </button>
                </div>
              ))}
              {(customPlans || []).map(plan => (
                <div key={plan._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-gray-900">{plan.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{plan.taskCount || 0} tasks</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => downloadCustomPlanPdf(plan._id, plan.name)} className="text-xs font-semibold text-blue-600 hover:bg-blue-50 py-1.5 px-3 rounded-lg w-fit transition-colors">
                      Download PDF
                    </button>
                    <button onClick={() => deleteCustomPlan(plan._id)} className="text-xs font-semibold text-red-600 hover:bg-red-50 py-1.5 px-3 rounded-lg w-fit transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-12 flex justify-center"><Clock className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : tasks.length === 0 ? (
              <div className="py-16 bg-white rounded-2xl border border-gray-100 text-center">
                <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900">No tasks yet</h4>
                <p className="text-gray-500 mt-1">Generate an AI study plan or create a task manually.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task._id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md ${task.status === 'Completed' ? 'border-green-100 opacity-75' : 'border-gray-100'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getPriorityColor(task.priorityLabel)} uppercase tracking-wider`}>
                          {task.priorityLabel}
                        </span>
                        {task.source === 'ai_planner' && (
                          <span className="flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-md border border-violet-100">
                            <Sparkles className="w-3 h-3" /> Dashboard AI
                          </span>
                        )}
                        {task.source === 'custom_pdf_plan' && (
                          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                            <FileText className="w-3 h-3" /> Custom Plan
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <h4 className={`text-lg font-bold text-gray-900 ${task.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        {task.dueDate && (
                          <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                        {task.estimatedHours && (
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Est. {task.estimatedHours}h</span>
                        )}
                      </div>
                      
                      {task.topics && task.topics.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {task.topics.map(topic => {
                            const isCovered = task.coveredTopics?.includes(topic);
                            return (
                              <button
                                key={topic}
                                onClick={() => !isCovered && coverTopic(task._id, topic)}
                                disabled={isCovered}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isCovered ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer'}`}
                              >
                                {isCovered ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border-2 border-gray-400" />}
                                {topic}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus(task._id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 py-2 pl-3 pr-8 outline-none transition-colors"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Missed">Missed</option>
                      </select>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePin(task._id)}
                          className={`p-2 rounded-lg transition-colors ${task.pinnedByUser ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          title={task.pinnedByUser ? "Unpin task" : "Pin task to top"}
                        >
                          {task.pinnedByUser ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'focus' && (
        <FocusMode />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Syllabus Documents</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Select the PDF files you have attached to your subjects in the Dashboard. The AI will use these to build an accurate, module-wise plan.
            </p>

            <div className="flex-1 overflow-y-auto min-h-0 mb-4 pr-1">
              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 min-h-[200px]">
                {loadingSubjects ? (
                  <div className="flex justify-center items-center h-full min-h-[150px]"><Clock className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : subjects.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 text-sm px-4">
                    No subjects found. Please create subjects in your Dashboard first.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subjects.map(subject => (
                      <div key={subject._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button 
                          onClick={() => handleSubjectClick(subject._id)}
                          className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {expandedSubject === subject._id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                            <span className="font-semibold text-gray-900">{subject.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{subject.code}</span>
                        </button>
                        
                        {expandedSubject === subject._id && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4">
                            {folderStack.length > 0 && (
                              <button 
                                onClick={handleBack}
                                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-4 font-medium"
                              >
                                <ArrowLeft className="w-4 h-4" /> Back to {folderStack[folderStack.length - 1].name || 'Root'}
                              </button>
                            )}
                            
                            {loadingContents ? (
                              <div className="flex justify-center py-6"><Clock className="w-5 h-5 animate-spin text-indigo-500" /></div>
                            ) : (
                              <div className="space-y-2">
                                {contents.folders?.length === 0 && contents.files?.length === 0 && (
                                  <div className="text-sm text-gray-500 py-4 text-center bg-white rounded-lg border border-gray-100">This folder is empty.</div>
                                )}
                                
                                {contents.folders?.map(folder => (
                                  <button 
                                    key={folder._id}
                                    onClick={() => handleFolderClick(folder._id, folder.name)}
                                    className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left"
                                  >
                                    <FolderIcon className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                                    <span className="text-sm font-medium text-gray-800">{folder.name}</span>
                                  </button>
                                ))}

                                {contents.files?.map(file => (
                                  <label key={file._id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all">
                                    <input 
                                      type="checkbox" 
                                      className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                      checked={selectedNotebookIds.includes(file._id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedNotebookIds([...selectedNotebookIds, file._id]);
                                        } else {
                                          setSelectedNotebookIds(selectedNotebookIds.filter(id => id !== file._id));
                                        }
                                      }}
                                    />
                                    <FileText className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">{file.originalName}</div>
                                      <div className="text-xs text-gray-500 mt-0.5 uppercase">{(file.fileSize / 1024 / 1024).toFixed(2)} MB • {file.fileType.split('/')[1] || 'FILE'}</div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {selectedNotebookIds.length > 0 && (
              <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Planner Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Daily Study Hours: {dailyHours}h</label>
                    <input 
                      type="range" 
                      min="1" max="16" step="1"
                      value={dailyHours} 
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 px-1 mt-1">
                      <span>1h</span><span>16h</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Rest Days (No Study)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {weekDays.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleDayOff(day)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors border ${daysOff.includes(day) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Target Exam Date (Override)</label>
                    <input 
                      type="date" 
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Available Days (Override)</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="e.g. 14"
                      value={availableDays}
                      onChange={(e) => setAvailableDays(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Self Assessment (Optional)</label>
                    <textarea 
                      value={knowledgeText}
                      onChange={(e) => setKnowledgeText(e.target.value)}
                      placeholder="E.g., I find pointers in C++ very hard, but arrays are easy."
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={generatePlan}
                disabled={selectedNotebookIds.length === 0 || generating}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Generate
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomPdfPlanModal 
        open={customPlanOpen} 
        onClose={() => setCustomPlanOpen(false)} 
        onPlanCreated={() => {
          fetchTasks();
          fetchPlans();
        }} 
      />
    </ProtectedPage>
  );
}

export default Planner;
