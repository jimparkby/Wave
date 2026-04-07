const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const { validateInvite, markInviteUsed } = require('../utils/inviteGenerator');

const router = express.Router();

/**
 * Verify Telegram Login Widget data
 * https://core.telegram.org/widgets/login
 */
function verifyTelegramAuth(data) {
  const { hash, ...rest } = data;
  const secretKey = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const checkString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');

  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  if (hmac !== hash) return false;

  // Check auth is not older than 24h
  const authDate = parseInt(rest.auth_date);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) return false;

  return true;
}

/**
 * POST /api/auth/telegram
 * Body: { telegramData, inviteCode, acceptedPrivacy }
 *
 * First-time flow:
 *   1. Validate invite code
 *   2. Verify Telegram auth
 *   3. Create or find user
 *   4. Mark invite used
 *   5. Return JWT
 *
 * Return flow (no invite needed):
 *   1. Verify Telegram auth
 *   2. Find existing user
 *   3. Return JWT
 */
router.post('/telegram', async (req, res) => {
  try {
    const { telegramData, inviteCode, acceptedPrivacy } = req.body;

    if (!telegramData) return res.status(400).json({ error: 'No telegram data' });

    if (!verifyTelegramAuth(telegramData)) {
      return res.status(401).json({ error: 'Invalid Telegram auth' });
    }

    const tgId = telegramData.id;

    // Check if user already exists
    let userResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [tgId]
    );

    let user = userResult.rows[0];

    if (!user) {
      // New user — need invite code
      if (!inviteCode) {
        return res.status(403).json({ error: 'Invite code required' });
      }

      const invite = await validateInvite(inviteCode.trim().toUpperCase());
      if (!invite) {
        return res.status(400).json({ error: 'Invalid or expired invite code' });
      }

      if (!acceptedPrivacy) {
        return res.status(400).json({ error: 'Must accept privacy policy' });
      }

      // Create user
      const newUser = await pool.query(
        `INSERT INTO users
           (telegram_id, telegram_username, first_name, last_name, telegram_photo_url, invite_code, accepted_privacy)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          tgId,
          telegramData.username || null,
          telegramData.first_name || '',
          telegramData.last_name || '',
          telegramData.photo_url || null,
          inviteCode.trim().toUpperCase(),
          true
        ]
      );
      user = newUser.rows[0];

      // Create empty profile
      await pool.query(
        'INSERT INTO profiles (user_id) VALUES ($1)',
        [user.id]
      );

      // Mark invite used
      await markInviteUsed(inviteCode.trim().toUpperCase(), user.id);
    } else {
      // Existing user — update last_active and Telegram data
      await pool.query(
        `UPDATE users SET last_active = NOW(),
           telegram_username = $2,
           first_name = $3,
           telegram_photo_url = COALESCE($4, telegram_photo_url)
         WHERE id = $1`,
        [user.id, telegramData.username, telegramData.first_name, telegramData.photo_url]
      );
    }

    const token = jwt.sign(
      { userId: user.id, telegramId: tgId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, userId: user.id, isNew: !userResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/validate-invite
 * Check if invite code is valid before Telegram login
 */
router.post('/validate-invite', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false });

  const invite = await validateInvite(code.trim().toUpperCase());
  res.json({ valid: !!invite });
});

module.exports = router;
