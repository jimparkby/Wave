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
 * Body: { initData }
 */
router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'No initData' });

    // Parse without HMAC check if BOT_TOKEN not set (dev/test)
    let telegramUser;
    if (process.env.TELEGRAM_BOT_TOKEN) {
      telegramUser = verifyTelegramInitData(initData);
    } else {
      const params = new URLSearchParams(initData);
      try { telegramUser = JSON.parse(params.get('user')); } catch {}
    }

    if (!telegramUser) {
      return res.status(401).json({ error: 'Invalid Telegram auth' });
    }

    const tgId = telegramUser.id;

    let userResult = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [tgId]);
    let user = userResult.rows[0];

    if (!user) {
      const newUser = await pool.query(
        `INSERT INTO users (telegram_id, telegram_username, first_name, last_name, telegram_photo_url, accepted_privacy)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
        [tgId, telegramUser.username || null, telegramUser.first_name || '', telegramUser.last_name || '', telegramUser.photo_url || null]
      );
      user = newUser.rows[0];
      await pool.query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);
    } else {
      await pool.query(
        `UPDATE users SET last_active = NOW(), telegram_username = $2, first_name = $3,
         telegram_photo_url = COALESCE($4, telegram_photo_url) WHERE id = $1`,
        [user.id, telegramUser.username, telegramUser.first_name, telegramUser.photo_url]
      );
    }

    const token = jwt.sign({ userId: user.id, telegramId: tgId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId: user.id });
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
