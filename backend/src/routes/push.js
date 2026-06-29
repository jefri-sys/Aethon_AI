const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');

router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    
    // Upsert subscription
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user.id, keys, userAgent },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe to push notifications' });
  }
});

router.get('/subscriptions', verifyToken, async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({ userId: req.user.id })
      .select('_id userAgent createdAt');
    res.json(subscriptions);
  } catch (error) {
    console.error('Fetch subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

router.delete('/subscriptions/:id', verifyToken, async (req, res) => {
  try {
    const result = await PushSubscription.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
