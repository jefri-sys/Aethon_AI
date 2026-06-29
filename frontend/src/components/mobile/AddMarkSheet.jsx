import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

const assessmentTypes = ['Assignment', 'Internal', 'Series', 'Lab', 'Project', 'Final'];
const gradesList = ['O', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'W', 'I', 'R'];

export default function AddMarkSheet({ subjectId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    assessmentType: '',
    grade: '',
    marksObtained: '',
    totalMarks: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assessmentType) {
      alert('Please select an assessment type.');
      return;
    }

    let payload = { subjectId, assessmentType: formData.assessmentType };
    
    if (formData.assessmentType === 'Final') {
      if (!formData.grade) {
        alert('Please select a grade for the final assessment.');
        return;
      }
      payload.grade = formData.grade;
    } else {
      if (formData.marksObtained === '' || formData.totalMarks === '') {
        alert('Please fill in both marks fields.');
        return;
      }
      payload.marksObtained = Number(formData.marksObtained);
      payload.totalMarks = Number(formData.totalMarks);
    }

    setLoading(true);
    try {
      await api.post('/marks', payload);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to add mark: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }} 
      />
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--mobile-surface)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          zIndex: 101,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.1)'
        }}
        className="animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--mobile-border)' }} />
        </div>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>
            Add Mark
          </h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <X size={18} color="var(--mobile-text-secondary)" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Assessment Type</label>
            <select 
              value={formData.assessmentType}
              onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
              style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)', appearance: 'none' }}
              required
            >
              <option value="">Select Type...</option>
              {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {formData.assessmentType === 'Final' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Grade</label>
              <select 
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)', appearance: 'none' }}
                required
              >
                <option value="">Select Grade...</option>
                {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Marks Obtained</label>
                <input 
                  type="number"
                  step="0.1"
                  required
                  value={formData.marksObtained}
                  onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Total Marks</label>
                <input 
                  type="number"
                  step="0.1"
                  required
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button 
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Adding...' : 'Add Mark'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
