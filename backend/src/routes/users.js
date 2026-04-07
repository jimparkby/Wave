const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../utils/db');

const router = express.Router();

// GET /api/users/feed — browse profiles
router.get('/feed', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.is_verified,
              p.age, p.city, p.bio, p.hobbies,
              ph.url as primary_photo
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN photos ph ON ph.user_id = u.id AND ph.is_primary = TRUE
       WHERE u.id != $1
         AND u.sleep_mode = FALSE
         AND u.id NOT IN (
           SELECT to_user FROM likes WHERE from_user = $1
         )
       ORDER BY u.last_active DESC
       LIMIT 20`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
