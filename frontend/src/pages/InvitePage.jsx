import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import '../styles/invite.css';

// Telegram Login Widget (callback-based)
function TelegramLoginButton({ botUsername, onAuth }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !botUsername) return;
    window.onTelegramAuth = onAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    ref.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botUsername, onAuth]);

  return <div ref={ref} />;
}

const BOT_USERNAME = import.meta.env.VITE_TG_BOT_USERNAME || 'your_bot_username';

export default function InvitePage() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const token = useAuthStore(s => s.token);

  const [step, setStep] = useState('invite'); // 'invite' | 'telegram'
  const [inviteCode, setInviteCode] = useState(urlCode || '');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeValid, setCodeValid] = useState(urlCode ? true : null);

  // Already logged in
  useEffect(() => {
    if (token) navigate('/home');
  }, [token]);

  // Auto-validate URL code
  useEffect(() => {
    if (urlCode) validateCode(urlCode);
  }, [urlCode]);

  async function validateCode(code) {
    if (!code || code.length < 6) return;
    try {
      const res = await api.post('/auth/validate-invite', { code: code.trim().toUpperCase() });
      setCodeValid(res.data.valid);
      if (!res.data.valid) setError('Ссылка недействительна или уже использована');
      else setError('');
    } catch {
      setCodeValid(false);
    }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    if (!accepted) { setError('Примите политику конфиденциальности'); return; }
    if (!inviteCode.trim()) { setError('Введите код приглашения'); return; }

    setLoading(true);
    setError('');
    await validateCode(inviteCode);
    setLoading(false);

    if (codeValid !== false) {
      setStep('telegram');
    }
  }

  async function handleTelegramAuth(telegramData) {
    setLoading(true);
    try {
      const res = await api.post('/auth/telegram', {
        telegramData,
        inviteCode: inviteCode.trim().toUpperCase(),
        acceptedPrivacy: accepted
      });
      setAuth(res.data.token, res.data.userId);
      navigate('/home');
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка авторизации');
      setStep('invite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="invite-page">
      <div className="invite-hero">
        <h1 className="invite-logo">wave</h1>
        <p className="invite-tagline">Закрытая платформа знакомств</p>
      </div>

      <div className="invite-card">
        {step === 'invite' ? (
          <form onSubmit={handleInviteSubmit} className="invite-form">
            <h2>Введите код приглашения</h2>
            <p className="invite-hint">Wave — только по приглашениям</p>

            <input
              className="input-field invite-input"
              placeholder="WAVE-XXXXXX"
              value={inviteCode}
              onChange={e => {
                setInviteCode(e.target.value.toUpperCase());
                setCodeValid(null);
              }}
              onBlur={() => validateCode(inviteCode)}
              maxLength={11}
              autoComplete="off"
              spellCheck={false}
            />

            {codeValid === true && (
              <span className="code-valid">Код действителен</span>
            )}
            {codeValid === false && (
              <span className="code-invalid">Код недействителен</span>
            )}

            <label className="privacy-label">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="privacy-checkbox"
              />
              <span>
                Я согласен с{' '}
                <a href="/privacy" target="_blank" className="privacy-link">
                  политикой конфиденциальности
                </a>
              </span>
            </label>

            {error && <p className="invite-error">{error}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !accepted || codeValid === false}
            >
              {loading ? 'Проверяем...' : 'Продолжить'}
            </button>
          </form>
        ) : (
          <div className="tg-step">
            <h2>Войдите через Telegram</h2>
            <p className="invite-hint">
              Ваши данные подтянутся автоматически
            </p>

            <div className="tg-widget-wrap">
              <TelegramLoginButton
                botUsername={BOT_USERNAME}
                onAuth={handleTelegramAuth}
              />
            </div>

            {loading && <p className="invite-hint">Входим...</p>}
            {error && <p className="invite-error">{error}</p>}

            <button
              className="btn-secondary"
              style={{ marginTop: 12 }}
              onClick={() => setStep('invite')}
            >
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
