import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

export default function AddSemesterSheet({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    semesterNumber: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    isActive: false
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.semesterNumber || !formData.academicYear) return;
    
    setLoading(true);
    try {
      const payload = { 
        ...formData,
        semesterNumber: Number(formData.semesterNumber)
      };
      
      const res = await api.post('/semesters', payload);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to add semester', err);
      alert(err.response?.data?.message || 'Failed to add semester. Please try again.');
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
          height: '75vh',
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
            Add Semester
          </h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <X size={18} color="var(--mobile-text-secondary)" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Semester No. *</label>
              <input 
                type="number"
                min="1"
                max="10"
                required
                value={formData.semesterNumber}
                onChange={(e) => setFormData({ ...formData, semesterNumber: e.target.value })}
                placeholder="e.g. 3"
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Academic Year *</label>
              <input 
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="e.g. 2025-2026"
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>Start Date</label>
              <input 
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)' }}>End Date</label>
              <input 
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-bg)', fontSize: '15px', color: 'var(--mobile-text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px', padding: '12px', background: 'var(--mobile-bg)', borderRadius: '16px', border: '1px solid var(--mobile-border)' }}>
            <input 
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: 'var(--mobile-primary)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label htmlFor="isActiveCheck" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Set as Current Semester</label>
              <span style={{ fontSize: '12px', color: 'var(--mobile-text-tertiary)' }}>Check this only if you are currently studying in this semester.</span>
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button 
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Semester'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
