import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertTriangle, RotateCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SCOPES = [
  { id: 'global', label: 'Global', helper: 'General style, tone, and language. Applies to all personal AI features.' },
  { id: 'notebook', label: 'Notebook', helper: 'Applies to summaries, flashcards, and notebook Q&A.' },
  { id: 'planner', label: 'Study Planner', helper: 'Applies to dashboard schedules and custom PDF plans.' },
  { id: 'resourceExplorer', label: 'Resource Explorer', helper: 'Applies to roadmap generation and resource chat.' }
];

export default function AIPersonalizationSettings() {
  const [preferences, setPreferences] = useState({});
  const [updatedDates, setUpdatedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState({}); // { scopeId: 'saving' | 'saved' | 'error' }

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/settings/ai-preferences`);
      
      const initialPrefs = {};
      const dates = {};
      SCOPES.forEach(s => {
        initialPrefs[s.id] = res.data[s.id]?.raw || '';
        dates[s.id] = res.data[s.id]?.updatedAt || null;
      });
      setPreferences(initialPrefs);
      setUpdatedDates(dates);
    } catch (err) {
      console.error('Failed to load AI preferences', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (scopeId, text) => {
    if (text.length > 1000) return;
    setPreferences(prev => ({ ...prev, [scopeId]: text }));
    if (savingStatus[scopeId] === 'saved') {
      setSavingStatus(prev => ({ ...prev, [scopeId]: '' }));
    }
  };

  const handleSave = async (scopeId) => {
    try {
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'saving' }));
      
      const res = await axios.put(`${API_URL}/api/settings/ai-preferences/${scopeId}`, {
        text: preferences[scopeId]
      });

      setSavingStatus(prev => ({ ...prev, [scopeId]: 'saved' }));
      setUpdatedDates(prev => ({ ...prev, [scopeId]: res.data.updatedAt }));
      
      setTimeout(() => {
        setSavingStatus(prev => {
          if (prev[scopeId] === 'saved') {
            return { ...prev, [scopeId]: '' };
          }
          return prev;
        });
      }, 3000);
    } catch (err) {
      console.error(`Failed to save ${scopeId} preferences`, err);
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'error' }));
    }
  };

  const handleReset = async (scopeId) => {
    const scopeLabel = SCOPES.find(s => s.id === scopeId)?.label || scopeId;
    if (!window.confirm(`Are you sure you want to reset the ${scopeLabel} AI instructions to default?`)) {
      return;
    }
    
    try {
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'saving' }));
      
      await axios.delete(`${API_URL}/api/settings/ai-preferences/${scopeId}`);

      setPreferences(prev => ({ ...prev, [scopeId]: '' }));
      setUpdatedDates(prev => ({ ...prev, [scopeId]: null }));
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'reset' }));
      
      setTimeout(() => {
        setSavingStatus(prev => {
          if (prev[scopeId] === 'reset') {
            return { ...prev, [scopeId]: '' };
          }
          return prev;
        });
      }, 3000);
    } catch (err) {
      console.error(`Failed to reset ${scopeId} preferences`, err);
      setSavingStatus(prev => ({ ...prev, [scopeId]: 'error' }));
    }
  };

  if (loading) {
    return <div className="animate-pulse flex flex-col gap-6"><div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div></div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 dark:text-white">Customize AI Behavior</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
        Give the AI custom instructions on how to behave, what tone to use, or how to format responses. 
        These layer on top of the base features and do not affect the public Study Group AI bots.
      </p>

      <div className="space-y-8">
        {SCOPES.map(scope => (
          <div key={scope.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="mb-3">
              <label className="block text-base font-semibold text-gray-900 dark:text-white">
                {scope.label}
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {scope.helper}
              </p>
            </div>
            
            <div className="relative">
              <textarea
                value={preferences[scope.id] || ''}
                onChange={(e) => handleTextChange(scope.id, e.target.value)}
                placeholder="e.g. Speak like a pirate..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
                {(preferences[scope.id] || '').length}/1000
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                {savingStatus[scope.id] === 'error' && (
                  <span className="text-red-500 text-sm flex items-center gap-1 font-medium">
                    <AlertTriangle size={14} /> Failed to save
                  </span>
                )}
                {savingStatus[scope.id] === 'saved' && (
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    Saved successfully!
                  </span>
                )}
                {savingStatus[scope.id] === 'reset' && (
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Reset to default.
                  </span>
                )}
                {savingStatus[scope.id] !== 'saved' && savingStatus[scope.id] !== 'reset' && savingStatus[scope.id] !== 'error' && updatedDates[scope.id] && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                    Last updated: {new Date(updatedDates[scope.id]).toLocaleDateString()} {new Date(updatedDates[scope.id]).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {preferences[scope.id] && preferences[scope.id].length > 0 && (
                  <button
                    onClick={() => handleReset(scope.id)}
                    disabled={savingStatus[scope.id] === 'saving'}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                )}
                <button 
                  onClick={() => handleSave(scope.id)}
                  disabled={savingStatus[scope.id] === 'saving'}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Save size={16} /> 
                  {savingStatus[scope.id] === 'saving' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
