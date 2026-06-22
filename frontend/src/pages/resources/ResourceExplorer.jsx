import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { Search, Compass, BookOpen, Video, FileText, CheckCircle, ExternalLink, Clock, Save, Plus, Sparkles, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ExplorerChat from './ExplorerChat.jsx';

function ResourceExplorer() {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [timeframe, setTimeframe] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/resources/history');
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleSearch = async (e, overrideTopic = null) => {
    e?.preventDefault();
    const searchTopic = overrideTopic || topic;
    if (!searchTopic.trim()) return;

    setLoading(true);
    setRoadmap(null);
    setSession(null);
    setIsChatOpen(true);
    try {
      const res = await api.post('/resources/explore', { 
        topic: searchTopic,
        experienceLevel,
        timeframe
      });
      if (res.data.success) {
        setRoadmap(res.data.data);
        setSession(res.data.session);
        fetchHistory(); // refresh history
      }
    } catch (err) {
      console.error('Explore error', err);
    } finally {
      setLoading(false);
    }
  };

  const selectHistory = async (sessionId) => {
    setLoading(true);
    setRoadmap(null);
    setSession(null);
    setIsChatOpen(true);
    try {
      const res = await api.get(`/resources/sessions/${sessionId}`);
      if (res.data.success) {
        setTopic(res.data.session.topic);
        setRoadmap(res.data.session.roadmap);
        setSession(res.data.session);
      }
    } catch(err) {
      console.error('Fetch session error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (e, sessionId) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/resources/sessions/${sessionId}`);
      if (res.data.success) {
        setHistory(prev => prev.filter(h => h._id !== sessionId));
        if (session && session._id === sessionId) {
          setSession(null);
          setRoadmap(null);
          setTopic('');
        }
      }
    } catch (error) {
      console.error('Failed to delete history', error);
    }
  };

  const handleNewResources = (newResources) => {
    setSession(prev => prev ? { ...prev, resources: newResources } : prev);
  };

  const getIconForType = (type) => {
    const t = type.toLowerCase();
    if (t.includes('video')) return <Video className="w-4 h-4 text-red-500" />;
    if (t.includes('doc') || t.includes('tutorial')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (t.includes('practice')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <BookOpen className="w-4 h-4 text-indigo-500" />;
  };

  const handleSaveToNotebook = (resource) => {
    alert(`Saved "${resource.title}" to Notebook (Coming soon!)`);
  };

  const handleAddStudyTask = (resource) => {
    alert(`Added "${resource.title}" to Planner (Coming soon!)`);
  };

  return (
    <ProtectedPage
      title="Resource Explorer"
      description="AI-curated learning roadmaps for any topic."
    >
      <div className="flex flex-col lg:flex-row gap-6 mt-6 h-[calc(100vh-140px)]">
        {/* Left Content */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <div className="flex items-center gap-3 relative">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Learn React, DBMS, Python..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    disabled={loading}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!topic.trim() || loading}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20 shrink-0"
                >
                  <Compass className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Curating...' : 'Explore'}
                </button>
              </div>

              {!roadmap && !loading && (
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={e => setExperienceLevel(e.target.value)}
                      className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Timeframe (Optional)</label>
                    <input
                      type="text"
                      value={timeframe}
                      onChange={e => setTimeframe(e.target.value)}
                      placeholder="e.g. 1 month, 2 weeks..."
                      className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <Compass className="w-12 h-12 animate-spin text-indigo-300" />
                <p>Generating a custom learning roadmap...</p>
              </div>
            ) : roadmap ? (
              <div className="max-w-3xl mx-auto pb-10 relative">
                {session && !isChatOpen && (
                  <div className="flex justify-end mb-4">
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors border border-indigo-200 text-sm shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" /> Ask AI Assistant
                    </button>
                  </div>
                )}
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{roadmap.topic}</h2>
                  <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-500">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full capitalize">
                      {roadmap.level} Level
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {roadmap.totalEstimatedTime}
                    </span>
                  </div>
                </div>

                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {roadmap.roadmap.map((step, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold text-sm z-10">
                        {step.step}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{step.title}</h3>
                        <p className="text-slate-600 text-sm mb-4">{step.description}</p>
                        
                        <div className="space-y-3">
                          {step.resources.map((res, rIdx) => (
                            <div key={rIdx} className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex flex-col gap-3 group/card hover:border-indigo-200 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-md shadow-sm border border-slate-100">
                                  {getIconForType(res.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a href={res.url} target="_blank" rel="noreferrer" className="font-semibold text-slate-800 text-sm hover:text-indigo-600 flex items-center gap-1 transition-colors">
                                    {res.title}
                                    <ExternalLink className="w-3 h-3 opacity-50" />
                                  </a>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium capitalize">
                                    <span>{res.type}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {res.estimatedTime}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <button onClick={() => handleSaveToNotebook(res)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                                  <Save className="w-3.5 h-3.5" /> Save to Notebook
                                </button>
                                <button onClick={() => handleAddStudyTask(res)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-colors">
                                  <Plus className="w-3.5 h-3.5" /> Add Task
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {session && session.resources && session.resources.some(r => !r.fromInitialSearch) && (
                  <div className="mt-12 pt-8 border-t border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      Discovered in Chat
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {session.resources.filter(r => !r.fromInitialSearch).map((res, rIdx) => (
                        <div key={rIdx} className="bg-white shadow-sm border border-slate-200 p-4 rounded-xl flex flex-col gap-3 group/card hover:border-indigo-200 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 bg-slate-50 p-1.5 rounded-md shadow-sm border border-slate-100">
                              {getIconForType(res.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <a href={res.url} target="_blank" rel="noreferrer" className="font-semibold text-slate-800 text-sm hover:text-indigo-600 flex items-center gap-1 transition-colors">
                                {res.title}
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium capitalize">
                                <span>{res.type}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {res.estimatedTime}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button onClick={() => handleSaveToNotebook(res)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                            <button onClick={() => handleAddStudyTask(res)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-colors">
                              <Plus className="w-3.5 h-3.5" /> Task
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Compass className="w-8 h-8 text-slate-300" />
                </div>
                <p>Search for a topic to get a structured learning roadmap.</p>
              </div>
            )}
          </div>
        </div>

        {session && isChatOpen ? (
          <div className="w-full lg:w-1/2 shrink-0 h-full relative">
            <button 
              onClick={() => setIsChatOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              title="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
            <ExplorerChat 
              sessionId={session._id} 
              initialMessages={session.messages} 
              onNewResources={handleNewResources} 
            />
          </div>
        ) : !session ? (
          <div className="w-full lg:w-72 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Recent Explorations
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {history.length > 0 ? (
              history.map((item, idx) => (
                <div key={item._id} className="w-full relative group flex items-center">
                  <button
                    onClick={() => selectHistory(item._id)}
                    className="flex-1 text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate pr-8 font-medium group-hover:text-indigo-600 transition-colors">{item.query}</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteHistory(e, item._id)}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-400">
                No recent searches.
              </div>
            )}
          </div>
        </div>
        ) : null}
      </div>
    </ProtectedPage>
  );
}

export default ResourceExplorer;
