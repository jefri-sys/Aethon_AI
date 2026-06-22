const express = require('express');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const { normalizeCustomInstruction } = require('../services/aiPreferenceNormalizer');

const router = express.Router();

// GET /api/settings/ai-preferences
router.get('/ai-preferences', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('aiPreferences');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user.aiPreferences || {});
  } catch (error) {
    console.error('Failed to get ai preferences', error);
    res.status(500).json({ error: 'Server error fetching preferences' });
  }
});

// PUT /api/settings/ai-preferences/:scope
router.put('/ai-preferences/:scope', verifyToken, async (req, res) => {
  try {
    const { scope } = req.params;
    const { text } = req.body;
    
    if (!['global', 'notebook', 'planner', 'resourceExplorer'].includes(scope)) {
      return res.status(400).json({ error: 'Invalid scope' });
    }

    const normalizedText = await normalizeCustomInstruction(text, scope);
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.aiPreferences) {
      user.aiPreferences = {};
    }
    
    user.aiPreferences[scope] = {
      raw: text || '',
      normalized: normalizedText || '',
      updatedAt: new Date()
    };

    await user.save();
    
    res.json(user.aiPreferences[scope]);
  } catch (error) {
    console.error(`Failed to update ai preferences for scope ${req.params.scope}`, error);
    res.status(500).json({ error: 'Server error updating preferences' });
  }
});

// DELETE /api/settings/ai-preferences/:scope
router.delete('/ai-preferences/:scope', verifyToken, async (req, res) => {
  try {
    const { scope } = req.params;
    
    if (!['global', 'notebook', 'planner', 'resourceExplorer'].includes(scope)) {
      return res.status(400).json({ error: 'Invalid scope' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.aiPreferences) {
      user.aiPreferences = {};
    }
    
    user.aiPreferences[scope] = {
      raw: '',
      normalized: '',
      updatedAt: undefined
    };

    await user.save();
    
    res.json(user.aiPreferences[scope]);
  } catch (error) {
    console.error(`Failed to reset ai preferences for scope ${req.params.scope}`, error);
    res.status(500).json({ error: 'Server error resetting preferences' });
  }
});

module.exports = router;
