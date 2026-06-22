import React, { useState } from 'react';
import { Shield, X, Save } from 'lucide-react';
import api from '../../services/api';

const GroupPermissionsPanel = ({ group, onClose, onUpdate }) => {
  const [permissions, setPermissions] = useState(group.permissions || {});
  const [isSaving, setIsSaving] = useState(false);

  const toggleRole = (action, role) => {
    setPermissions(prev => {
      const currentRoles = prev[action]?.allowedRoles || [];
      const newRoles = currentRoles.includes(role) 
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];
        
      return {
        ...prev,
        [action]: { ...prev[action], allowedRoles: newRoles }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.patch(`/groups/${group._id}/permissions`, permissions);
      onUpdate(res.data.permissions);
      onClose();
    } catch (err) {
      alert('Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const renderRoleToggle = (action, label) => {
    const currentRoles = permissions[action]?.allowedRoles || [];
    return (
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
          {['creator', 'admin', 'moderator', 'member'].map(role => (
            <button
              key={role}
              onClick={() => role !== 'creator' && toggleRole(action, role)}
              disabled={role === 'creator'}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
                currentRoles.includes(role)
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              } ${role === 'creator' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90%] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-600" /> Group Permissions
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {renderRoleToggle('sendText', 'Who can send text messages?')}
          {renderRoleToggle('sendVoice', 'Who can send voice notes?')}
          {renderRoleToggle('sendMedia', 'Who can send images & videos?')}
          {renderRoleToggle('sendFiles', 'Who can send documents?')}
          {renderRoleToggle('sendLinks', 'Who can send links?')}
          {renderRoleToggle('addMembers', 'Who can add new members?')}
          {renderRoleToggle('removeMembers', 'Who can remove members?')}
          {renderRoleToggle('muteMember', 'Who can mute members?')}
          {renderRoleToggle('editGroupInfo', 'Who can edit group info?')}
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Slow Mode (Seconds)</label>
            <select
              value={permissions.slowMode || 0}
              onChange={(e) => setPermissions(p => ({ ...p, slowMode: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value={0}>Off</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1 min</option>
              <option value={300}>5 min</option>
            </select>
          </div>
        </div>
        
        <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupPermissionsPanel;
