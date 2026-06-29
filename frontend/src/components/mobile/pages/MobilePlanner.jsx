import React from 'react';
import { Sparkles, Flame, ArrowUp, Minus, Pin, Upload, Trash2 } from 'lucide-react';
import MobileFocusMode from './MobileFocusMode.jsx';

export default function MobilePlanner({
  activeTab,
  setActiveTab,
  tasks = [],
  handleOpenModal,
  setCustomPlanOpen,
  togglePin,
  coverTopic,
  updateStatus,
  deleteAllTasks
}) {
  const toggleTaskStatus = (taskId, status) => {
    if (updateStatus) {
      updateStatus(taskId, status === 'Completed' ? 'Pending' : 'Completed');
    }
  };
  const groupedTasks = {
    'Critical': [],
    'High': [],
    'Medium': [],
    'Low': []
  };

  tasks.forEach(t => {
    if (t.status !== 'Completed') {
      const p = t.priorityLabel || 'Low';
      if (groupedTasks[p]) {
        groupedTasks[p].push(t);
      } else {
        groupedTasks['Low'].push(t);
      }
    }
  });

  Object.keys(groupedTasks).forEach(k => {
    groupedTasks[k].sort((a, b) => (b.pinnedByUser ? 1 : 0) - (a.pinnedByUser ? 1 : 0));
  });

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* 1. HEADER */}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Planner</h1>
          {activeTab === 'tasks' && (
            <button 
              onClick={deleteAllTasks}
              style={{ background: 'var(--mobile-danger-subtle)', border: 'none', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={20} color="var(--mobile-danger)" />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '12px 20px', borderRadius: '999px', fontSize: '14px', fontWeight: 600,
              background: activeTab === 'tasks' ? 'var(--mobile-primary)' : 'var(--mobile-surface)',
              color: activeTab === 'tasks' ? '#fff' : 'var(--mobile-text-secondary)',
              border: activeTab === 'tasks' ? 'none' : '1px solid var(--mobile-border)'
            }}
          >
            Smart Tasks
          </button>
          <button
            onClick={() => setActiveTab('focus')}
            style={{
              padding: '12px 20px', borderRadius: '999px', fontSize: '14px', fontWeight: 600,
              background: activeTab === 'focus' ? 'var(--mobile-primary)' : 'var(--mobile-surface)',
              color: activeTab === 'focus' ? '#fff' : 'var(--mobile-text-secondary)',
              border: activeTab === 'focus' ? 'none' : '1px solid var(--mobile-border)'
            }}
          >
            Focus Mode
          </button>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* 2. AI GENERATE CARD */}
          <div style={{ padding: '0 20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--mobile-secondary-subtle) 0%, #FCEAE3 100%)',
              borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--mobile-secondary)" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>AI Study Plan</h2>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 400, color: 'var(--mobile-text-secondary)', marginTop: '6px' }}>
                Based on your syllabus and exam dates
              </div>
              <button 
                onClick={handleOpenModal}
                style={{
                  width: '100%', background: 'var(--mobile-primary)', color: '#fff', borderRadius: '18px',
                  padding: '14px 0', fontSize: '15px', fontWeight: 600, marginTop: '16px', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Sparkles size={18} /> Generate Plan
              </button>
            </div>
          </div>

          {/* 3. TASK SECTIONS */}
          <div style={{ paddingBottom: '20px' }}>
            {['Critical', 'High', 'Medium', 'Low'].map(priority => {
              const group = groupedTasks[priority];
              if (group.length === 0) return null;

              let icon, color, titleStyle;
              if (priority === 'Critical') {
                icon = <Flame size={16} color="var(--mobile-danger)" />;
                color = 'var(--mobile-danger)';
                titleStyle = { fontSize: '16px', fontWeight: 700, color };
              } else if (priority === 'High') {
                icon = <ArrowUp size={16} color="var(--mobile-warning)" />;
                color = 'var(--mobile-warning)';
                titleStyle = { fontSize: '16px', fontWeight: 700, color };
              } else if (priority === 'Medium') {
                icon = <Minus size={15} color="var(--mobile-text-secondary)" />;
                color = 'var(--mobile-text-secondary)';
                titleStyle = { fontSize: '15px', fontWeight: 600, color };
              } else {
                titleStyle = { fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' };
              }

              return (
                <div key={priority}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', marginTop: '20px', marginBottom: '8px' }}>
                    {icon}
                    <span style={titleStyle}>{priority}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 20px' }}>
                    {group.map(task => (
                      <div key={task._id} style={{ background: 'var(--mobile-surface)', borderRadius: '20px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div 
                          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task._id, task.status); }}
                          style={{ 
                            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '2px', 
                            border: task.status === 'Completed' ? 'none' : '2px solid var(--mobile-border)',
                            background: task.status === 'Completed' ? 'var(--mobile-primary)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          {task.status === 'Completed' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--mobile-text-primary)', textDecoration: task.status === 'Completed' ? 'line-through' : 'none', opacity: task.status === 'Completed' ? 0.6 : 1 }}>{task.title}</div>
                          <div style={{ fontSize: '12px', fontWeight: 400, color: 'var(--mobile-text-tertiary)', marginTop: '3px' }}>
                            {task.subjectName || 'General'} • {task.estimatedHours || 1}h
                          </div>
                          {task.topics && task.topics.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                              {task.topics.map(topic => {
                                const isCovered = task.coveredTopics?.includes(topic);
                                return (
                                  <div 
                                    key={topic}
                                    onClick={() => !isCovered && coverTopic(task._id, topic)}
                                    style={{
                                      background: isCovered ? 'var(--mobile-primary)' : 'var(--mobile-surface)',
                                      color: isCovered ? '#fff' : 'var(--mobile-text-secondary)',
                                      border: isCovered ? 'none' : '1px solid var(--mobile-border)',
                                      borderRadius: '999px', padding: '4px 10px', fontSize: '11px', fontWeight: 600
                                    }}
                                  >
                                    {topic}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div onClick={() => togglePin(task._id)} style={{ padding: '4px' }}>
                          <Pin size={14} color={task.pinnedByUser ? 'var(--mobile-primary)' : 'var(--mobile-text-tertiary)'} fill={task.pinnedByUser ? 'var(--mobile-primary)' : 'none'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. FLOATING PDF PLAN BUTTON */}
          <button 
            onClick={() => setCustomPlanOpen(true)}
            style={{
              position: 'fixed', bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)', left: '50%', transform: 'translateX(-50%)',
              borderRadius: '999px', background: 'var(--mobile-primary)', color: '#fff', border: 'none',
              padding: '14px 24px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0px 6px 16px rgba(255,122,89,0.35)', zIndex: 50
            }}
          >
            <Upload size={14} /> Custom PDF Plan
          </button>
        </>
      )}

      {activeTab === 'focus' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <MobileFocusMode />
        </div>
      )}
    </div>
  );
}
