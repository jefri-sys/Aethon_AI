import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, File, FileType2, Trash2, X, UploadCloud, BookText } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

export default function MobileNotebook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [notebooks, setNotebooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Upload sheet state
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nbRes, subRes] = await Promise.all([
        api.get('/notebooks'),
        api.get('/subjects')
      ]);
      setNotebooks(nbRes.data.notebooks || []);
      setSubjects(subRes.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    if (subjectId) formData.append('subjectId', subjectId);

    try {
      await api.post('/notebooks/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setShowUpload(false);
      setTitle('');
      setFile(null);
      setSubjectId('');
      fetchData();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notebook?')) return;
    try {
      await api.delete(`/notebooks/${id}`);
      setNotebooks(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notebook', err);
    }
  };

  const filteredNotebooks = notebooks.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  const tokensUsed = (user?.aiTokensUsed || 0) / 1000;
  const tokenLimit = (user?.aiTokenLimit || 500000) / 1000;
  const tokenPercent = Math.min(100, (tokensUsed / tokenLimit) * 100);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Notebook</h1>
        <button 
          onClick={() => setShowUpload(true)}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)' }}
        >
          <Plus color="#fff" size={24} />
        </button>
      </div>

      {/* AI TOKEN USAGE INDICATOR */}
      <div style={{ background: 'var(--mobile-surface)', borderRadius: '16px', padding: '12px 16px', boxShadow: 'var(--mobile-shadow-card)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>AI Usage</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>{tokensUsed.toFixed(1)}k / {tokenLimit.toFixed(0)}k tokens</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--mobile-border)', borderRadius: '999px' }}>
          <div style={{ height: '100%', borderRadius: '999px', width: `${tokenPercent}%`, background: 'var(--mobile-primary)' }} />
        </div>
      </div>

      {/* SEARCH INPUT CARD */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
          <Search color="var(--mobile-text-tertiary)" size={20} />
        </div>
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notebooks..."
          style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: 'none', background: 'var(--mobile-surface)', fontSize: '15px', color: 'var(--mobile-text-primary)', boxShadow: 'var(--mobile-shadow-card)' }}
        />
      </div>

      {/* NOTEBOOK CARDS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '20px' }}>Loading...</div>
        ) : filteredNotebooks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <BookText size={48} color="var(--mobile-border)" style={{ marginBottom: '16px' }} />
            <div>No notebooks found.</div>
          </div>
        ) : (
          filteredNotebooks.map(nb => (
            <div 
              key={nb._id}
              onClick={() => navigate(`/notebook/${nb._id}`)} // Redirect to desktop reader for now
              style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', cursor: 'pointer', display: 'flex', gap: '16px' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: nb.fileType === 'pdf' ? 'var(--mobile-danger-subtle)' : 'var(--mobile-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {nb.fileType === 'pdf' ? <FileType2 color="var(--mobile-danger)" size={24} /> : <File color="var(--mobile-primary)" size={24} />}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mobile-text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
                    {nb.title}
                  </h3>
                  <button onClick={(e) => handleDelete(e, nb._id)} style={{ padding: '4px', background: 'none', border: 'none' }}>
                    <Trash2 size={16} color="var(--mobile-danger)" />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', background: 'var(--mobile-border)', fontSize: '11px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>
                    {subjects.find(s => s._id === nb.subjectId)?.name || 'General Notes'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--mobile-text-tertiary)' }}>
                    Uploaded {new Date(nb.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPLOAD SHEET */}
      {showUpload && (
        <>
          <div 
            onClick={() => !uploading && setShowUpload(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(4px)' }} 
          />
          <div 
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--mobile-surface)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', zIndex: 101, padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}
            className="animate-in slide-in-from-bottom duration-300"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Upload Notebook</h2>
              <button onClick={() => !uploading && setShowUpload(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <X size={18} color="var(--mobile-text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Notebook Title</label>
                <input 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Physics Chapter 3 Notes"
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Subject (Optional)</label>
                <select 
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
                >
                  <option value="">General (No Subject)</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Document (PDF or DOCX)</label>
                <div style={{ border: '2px dashed var(--mobile-border)', borderRadius: '16px', padding: '24px', textAlign: 'center', position: 'relative' }}>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                  <UploadCloud color={file ? 'var(--mobile-primary)' : 'var(--mobile-text-tertiary)'} size={32} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: file ? 'var(--mobile-primary)' : 'var(--mobile-text-secondary)' }}>
                    {file ? file.name : 'Click to select file'}
                  </div>
                </div>
              </div>

              {uploading && (
                <div style={{ width: '100%', height: '8px', background: 'var(--mobile-border)', borderRadius: '999px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--mobile-primary)', transition: 'width 0.3s' }} />
                </div>
              )}

              <button 
                type="submit"
                disabled={!file || uploading}
                style={{ marginTop: '16px', width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', opacity: (!file || uploading) ? 0.7 : 1 }}
              >
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
