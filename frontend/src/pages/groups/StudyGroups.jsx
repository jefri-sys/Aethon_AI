import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { Users, Search, Plus, MessageSquare, X, ShieldAlert } from 'lucide-react';
import GroupChat from './GroupChat';

const StudyGroups = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showDiscover, setShowDiscover] = useState(false);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPublic: true });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyGroups();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const joinId = params.get('join');
    if (joinId) {
      handleJoin(joinId).then(() => {
        navigate('/dashboard/groups', { replace: true });
      });
    }
  }, [location.search]);

  const fetchMyGroups = async () => {
    try {
      const { data } = await api.get('/groups/mine');
      setMyGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching my groups:', err);
      setMyGroups([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      withCredentials: true
    });

    const handleNewMessage = (msg) => {
      // If we are currently viewing this group, mark as read immediately
      if (activeGroupId === msg.groupId) {
        markAsRead(activeGroupId);
      } else {
        setMyGroups(prev => prev.map(g => 
          g._id === msg.groupId ? { ...g, unreadCount: (g.unreadCount || 0) + 1 } : g
        ));
      }
    };

    socket.on('newMessage', handleNewMessage);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.disconnect();
    };
  }, [activeGroupId]);

  const handleDiscover = async () => {
    try {
      const { data } = await api.get('/groups/discover');
      setDiscoverGroups(Array.isArray(data) ? data : []);
      setShowDiscover(true);
    } catch (err) {
      console.error('Error fetching discover groups:', err);
      setDiscoverGroups([]);
    }
  };

  const handleJoin = async (id) => {
    try {
      await api.post(`/groups/${id}/join`);
      setShowDiscover(false);
      fetchMyGroups();
      setActiveGroupId(id);
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  useEffect(() => {
    if (activeGroupId) {
      markAsRead(activeGroupId);
    }
  }, [activeGroupId]);

  const markAsRead = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/read`);
      setMyGroups(prev => prev.map(g => 
        g._id === groupId ? { ...g, unreadCount: 0 } : g
      ));
    } catch (err) {
      console.error('Error marking group as read:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/groups', newGroup);
      setShowCreate(false);
      setNewGroup({ name: '', description: '', isPublic: true });
      fetchMyGroups();
      setActiveGroupId(data._id);
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const activeGroup = Array.isArray(myGroups) ? myGroups.find(g => g._id === activeGroupId) : undefined;

  return (
    <div className="flex h-[75vh] min-h-[500px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Groups Sidebar */}
      <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" /> My Groups
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleDiscover}
              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition"
              title="Discover Groups"
            >
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowCreate(true)}
              className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              title="Create Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {myGroups.length === 0 ? (
            <div className="text-center p-6 text-slate-500">
              <p className="text-sm">No study groups joined yet.</p>
              <button 
                onClick={handleDiscover}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition"
              >
                Find a Group
              </button>
            </div>
          ) : (
            myGroups.map(group => (
              <div 
                key={group._id} 
                onClick={() => setActiveGroupId(group._id)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition ${activeGroupId === group._id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'bg-white hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{group.name}</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap ml-2 flex items-center gap-1">
                    {group.members?.length || 1}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-500 truncate">{group.course}</p>
                  {group.unreadCount > 0 && (
                    <div className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center">
                      {group.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white flex flex-col h-full relative">
        {activeGroup ? (
          <GroupChat group={activeGroup} onLeave={() => { setActiveGroupId(null); fetchMyGroups(); }} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-slate-100">
              <MessageSquare className="w-12 h-12 text-indigo-200" />
            </div>
            <p className="text-slate-500 font-medium">Select a study group to start chatting</p>
          </div>
        )}
      </div>

      {/* Discover Modal */}
      {showDiscover && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Search className="w-5 h-5 mr-2 text-indigo-600" /> Discover Groups
              </h3>
              <button onClick={() => setShowDiscover(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {discoverGroups.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No groups found</p>
                  <p className="text-xs text-slate-400 mt-1">There are no new groups for your course and college yet.</p>
                </div>
              ) : (
                discoverGroups.map(group => (
                  <div key={group._id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:border-indigo-200 transition bg-slate-50">
                    <div className="pr-4">
                      <h4 className="font-bold text-slate-800">{group.name}</h4>
                      {group.description && <p className="text-xs text-slate-500 mt-1">{group.description}</p>}
                      <p className="text-xs font-medium text-indigo-600 mt-2 bg-indigo-50 inline-block px-2 py-0.5 rounded-full">
                        {group.members?.length || 1} members
                      </p>
                    </div>
                    <button 
                      onClick={() => handleJoin(group._id)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition shrink-0"
                    >
                      Join Group
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-indigo-600" /> Create Group
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. CS101 Study Buddies"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  placeholder="What is this group about?"
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Privacy</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy" 
                      checked={newGroup.isPublic} 
                      onChange={() => setNewGroup({...newGroup, isPublic: true})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Public (College-wide)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy" 
                      checked={!newGroup.isPublic} 
                      onChange={() => setNewGroup({...newGroup, isPublic: false})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Private (Invite Link)</span>
                  </label>
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Create & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroups;
