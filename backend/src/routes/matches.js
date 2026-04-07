const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../utils/db');

const router = express.Router();

// POST /api/matches/like
router.post('/like', auth, async (req, res) => {
  const { toUserId } = req.body;
  if (!toUserId) return res.status(400).json({ error: 'toUserId required' });

  try {
    await pool.query(
      'INSERT INTO likes (from_user, to_user) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.userId, toUserId]
    );

    // Check mutual like
    const mutual = await pool.query(
      'SELECT * FROM likes WHERE from_user = $1 AND to_user = $2',
      [toUserId, req.user.userId]
    );

    const isMatch = mutual.rows.length > 0;

    if (isMatch) {
      await pool.query(
        'UPDATE likes SET is_match = TRUE WHERE (from_user = $1 AND to_user = $2) OR (from_user = $2 AND to_user = $1)',
        [req.user.userId, toUserId]
      );
    }

    res.json({ success: true, isMatch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matches — get my matches
router.get('/', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.first_name, u.telegram_username, ph.url as primary_photo,
            l.created_at as matched_at
     FROM likes l
     JOIN users u ON u.id = CASE WHEN l.from_user = $1 THEN l.to_user ELSE l.from_user END
     LEFT JOIN photos ph ON ph.user_id = u.id AND ph.is_primary = TRUE
     WHERE (l.from_user = $1 OR l.to_user = $1) AND l.is_match = TRUE
     ORDER BY l.created_at DESC`,
    [req.user.userId]
  );
  res.json(result.rows);
});

module.exports = router;
