require('dotenv').config();
const pool = require('./db');

const schema = `
-- Invite codes
CREATE TABLE IF NOT EXISTS invites (
  id SERIAL PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,
  created_by INTEGER,
  used_by INTEGER,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users (auth via Telegram)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  telegram_photo_url TEXT,
  invite_code VARCHAR(16),
  accepted_privacy BOOLEAN DEFAULT FALSE,
  sleep_mode BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- User profiles (extended info)
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  age INTEGER,
  height_cm INTEGER,
  city VARCHAR(255),
  study VARCHAR(255),
  languages TEXT[],
  hobbies TEXT[],
  traits TEXT[],
  religion VARCHAR(100),
  political_view VARCHAR(100),
  alcohol VARCHAR(50),
  smoking VARCHAR(50),
  profile_completeness INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User photos
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Q&As
CREATE TABLE IF NOT EXISTS qas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Matches / Likes
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  from_user INTEGER REFERENCES users(id) ON DELETE CASCADE,
  to_user INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_match BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user, to_user)
);

CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_likes_from_user ON likes(from_user);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON likes(to_user);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('Migration completed successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
