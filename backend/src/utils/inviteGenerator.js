const crypto = require('crypto');
const pool = require('./db');

/**
 * Generates a unique invite code like: WAVE-A3F9K2
 * Cryptographically secure, stored in DB
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars (0,O,I,1)
  let code = 'WAVE-';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

async function createInvite(createdByUserId = null, expiresInDays = 30) {
  let code;
  let attempts = 0;

  // Retry on collision (extremely rare)
  while (attempts < 5) {
    code = generateCode();
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const result = await pool.query(
        `INSERT INTO invites (code, created_by, expires_at)
         VALUES ($1, $2, $3) RETURNING *`,
        [code, createdByUserId, expiresAt]
      );
      return result.rows[0];
    } catch (e) {
      if (e.code === '23505') { // unique violation
        attempts++;
      } else {
        throw e;
      }
    }
  }
  throw new Error('Failed to generate unique invite code');
}

async function validateInvite(code) {
  const result = await pool.query(
    `SELECT * FROM invites
     WHERE code = $1 AND is_used = FALSE
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [code]
  );
  return result.rows[0] || null;
}

async function markInviteUsed(code, userId) {
  await pool.query(
    `UPDATE invites SET is_used = TRUE, used_by = $1 WHERE code = $2`,
    [userId, code]
  );
}

module.exports = { createInvite, validateInvite, markInviteUsed };
