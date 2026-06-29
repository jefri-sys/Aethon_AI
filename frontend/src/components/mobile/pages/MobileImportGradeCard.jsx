import React, { useState } from 'react';
import { ArrowLeft, UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function MobileImportGradeCard({ onBack }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [previewData, setPreviewData] = useState(null);
  const [previewSubjects, setPreviewSubjects] = useState([]);
  
  const [importStats, setImportStats] = useState({ created: 0 });

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/subjects/import-grade-card', formData);
      
      setPreviewData(res.data.preview);
      setPreviewSubjects(res.data.preview.subjects);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      // Sanitize subjects to ensure credits >= 1 to pass backend validation
      const sanitizedSubjects = previewSubjects.map(s => ({
        ...s,
        credits: Math.max(1, Number(s.credits) || 1)
      }));

      const res = await api.post('/subjects/confirm-import', {
        subjects: sanitizedSubjects,
        semester: selectedSemester
      });
      setImportStats({ created: res.data.created });
      setStep(3);
    } catch (err) {
      alert('Failed to import subjects: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewData(null);
    setPreviewSubjects([]);
    setError('');
    setStep(1);
  };

  return (
    <div className="mobile-shell" style={{ minHeight: '100dvh', background: 'var(--mobile-bg)', overflowY: 'auto', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px', position: 'sticky', top: 0, background: 'var(--mobile-bg)', zIndex: 10 }}>
        <button onClick={() => step === 1 ? onBack() : step === 2 ? setStep(1) : onBack()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0, marginRight: '40px' }}>Import Grade Card</h1>
      </div>

      <div style={{ padding: '0 20px 80px 20px' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--mobile-shadow-card)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '16px' }}>Target Semester</h3>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-border)', fontSize: '16px', color: 'var(--mobile-text-primary)', outline: 'none' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            </div>

            <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--mobile-shadow-card)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '16px' }}>Upload PDF</h3>
              
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', border: '2px dashed var(--mobile-primary)', borderRadius: '16px', background: 'var(--mobile-primary-subtle)', cursor: 'pointer', textAlign: 'center' }}>
                <UploadCloud color="var(--mobile-primary)" size={48} style={{ marginBottom: '12px' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mobile-primary)', marginBottom: '4px' }}>Tap to select PDF</span>
                <span style={{ fontSize: '13px', color: 'var(--mobile-text-secondary)' }}>Max 10MB</span>
                <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>

              {file && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--mobile-bg)', borderRadius: '16px', border: '1px solid var(--mobile-border)', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <FileText color="var(--mobile-primary)" size={24} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mobile-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{file.name}</span>
                  </div>
                  <CheckCircle color="var(--mobile-success)" size={20} />
                </div>
              )}
              
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'var(--mobile-danger-subtle)', borderRadius: '12px', marginTop: '16px' }}>
                  <AlertCircle color="var(--mobile-danger)" size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--mobile-danger)', lineHeight: 1.4 }}>{error}</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleExtract}
              disabled={!file || loading}
              style={{ width: '100%', padding: '18px', borderRadius: '999px', background: !file || loading ? 'var(--mobile-border)' : 'var(--mobile-primary)', color: !file || loading ? 'var(--mobile-text-tertiary)' : '#fff', fontSize: '16px', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center' }}
            >
              {loading ? 'Reading grade card...' : 'Extract Subjects'}
            </button>
          </div>
        )}

        {step === 2 && previewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--mobile-success-subtle)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <CheckCircle color="var(--mobile-success)" size={32} />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-success)' }}>Found {previewData.count} subjects</h2>
                <p style={{ fontSize: '13px', color: 'var(--mobile-success)', marginTop: '4px' }}>SGPA {previewData.sgpa || 'Unknown'}</p>
              </div>
            </div>

            <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--mobile-shadow-card)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)', marginBottom: '8px' }}>Review Subjects</h3>
              <p style={{ fontSize: '13px', color: 'var(--mobile-text-secondary)', marginBottom: '20px' }}>Preview extracted grades below. Editing is available on the desktop website.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {previewSubjects.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--mobile-bg)', borderRadius: '16px', border: '1px solid var(--mobile-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden', paddingRight: '12px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mobile-text-tertiary)' }}>{s.code} • {s.credits} Credits</div>
                    </div>
                    <div style={{ background: 'var(--mobile-success-subtle)', color: 'var(--mobile-success)', padding: '4px 12px', borderRadius: '999px', fontSize: '14px', fontWeight: 700 }}>
                      {s.grade}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleConfirmImport}
              disabled={loading}
              style={{ width: '100%', padding: '18px', borderRadius: '999px', background: loading ? 'var(--mobile-border)' : 'var(--mobile-primary)', color: loading ? 'var(--mobile-text-tertiary)' : '#fff', fontSize: '16px', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center' }}
            >
              {loading ? 'Saving subjects...' : `Import ${previewSubjects.length} Subjects`}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--mobile-surface)', borderRadius: '24px', boxShadow: 'var(--mobile-shadow-card)', marginTop: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--mobile-success-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle color="var(--mobile-success)" size={40} />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>Success!</h2>
              <p style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)', marginTop: '8px' }}>{importStats.created} subjects have been imported to Semester {selectedSemester}.</p>
            </div>
            
            <button 
              onClick={onBack}
              style={{ width: '100%', padding: '18px', borderRadius: '999px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', marginTop: '16px' }}
            >
              Go to Academics
            </button>
            <button 
              onClick={resetAll}
              style={{ width: '100%', padding: '18px', borderRadius: '999px', background: 'transparent', color: 'var(--mobile-text-primary)', fontSize: '16px', fontWeight: 700, border: '2px solid var(--mobile-border)' }}
            >
              Import Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
