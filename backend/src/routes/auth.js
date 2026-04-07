const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const { validateInvite, markInviteUsed } = require('../utils/inviteGenerator');

const router = express.Router();

/**
 * Verify Telegram Mini App initData
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function verifyTelegramInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) return null;

  const userStr = params.get('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/telegram
 * Body: { initData, inviteCode, acceptedPrivacy }
 */
router.post('/telegram', async (req, res) => {
  try {
    const { initData, inviteCode, acceptedPrivacy } = req.body;

    if (!initData) return res.status(400).json({ error: 'No initData' });

    const telegramUser = verifyTelegramInitData(initData);
    if (!telegramUser) {
      return res.status(401).json({ error: 'Invalid Telegram auth' });
    }

    const tgId = telegramUser.id;

    // Check if user already exists
    let userResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [tgId]
    );

    let user = userResult.rows[0];

    if (!user) {
      // TODO: remove SKIP_INVITE_CHECK before production
      const skipInvite = process.env.SKIP_INVITE_CHECK === 'true';

      if (!skipInvite) {
        if (!inviteCode) {
          return res.status(403).json({ error: 'Invite code required' });
        }

        const invite = await validateInvite(inviteCode.trim().toUpperCase());
        if (!invite) {
          return res.status(400).json({ error: 'Invalid or expired invite code' });
        }
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
          telegramUser.username || null,
          telegramUser.first_name || '',
          telegramUser.last_name || '',
          telegramUser.photo_url || null,
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
        [user.id, telegramUser.username, telegramUser.first_name, telegramUser.photo_url]
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
