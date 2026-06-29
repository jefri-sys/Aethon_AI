import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Search, Video, FileText, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import api from '../../../services/api';

export default function MobileResourceExplorer() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('All');
  const [type, setType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/resources/explore', {
        topic,
        experienceLevel: level === 'All' ? 'Beginner' : level, // fallback for API
        timeframe: ''
      });
      
      if (res.data.success && res.data.data) {
        // Flatten the roadmap into a simple list of resources for mobile display
        let allResources = [];
        res.data.data.roadmap.forEach(step => {
          if (step.resources) {
            allResources = [...allResources, ...step.resources];
          }
        });
        setResources(allResources);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to explore resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (resType) => {
    const t = (resType || '').toLowerCase();
    if (t.includes('video')) return <Video size={16} color="var(--mobile-danger)" />;
    if (t.includes('practice')) return <CheckCircle size={16} color="var(--mobile-success)" />;
    return <FileText size={16} color="var(--mobile-primary)" />;
  };

  const filteredResources = resources.filter(res => {
    if (type === 'All') return true;
    const t = (res.type || '').toLowerCase();
    if (type === 'Video' && t.includes('video')) return true;
    if (type === 'Article' && (t.includes('doc') || t.includes('tutorial') || t.includes('article'))) return true;
    if (type === 'Course' && t.includes('course')) return true;
    return false;
  });

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Resource Explorer</h1>
        <Compass color="var(--mobile-primary)" size={20} />
      </div>

      {/* SEARCH CARD */}
      <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '16px' }}>
          <input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Learn React, DBMS, Python..."
            style={{ width: '100%', padding: '16px 64px 16px 16px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
          />
          <button 
            type="submit"
            disabled={loading || !topic}
            style={{ position: 'absolute', right: '4px', top: '4px', width: '44px', height: '44px', borderRadius: '12px', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', opacity: (loading || !topic) ? 0.7 : 1 }}
          >
            <Search color="#fff" size={20} />
          </button>
        </form>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', borderRadius: '999px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}
          >
            <option value="All">Type: All</option>
            <option value="Course">Course</option>
            <option value="Article">Article</option>
            <option value="Video">Video</option>
          </select>

          <select 
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', borderRadius: '999px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}
          >
            <option value="All">Level: All</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>Curating resources...</div>
        ) : filteredResources.length === 0 ? (
          topic ? <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>No results found for your filters.</div> : null
        ) : (
          filteredResources.map((res, idx) => (
            <div 
              key={idx}
              onClick={() => window.open(res.url, '_blank')}
              style={{ background: 'var(--mobile-surface)', borderRadius: '20px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', gap: '12px', cursor: 'pointer' }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getIconForType(res.type)}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {res.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'var(--mobile-border)', fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-secondary)', textTransform: 'capitalize' }}>
                    {res.type}
                  </span>
                  {res.estimatedTime && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {res.estimatedTime}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink size={16} color="var(--mobile-text-tertiary)" style={{ alignSelf: 'center', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
