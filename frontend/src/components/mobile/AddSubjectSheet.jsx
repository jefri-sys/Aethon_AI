import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import api from '../../services/api';

export default function AddSubjectSheet({ onClose, onSuccess, activeSemesterId, initialData }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    code: initialData?.code || '',
    credits: initialData?.credits || 4,
    type: initialData?.type || 'Core',
    professor: initialData?.professor || '',
    color: initialData?.color || '#FF7A59',
    semester: initialData?.semester || 1
  });

  const [loading, setLoading] = useState(false);

  const colors = [
    '#FF7A59', // coral
    '#7C6FF0', // violet
    '#34D399', // success
    '#F2A93B', // warning
    '#60A5FA', // blue
    '#F472B6'  // pink
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setLoading(true);
    try {
      const payload = { 
        name: formData.name,
        code: formData.code,
        credits: formData.credits,
        type: formData.type,
        professor: formData.professor,
        semester: formData.semester
      };
      
      if (activeSemesterId && !initialData) {
        payload.semesterId = activeSemesterId;
      }
      
      if (initialData && initialData._id) {
        await api.put(`/subjects/${initialData._id}`, payload);
      } else {
        await api.post('/subjects', payload);
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to add subject', err);
      alert('Failed to add subject. Please try again.');
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
          height: '85vh',
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
            Add Subject
          </h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <X size={18} color="var(--mobile-text-secondary)" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Subject Name *</label>
            <input 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Database Systems"
              style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Subject Code</label>
              <input 
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="CS301"
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Credits</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: Math.max(1, Number(e.target.value)) })}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
              />
            </div>
          </div>

          {!activeSemesterId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Semester</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Type</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)', appearance: 'none' }}
            >
              <option value="Core">Core</option>
              <option value="Elective">Elective</option>
              <option value="Lab">Lab</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Professor</label>
            <input 
              value={formData.professor}
              onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
              placeholder="e.g. Dr. Alan Turing"
              style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Color</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {colors.map(color => (
                <div 
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: color, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: formData.color === color ? `0 0 0 2px var(--mobile-surface), 0 0 0 4px ${color}` : 'none'
                  }}
                >
                  {formData.color === color && <Check size={16} color="#fff" />}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button 
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Subject'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
