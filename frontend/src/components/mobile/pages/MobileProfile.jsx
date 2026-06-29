import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Edit3, Moon, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth.js';
import api from '../../../services/api';

export default function MobileProfile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  
  const [profile, setProfile] = useState({
    name: user?.name || '', college: user?.college || '', course: user?.course || '', semester: user?.semester || '', targetCGPA: user?.targetCGPA || '', theme: user?.theme || 'light', avatar: user?.avatar || user?.profilePicture || ''
  });
  
  const [stats, setStats] = useState({
    cgpa: 0, dayStreak: 0, tasksDone: 0
  });

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data.success) {
          const u = profileRes.data.user;
          setProfile(prev => ({ ...prev, ...u, avatar: u.avatar || u.profilePicture }));
        }

        const [cgpaRes, habitsRes, tasksRes] = await Promise.allSettled([
          api.get("/academics/cgpa"),
          api.get("/habits/analytics"),
          api.get("/tasks/today") // Or tasks total if we have an endpoint, but tasks/today is from dashboard
        ]);

        const cgpa = cgpaRes.status === "fulfilled" && cgpaRes.value?.data?.success ? cgpaRes.value.data.cgpa : 0;
        const streak = habitsRes.status === "fulfilled" && habitsRes.value?.data?.success ? habitsRes.value.data.analytics?.bestStreak || 0 : 0;
        const tasks = tasksRes.status === "fulfilled" && tasksRes.value?.data?.success ? tasksRes.value.data.tasks?.filter(t => t.status === 'Completed').length || 0 : 0;
        
        setStats({ cgpa, dayStreak: streak, tasksDone: tasks });

      } catch (err) {
        console.error('Failed to fetch profile data', err);
      }
    };
    fetchProfileAndStats();
  }, []);

  const handleThemeToggle = async () => {
    const newTheme = profile.theme === 'light' ? 'dark' : 'light';
    setProfile({ ...profile, theme: newTheme });
    if (user) updateUser({ ...user, theme: newTheme });
    if (newTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try {
      await api.patch('/users/profile', { theme: newTheme });
    } catch (err) {
      console.error('Failed to save theme', err);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
        <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', position: 'absolute', left: 0, zIndex: 1 }}>
          <ArrowLeft color="var(--mobile-text-primary)" size={20} />
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Profile</h1>
      </div>

      {/* PROFILE HERO */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '16px' }}>
          {profile.avatar ? (
            <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--mobile-primary)', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--mobile-primary)', background: 'var(--mobile-secondary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 600, color: 'var(--mobile-secondary)' }}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
          <div onClick={() => navigate('/settings')} style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--mobile-bg)' }}>
            <Edit3 color="#fff" size={14} />
          </div>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: '0 0 4px 0' }}>{profile.name || 'Student'}</h2>
        <p style={{ fontSize: '13px', color: 'var(--mobile-text-secondary)', margin: 0 }}>
          {profile.college || 'Add College'} • {profile.course || 'Course'} Sem {profile.semester || '-'}
        </p>
      </div>

      {/* QUICK STATS ROW */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-primary)' }}>{stats.cgpa !== null ? stats.cgpa : '—'}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginTop: '4px' }}>CGPA</div>
        </div>
        <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-warning)' }}>{stats.dayStreak}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginTop: '4px' }}>Day Streak</div>
        </div>
        <div style={{ flex: 1, background: 'var(--mobile-surface)', borderRadius: '16px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mobile-secondary)' }}>{stats.tasksDone}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', marginTop: '4px' }}>Tasks Done</div>
        </div>
      </div>

      {/* ACCOUNT DETAILS CARD */}
      <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '8px 20px', boxShadow: 'var(--mobile-shadow-card)', marginBottom: '16px' }}>
        {[
          { label: 'Email', value: user?.email || 'N/A' },
          { label: 'College', value: profile.college || 'N/A' },
          { label: 'Course & Semester', value: `${profile.course || '-'}, Sem ${profile.semester || '-'}` },
          { label: 'Target CGPA', value: profile.targetCGPA || 'N/A' }
        ].map((item, idx, arr) => (
          // Fallback to desktop settings for now as requested
          <div key={idx} onClick={() => navigate('/settings')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx < arr.length - 1 ? '1px solid var(--mobile-border)' : 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>{item.label}</span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--mobile-text-primary)' }}>{item.value}</span>
            </div>
            <ChevronRight color="var(--mobile-text-tertiary)" size={20} />
          </div>
        ))}
      </div>

      {/* PREFERENCES CARD */}
      <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '8px 20px', boxShadow: 'var(--mobile-shadow-card)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--mobile-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--mobile-secondary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Moon color="var(--mobile-secondary)" size={18} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Dark Mode</span>
          </div>
          <div onClick={handleThemeToggle} style={{ width: '48px', height: '26px', borderRadius: '999px', background: profile.theme === 'dark' ? 'var(--mobile-primary)' : 'var(--mobile-border)', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', transition: 'background 0.3s' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', transform: profile.theme === 'dark' ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s' }} />
          </div>
        </div>
        <div onClick={() => navigate('/settings', { state: { activeTab: 'notifications' } })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--mobile-warning-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon color="var(--mobile-warning)" size={18} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Notification Settings</span>
          </div>
          <ChevronRight color="var(--mobile-text-tertiary)" size={20} />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => navigate('/settings')} style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '15px', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Edit3 size={18} /> Edit Profile
        </button>
        <button onClick={() => logout()} style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'transparent', color: 'var(--mobile-danger)', fontSize: '15px', fontWeight: 600, border: '1.5px solid var(--mobile-danger-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
