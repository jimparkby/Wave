import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/home.css';

export default function HomePage() {
  const [feed, setFeed] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    api.get('/users/feed').then(res => {
      setFeed(res.data);
      setLoading(false);
    });
  }, []);

  async function handleLike(userId) {
    const res = await api.post('/matches/like', { toUserId: userId });
    if (res.data.isMatch) setMatched(true);
    setTimeout(() => { setMatched(false); setIdx(i => i + 1); }, matched ? 2000 : 0);
    if (!matched) setIdx(i => i + 1);
  }

  function handlePass() {
    setIdx(i => i + 1);
  }

  const current = feed[idx];

  return (
    <div>
      {/* Header */}
      <div className="app-header">
        <span className="logo">wave</span>
        <div className="header-icons">
          <button className="header-icon-btn">⟳24</button>
          <button className="header-icon-btn">?</button>
          <button className="header-icon-btn" style={{ position: 'relative' }}>
            🔔<span className="badge" />
          </button>
        </div>
      </div>

      <div className="home-content">
        {loading ? (
          <div className="home-empty">Загружаем профили...</div>
        ) : matched ? (
          <div className="match-popup">
            <div className="match-emoji">💛</div>
            <h2>Это матч!</h2>
            <p>Вы оба понравились друг другу</p>
          </div>
        ) : !current ? (
          <div className="home-card card">
            <div className="home-card-illustration">
              <div className="illustration-placeholder">🕯</div>
            </div>
            <div className="home-card-body">
              <h2>Пока никого нет в твоей зоне</h2>
              <p>Мы постоянно расширяемся. Пригласи друзей, чтобы ускорить процесс!</p>
              <button className="btn-primary" style={{ marginTop: 16 }}>
                Пригласить друга
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-card card">
            {current.primary_photo && (
              <div className="profile-card-photo">
                <img src={current.primary_photo} alt="" />
              </div>
            )}
            <div className="profile-card-info">
              <h3>{current.first_name}{current.age ? `, ${current.age}` : ''}</h3>
              {current.city && <p>📍 {current.city}</p>}
              {current.bio && <p className="profile-card-bio">{current.bio}</p>}
              {current.hobbies?.length > 0 && (
                <div className="tags-row" style={{ marginTop: 8 }}>
                  {current.hobbies.slice(0, 3).map(h => (
                    <span key={h} className="tag">{h}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="profile-card-actions">
              <button className="action-btn pass" onClick={handlePass}>✕</button>
              <button className="action-btn like" onClick={() => handleLike(current.id)}>♥</button>
            </div>
          </div>
        )}

        {/* How it works card */}
        {!loading && !current && (
          <div className="how-it-works card" style={{ marginTop: 12 }}>
            <h3>Как работает Wave?</h3>
            <div className="steps">
              {[
                { icon: '💳', text: 'Оба подтверждают намерение' },
                { icon: '📅', text: 'Выбираете дату вместе' },
                { icon: '📍', text: 'Мы находим место' },
                { icon: '✓', text: 'Подтверждаете присутствие' },
                { icon: '🍹', text: 'Встречаетесь офлайн!' }
              ].map((s, i) => (
                <div key={i} className="step">
                  <div className="step-icon">{s.icon}</div>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
