import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../../services/api';
import { Users, Search, Plus, X } from 'lucide-react';
import GroupChat from '../../../pages/groups/GroupChat';

const renderLastMessagePreview = (msg) => {
  if (!msg) return null;
  if (msg.isDeleted || msg.message === 'This message was deleted') return '🚫 This message was deleted';
  const type = msg.messageType || msg.type || 'text';
  const text = msg.message || msg.content || '';
  switch (type) {
    case 'audio': return '🎤 Voice message';
    case 'image': return '📷 Photo';
    case 'video': return '🎥 Video';
    case 'document': return '📎 Attachment';
    case 'system': return text;
    case 'summary': return '🤖 AI Summary';
    default: return text.length > 35 ? text.substring(0, 35) + '...' : text;
  }
};

export default function MobileStudyGroups({ user }) {
  const [myGroups, setMyGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showDiscover, setShowDiscover] = useState(false);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPublic: true });
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [socket, setSocket] = useState(null);
  
  const [viewMode, setViewMode] = useState('list');
  const [localMessages, setLocalMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyGroups();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const newSocket = io(import.meta.env.VITE_API_URL || 'https://synapse-ai-4dcd.onrender.com', {
      auth: { token },
      withCredentials: true
    });
    setSocket(newSocket);
    
    const handleNewMessage = (msg) => {
      if (activeGroupId === msg.groupId) {
        markAsRead(activeGroupId);
        setLocalMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 100);
      } else {
        setMyGroups(prev => prev.map(g => 
          g._id === msg.groupId ? { ...g, unreadCount: (g.unreadCount || 0) + 1, lastMessage: msg } : g
        ));
      }
    };

    newSocket.on('newMessage', handleNewMessage);
    
    return () => {
      newSocket.off('newMessage', handleNewMessage);
      newSocket.disconnect();
    };
  }, [activeGroupId]);

  const fetchMyGroups = async () => {
    try {
      setLoadingGroups(true);
      const { data } = await api.get('/groups/mine');
      setMyGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleDiscover = async () => {
    try {
      const { data } = await api.get('/groups/discover');
      setDiscoverGroups(Array.isArray(data) ? data : []);
      setShowDiscover(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (id) => {
    try {
      await api.post(`/groups/${id}/join`);
      setShowDiscover(false);
      fetchMyGroups();
      setActiveGroupId(id);
      setViewMode('chat');
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/read`);
      setMyGroups(prev => prev.map(g => 
        g._id === groupId ? { ...g, unreadCount: 0 } : g
      ));
    } catch (err) {
      console.error(err);
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
      setViewMode('chat');
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeGroup = Array.isArray(myGroups) ? myGroups.find(g => g._id === activeGroupId) : undefined;

  useEffect(() => {
    if (activeGroupId && viewMode === 'chat') {
      api.get(`/groups/${activeGroupId}/messages`)
         .then(res => {
           setLocalMessages(Array.isArray(res.data) ? res.data : []);
           setTimeout(scrollToBottom, 100);
         })
         .catch(err => console.error(err));
      markAsRead(activeGroupId);
    }
  }, [activeGroupId, viewMode]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeGroupId) return;
    try {
      const { data: newMessage } = await api.post(`/groups/${activeGroupId}/messages`, {
        message: inputText,
        type: 'text'
      });
      setLocalMessages(prev => {
        if (prev.find(m => String(m._id) === String(newMessage._id))) return prev;
        return [...prev, newMessage];
      });
      setInputText('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    }
  };

  const currentUserId = user?._id || user?.id;

  if (viewMode === 'chat' && activeGroup) {
    return (
      <div className="mobile-shell" style={{ height: '100dvh', background: 'var(--mobile-bg)', display: 'flex', flexDirection: 'column' }}>
        <GroupChat group={activeGroup} onLeave={() => { setViewMode('list'); setActiveGroupId(null); fetchMyGroups(); }} />
      </div>
    );
  }

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 20px 0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Study Groups</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleDiscover}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: 'var(--mobile-shadow-card)' }}
            >
              <Search size={18} color="var(--mobile-text-secondary)" />
            </button>
            <button 
              onClick={() => setShowCreate(true)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 4px 12px rgba(255, 122, 89, 0.3)' }}
            >
              <Plus size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '0 20px' }}>
        {loadingGroups ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--mobile-text-tertiary)' }}>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--mobile-primary)] mb-4"></div>
            <p>Syncing groups...</p>
          </div>
        ) : myGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--mobile-text-tertiary)' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>You haven't joined any study groups yet.</p>
            <button 
              onClick={handleDiscover}
              style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '999px', background: 'var(--mobile-primary)', color: '#fff', fontWeight: 'bold', border: 'none' }}
            >
              Find a Group
            </button>
          </div>
        ) : (
          myGroups.map(group => (
            <div 
              key={group._id}
              onClick={() => {
                setActiveGroupId(group._id);
                setViewMode('chat');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--mobile-surface)', borderRadius: '16px', marginBottom: '12px', boxShadow: 'var(--mobile-shadow-card)' }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                  {group.name.substring(0,1).toUpperCase()}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {group.name}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 400, color: 'var(--mobile-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {group.lastMessage ? renderLastMessagePreview(group.lastMessage) : 'No messages yet'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--mobile-text-tertiary)' }}>
                  {group.lastMessage?.createdAt ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date(group.lastMessage.createdAt)) : ''}
                </div>
                {group.unreadCount > 0 && (
                  <div style={{ background: 'var(--mobile-danger)', color: '#fff', fontSize: '11px', fontWeight: 700, minHeight: '20px', padding: '0 8px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {group.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DISCOVER BOTTOM SHEET */}
      {showDiscover && (
        <>
          <div onClick={() => setShowDiscover(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--mobile-text-primary)' }}>Discover Groups</h3>
              <button onClick={() => setShowDiscover(false)} style={{ background: 'none', border: 'none', color: 'var(--mobile-text-secondary)' }}><X size={24} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 'env(safe-area-inset-bottom)' }}>
              {discoverGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--mobile-text-tertiary)' }}>No new groups found.</div>
              ) : (
                discoverGroups.map(group => (
                  <div key={group._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--mobile-border)' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--mobile-text-primary)' }}>{group.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mobile-text-secondary)' }}>{group.members?.length || 1} members</div>
                    </div>
                    <button 
                      onClick={() => handleJoin(group._id)}
                      style={{ padding: '8px 16px', borderRadius: '999px', background: 'var(--mobile-primary-subtle)', color: 'var(--mobile-primary)', fontWeight: 'bold', border: 'none' }}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* CREATE BOTTOM SHEET */}
      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--mobile-text-primary)' }}>Create Group</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--mobile-text-secondary)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--mobile-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Group Name</label>
                <input 
                  type="text" required placeholder="e.g. CS101 Study Buddies"
                  value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', color: 'var(--mobile-text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--mobile-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Privacy</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div 
                    onClick={() => setNewGroup({...newGroup, isPublic: true})}
                    style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', border: newGroup.isPublic ? '2px solid var(--mobile-primary)' : '1px solid var(--mobile-border)', background: newGroup.isPublic ? 'var(--mobile-primary-subtle)' : 'var(--mobile-bg)', color: newGroup.isPublic ? 'var(--mobile-primary)' : 'var(--mobile-text-secondary)', fontWeight: 'bold' }}
                  >
                    Public
                  </div>
                  <div 
                    onClick={() => setNewGroup({...newGroup, isPublic: false})}
                    style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', border: !newGroup.isPublic ? '2px solid var(--mobile-primary)' : '1px solid var(--mobile-border)', background: !newGroup.isPublic ? 'var(--mobile-primary-subtle)' : 'var(--mobile-bg)', color: !newGroup.isPublic ? 'var(--mobile-primary)' : 'var(--mobile-text-secondary)', fontWeight: 'bold' }}
                  >
                    Private
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--mobile-primary)', color: '#fff', fontWeight: 'bold', border: 'none', marginTop: '8px' }}
              >
                Create & Join
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
