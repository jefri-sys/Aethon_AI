// Run with: node scripts/migrateStudyGroupRoles.js
require('dotenv').config();
const mongoose = require('mongoose');
const StudyGroup = require('../src/models/StudyGroup');

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const groups = await StudyGroup.find({});
    console.log(`Found ${groups.length} groups to process.`);

    for (const group of groups) {
      let isModified = false;

      // Initialize permissions if not exist or missing fields
      if (!group.permissions || !group.permissions.sendText) {
        group.permissions = {
          sendText: { allowedRoles: ['creator', 'admin', 'moderator', 'member'] },
          sendVoice: { allowedRoles: ['creator', 'admin', 'moderator'] },
          sendMedia: { allowedRoles: ['creator', 'admin', 'moderator'] },
          sendFiles: { allowedRoles: ['creator', 'admin', 'moderator'] },
          sendLinks: { allowedRoles: ['creator', 'admin', 'moderator', 'member'] },
          reactToMessages: { allowedRoles: ['creator', 'admin', 'moderator', 'member'] },
          addMembers: { allowedRoles: ['creator', 'admin'] },
          removeMembers: { allowedRoles: ['creator', 'admin'] },
          deleteAnyMessage: { allowedRoles: ['creator', 'admin'] },
          pinMessages: { allowedRoles: ['creator', 'admin', 'moderator'] },
          muteMember: { allowedRoles: ['creator', 'admin', 'moderator'] },
          editGroupInfo: { allowedRoles: ['creator', 'admin'] },
          slowMode: 0
        };
        isModified = true;
      }

      // Check member roles
      let hasCreator = false;
      for (const member of group.members) {
        const userIdStr = (member.userId._id || member.userId).toString();
        const createdByStr = group.createdBy.toString();

        if (userIdStr === createdByStr) {
          if (member.role !== 'creator') {
            member.role = 'creator';
            isModified = true;
          }
          hasCreator = true;
        } else if (!member.role || member.role === 'creator') {
          // If a non-creator has 'creator' role or no role, fix it
          member.role = 'member';
          isModified = true;
        }
      }

      // Fallback: if somehow createdBy user is not in members array
      if (!hasCreator && group.createdBy) {
        group.members.push({
          userId: group.createdBy,
          role: 'creator',
          joinedAt: new Date()
        });
        isModified = true;
      }

      if (isModified) {
        await group.save();
        console.log(`Migrated group: ${group.name}`);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
