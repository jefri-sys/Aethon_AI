const getMember = (group, userId) => {
  if (!group || !group.members) return null;
  const targetIdStr = userId.toString();
  return group.members.find(m => {
    const idStr = (m.userId._id || m.userId).toString();
    return idStr === targetIdStr;
  });
};

const hasPermission = (group, userId, action) => {
  const member = getMember(group, userId);
  if (!member) return false;
  
  const role = member.role || 'member';
  
  // Creator can do anything by default, even if not explicitly listed in allowedRoles.
  // Wait, let's respect allowedRoles explicitly as requested by the prompt.
  const permission = group.permissions?.[action];
  if (!permission || !permission.allowedRoles) return false;
  
  return permission.allowedRoles.includes(role);
};

const canManageRole = (actorRole, targetRole) => {
  if (actorRole === 'creator') return true; // Creator manages everyone
  if (actorRole === 'admin') {
    return targetRole === 'moderator' || targetRole === 'member';
  }
  if (actorRole === 'moderator') {
    return targetRole === 'member';
  }
  return false;
};

const isMuted = (member) => {
  if (!member || !member.mutedUntil) return false;
  return new Date(member.mutedUntil) > new Date();
};

module.exports = {
  getMember,
  hasPermission,
  canManageRole,
  isMuted
};
