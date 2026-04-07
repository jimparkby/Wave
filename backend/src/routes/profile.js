const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const auth = require('../middleware/auth');
const pool = require('../utils/db');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads', String(req.user.userId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomBytes(12).toString('hex') + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// GET /api/profile/me
router.get('/me', auth, async (req, res) => {
  try {
    const [userRes, profileRes, photosRes, qasRes] = await Promise.all([
      pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]),
      pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.userId]),
      pool.query(
        'SELECT * FROM photos WHERE user_id = $1 ORDER BY sort_order',
        [req.user.userId]
      ),
      pool.query('SELECT * FROM qas WHERE user_id = $1', [req.user.userId])
    ]);

    const user = userRes.rows[0];
    const profile = profileRes.rows[0];
    const photos = photosRes.rows;
    const qas = qasRes.rows;

    res.json({ user, profile, photos, qas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/profile/me
router.patch('/me', auth, async (req, res) => {
  const {
    bio, age, height_cm, city, study, languages,
    hobbies, traits, religion, political_view,
    alcohol, smoking, sleep_mode
  } = req.body;

  try {
    if (sleep_mode !== undefined) {
      await pool.query('UPDATE users SET sleep_mode = $1 WHERE id = $2', [sleep_mode, req.user.userId]);
    }

    await pool.query(
      `UPDATE profiles SET
        bio = COALESCE($1, bio),
        age = COALESCE($2, age),
        height_cm = COALESCE($3, height_cm),
        city = COALESCE($4, city),
        study = COALESCE($5, study),
        languages = COALESCE($6, languages),
        hobbies = COALESCE($7, hobbies),
        traits = COALESCE($8, traits),
        religion = COALESCE($9, religion),
        political_view = COALESCE($10, political_view),
        alcohol = COALESCE($11, alcohol),
        smoking = COALESCE($12, smoking),
        updated_at = NOW()
       WHERE user_id = $13`,
      [bio, age, height_cm, city, study, languages, hobbies, traits,
       religion, political_view, alcohol, smoking, req.user.userId]
    );

    // Recalculate profile completeness
    const profile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.userId]);
    const p = profile.rows[0];
    let score = 0;
    if (p.bio) score += 20;
    if (p.hobbies?.length) score += 15;
    if (p.traits?.length) score += 10;
    if (p.city) score += 10;
    if (p.age) score += 10;
    if (p.height_cm) score += 5;
    if (p.study) score += 10;
    if (p.languages?.length) score += 5;
    if (p.religion) score += 5;
    if (p.political_view) score += 5;
    if (p.alcohol) score += 2;
    if (p.smoking) score += 3;
    const photoCount = await pool.query('SELECT COUNT(*) FROM photos WHERE user_id = $1', [req.user.userId]);
    if (parseInt(photoCount.rows[0].count) > 0) score += Math.min(parseInt(photoCount.rows[0].count) * 5, 20);

    await pool.query('UPDATE profiles SET profile_completeness = $1 WHERE user_id = $2', [score, req.user.userId]);

    res.json({ success: true, completeness: score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile/photos
router.post('/photos', auth, upload.single('photo'), async (req, res) => {
  try {
    const url = `/uploads/${req.user.userId}/${req.file.filename}`;
    const countRes = await pool.query('SELECT COUNT(*) FROM photos WHERE user_id = $1', [req.user.userId]);
    const count = parseInt(countRes.rows[0].count);

    if (count >= 6) return res.status(400).json({ error: 'Max 6 photos' });

    const result = await pool.query(
      `INSERT INTO photos (user_id, url, is_primary, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.userId, url, count === 0, count]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /api/profile/photos/:id
router.delete('/photos/:id', auth, async (req, res) => {
  try {
    const photo = await pool.query(
      'SELECT * FROM photos WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (!photo.rows[0]) return res.status(404).json({ error: 'Not found' });

    const filePath = path.join(__dirname, '../..', photo.rows[0].url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM photos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile/qas
router.post('/qas', auth, async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });

  const result = await pool.query(
    'INSERT INTO qas (user_id, question, answer) VALUES ($1, $2, $3) RETURNING *',
    [req.user.userId, question, answer]
  );
  res.json(result.rows[0]);
});

// GET /api/profile/:userId — public profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const [userRes, profileRes, photosRes, qasRes] = await Promise.all([
      pool.query('SELECT id, first_name, telegram_username, is_verified, sleep_mode FROM users WHERE id = $1', [req.params.userId]),
      pool.query('SELECT bio, age, height_cm, city, study, languages, hobbies, traits FROM profiles WHERE user_id = $1', [req.params.userId]),
      pool.query('SELECT url, sort_order FROM photos WHERE user_id = $1 ORDER BY sort_order', [req.params.userId]),
      pool.query('SELECT question, answer FROM qas WHERE user_id = $1', [req.params.userId])
    ]);

    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: userRes.rows[0],
      profile: profileRes.rows[0],
      photos: photosRes.rows,
      qas: qasRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
