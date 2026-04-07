import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '../utils/api';
import '../styles/profile.css';

const PRESET_QUESTIONS = [
  'Что все должны попробовать хотя бы раз?',
  'Лучшее место, где ты был/а?',
  'Твоя суперсила?',
  'Что тебя вдохновляет?'
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sleepMode, setSleepMode] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    api.get('/profile/me').then(res => {
      setData(res.data);
      setSleepMode(res.data.user?.sleep_mode || false);
      setLoading(false);
    });
  }, []);

  async function toggleSleepMode() {
    const next = !sleepMode;
    setSleepMode(next);
    await api.patch('/profile/me', { sleep_mode: next });
  }

  async function generateInvite() {
    setGeneratingInvite(true);
    try {
      const res = await api.post('/invites/generate');
      setGeneratedLink(res.data.link);
    } finally {
      setGeneratingInvite(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink);
  }

  if (loading) return <div className="profile-loading">Загрузка...</div>;

  const { user, profile, photos } = data;
  const completeness = profile?.profile_completeness || 0;

  return (
    <div>
      {/* Header */}
      <div className="profile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="profile-avatar-wrap">
            {photos?.[0] ? (
              <img src={photos[0].url} alt="avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">+</div>
            )}
          </div>
          <div>
            <div className="profile-name">{user?.first_name}</div>
            {user?.telegram_username && (
              <div className="profile-username">@{user.telegram_username}</div>
            )}
          </div>
        </div>

        <button className="sleep-badge" onClick={toggleSleepMode}>
          {sleepMode ? '🌙' : '☀️'} {sleepMode ? 'Sleep Mode' : 'Активен'}
        </button>
      </div>

      <div className="page-content" style={{ paddingBottom: 80 }}>

        {/* Verify */}
        <div style={{ padding: '16px 16px 0' }}>
          <div className="profile-action-card">
            <div className="profile-action-icon verify">✓</div>
            <div className="profile-action-text">
              <strong>Верификация</strong>
              <span>Покажи, что ты настоящий</span>
            </div>
            <span className="arrow">→</span>
          </div>
        </div>

        {/* Profile completeness */}
        <div style={{ padding: '12px 16px 0' }}>
          <div className="profile-action-card" onClick={() => navigate('/profile/edit')}>
            <div style={{ width: 44, height: 44 }}>
              <CircularProgressbar
                value={completeness}
                text={`${completeness}%`}
                styles={buildStyles({
                  textSize: '28px',
                  pathColor: '#E05C3A',
                  textColor: '#1A1A1A',
                  trailColor: '#EDE0D4'
                })}
              />
            </div>
            <div className="profile-action-text">
              <strong>Профиль</strong>
              <span>
                {completeness < 40 ? 'Только начало' :
                 completeness < 70 ? 'Основа есть' :
                 completeness < 90 ? 'Почти готов!' : 'Полный профиль'}
              </span>
            </div>
            <span className="arrow">→</span>
          </div>

          {!profile?.bio && (
            <div className="add-bio-section">
              <p className="add-bio-hint">Расскажи о себе — это главное.</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/profile/edit')}
                style={{ marginTop: 8 }}
              >
                Добавить Bio
              </button>
            </div>
          )}
        </div>

        {/* Edit buttons */}
        <div style={{ padding: '12px 16px 0' }}>
          <div className="menu-card">
            <button className="menu-item" onClick={() => navigate('/profile/edit')}>
              <span>✏️</span>
              <span>Редактировать профиль</span>
              <span className="arrow">→</span>
            </button>
            <div className="divider" />
            <button className="menu-item">
              <span>✦</span>
              <span>Предпочтения</span>
              <span className="arrow">→</span>
            </button>
            <div className="divider" />
            <button className="menu-item">
              <span>👛</span>
              <span>Кошелёк</span>
              <span className="arrow">→</span>
            </button>
            <div className="divider" />
            <button className="menu-item">
              <span>⚙️</span>
              <span>Настройки аккаунта</span>
              <span className="arrow">→</span>
            </button>
          </div>
        </div>

        {/* Invite section */}
        <div className="section-label">ПРИГЛАСИТЬ ДРУГА</div>
        <div style={{ padding: '0 16px' }}>
          <div className="menu-card">
            <button className="menu-item" onClick={generateInvite} disabled={generatingInvite}>
              <span>🔗</span>
              <span>{generatingInvite ? 'Генерируем...' : 'Создать ссылку-приглашение'}</span>
              <span className="arrow">→</span>
            </button>
          </div>

          {generatedLink && (
            <div className="invite-result">
              <code>{generatedLink}</code>
              <button className="btn-primary" style={{ marginTop: 8 }} onClick={copyLink}>
                Скопировать
              </button>
            </div>
          )}
        </div>

        {/* About section */}
        <div className="section-label">О WAVE</div>
        <div style={{ padding: '0 16px' }}>
          <div className="menu-card">
            {['Поддержка', 'Политика конфиденциальности', 'Безопасность', 'Сайт'].map((item, i, arr) => (
              <React.Fragment key={item}>
                <button className="menu-item">
                  <span>{item}</span>
                </button>
                {i < arr.length - 1 && <div className="divider" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
