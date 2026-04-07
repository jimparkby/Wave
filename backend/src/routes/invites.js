const express = require('express');
const auth = require('../middleware/auth');
const { createInvite } = require('../utils/inviteGenerator');
const pool = require('../utils/db');

const router = express.Router();

// Generate new invite code (authenticated users only)
router.post('/generate', auth, async (req, res) => {
  try {
    const invite = await createInvite(req.user.userId, 30);
    res.json({
      code: invite.code,
      link: `${process.env.FRONTEND_URL}/invite/${invite.code}`,
      expiresAt: invite.expires_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate invite' });
  }
});

// Get my generated invites
router.get('/my', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT code, is_used, expires_at, created_at FROM invites
     WHERE created_by = $1 ORDER BY created_at DESC`,
    [req.user.userId]
  );
  res.json(result.rows);
});

module.exports = router;
