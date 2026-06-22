import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Lock, Bell, Moon, Sun, 
  AlertTriangle, Upload, Trash2, Edit2, Save, X, ArrowLeft, Sparkles
} from 'lucide-react';
import AIPersonalizationSettings from './AIPersonalizationSettings';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

const Settings = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // States
  const [profile, setProfile] = useState({
    name: '', college: '', course: '', semester: '', targetCGPA: '', universityType: '10_point', theme: 'light', avatar: ''
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [notifications, setNotifications] = useState({
    EXAM_ALERT: true, ASSIGNMENT_DUE: true, BUDGET_WARNING: true, 
    HABIT_REMINDER: true, GROUP_MESSAGE: true, NEW_MESSAGE: true, 
    MISSED_CALL: true, CALENDAR_REMINDER: true, AI_BRIEFING: true,
    ATTENDANCE_WARNING: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await axios.get(`${API_URL}/api/users/profile`);
      if (profileRes.data.success) {
        const u = profileRes.data.user;
        setProfile(prev => ({ ...prev, ...u }));
        if (u.notificationPreferences) {
          setNotifications(prev => ({ ...prev, ...u.notificationPreferences }));
        }
        if (u.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }

    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Handlers
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API_URL}/api/users/profile`, profile);
      showMessage('success', 'Profile updated successfully.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error updating profile');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API_URL}/api/users/password`, passwords);
      showMessage('success', 'Password updated successfully.');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error updating password');
    }
  };

  const handleNotificationUpdate = async (key, val) => {
    const newPrefs = { ...notifications, [key]: val };
    setNotifications(newPrefs);
    try {
      await axios.patch(`${API_URL}/api/users/notification-preferences`, { preferences: newPrefs });
    } catch (err) {
      showMessage('error', 'Error saving notification preference');
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = profile.theme === 'light' ? 'dark' : 'light';
    setProfile({ ...profile, theme: newTheme });
    
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    try {
      await axios.patch(`${API_URL}/api/users/profile`, { theme: newTheme });
    } catch (err) {
      console.error('Failed to save theme', err);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetData = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/users/reset-data`, { password: confirmPassword });
      showMessage('success', 'All Synapse data reset successfully.');
      setShowResetModal(false);
      setConfirmPassword('');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error resetting data');
      setShowResetModal(false);
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.delete(`${API_URL}/api/users/account`, { data: { password: confirmPassword } });
      window.location.href = '/login'; // hard reload and redirect
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error deleting account');
      setShowDeleteModal(false);
      setConfirmPassword('');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen dark:bg-gray-900 dark:text-white">Loading Settings...</div>;
  }

  const tabs = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'security', icon: <Lock size={18} />, label: 'Security' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
    { id: 'appearance', icon: profile.theme === 'light' ? <Sun size={18} /> : <Moon size={18} />, label: 'Appearance' },
    { id: 'ai-settings', icon: <Sparkles size={18} />, label: 'AI Personalization' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-l-4 border-blue-600' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-3 px-6 py-4 text-left text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              >
                <AlertTriangle size={18} />
                <span className="font-medium">Reset Synapse Data</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-3 px-6 py-4 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={18} />
                <span className="font-medium">Delete Account</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
            
            {/* 1. Profile Section */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-white">Profile Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                      {profile.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-400" />}
                    </div>
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Change Avatar" />
                      <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition pointer-events-none">
                        <Upload size={16} /> Change Avatar
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                      <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">College</label>
                      <input type="text" value={profile.college} onChange={e => setProfile({...profile, college: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
                      <input type="text" value={profile.course} onChange={e => setProfile({...profile, course: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                      <input type="number" value={profile.semester} onChange={e => setProfile({...profile, semester: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target CGPA</label>
                      <input type="number" step="0.1" value={profile.targetCGPA} onChange={e => setProfile({...profile, targetCGPA: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                    <Save size={18} /> Save Profile
                  </button>
                </form>
              </div>
            )}

            {/* 5. Notifications Section */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-white">Notification Preferences</h2>
                <div className="space-y-4 max-w-lg">
                  {Object.entries(notifications).map(([key, enabled]) => (
                    <div key={key} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{key.replace(/_/g, ' ').toLowerCase()}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={enabled} onChange={(e) => handleNotificationUpdate(key, e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Appearance Section */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-white">Appearance</h2>
                <div className="flex items-center justify-between p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 max-w-md">
                  <div className="flex items-center gap-4">
                    {profile.theme === 'light' ? <Sun size={24} className="text-yellow-500" /> : <Moon size={24} className="text-blue-400" />}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Dark Mode</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={profile.theme === 'dark'} onChange={handleThemeToggle} />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            )}

            {/* 7. AI Personalization Section */}
            {activeTab === 'ai-settings' && (
              <AIPersonalizationSettings />
            )}

          </div>
        </div>
      </div>

      {/* Reset Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-orange-600 flex items-center gap-2"><AlertTriangle /> Reset Synapse Data</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={20} /></button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              This action will clear all your generated data (notebooks, habits, finances, groups) but your account and profile will remain active.
            </p>
            <form onSubmit={handleResetData}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm with Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 rounded-lg border border-orange-300 focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition shadow-lg shadow-orange-600/20">
                  Reset Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2"><Trash2 /> Delete Account</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={20} /></button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              This action is <span className="font-bold">permanent</span> and cannot be undone. All your data and your account will be permanently deleted.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm with Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-600/20">
                  Delete Permanently
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
