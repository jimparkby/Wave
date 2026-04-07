import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import '../styles/invite.css';

export default function InvitePage() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const token = useAuthStore(s => s.token);

  const [inviteCode, setInviteCode] = useState(urlCode || '');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeValid, setCodeValid] = useState(urlCode ? true : null);

  useEffect(() => {
    if (token) navigate('/home');
  }, [token]);

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!accepted) { setError('Примите политику конфиденциальности'); return; }
    if (!inviteCode.trim()) { setError('Введите код приглашения'); return; }

    setLoading(true);
    setError('');

    // Validate code first if not already validated
    if (codeValid === null) {
      await validateCode(inviteCode);
    }
    if (codeValid === false) {
      setLoading(false);
      return;
    }

    // Get Telegram Mini App initData
    const initData = window?.Telegram?.WebApp?.initData;
    if (!initData) {
      setError('Откройте приложение через Telegram');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/telegram', {
        initData,
        inviteCode: inviteCode.trim().toUpperCase(),
        acceptedPrivacy: accepted,
      });
      setAuth(res.data.token, res.data.userId);
      navigate('/home');
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка авторизации');
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
        <form onSubmit={handleSubmit} className="invite-form">
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
            {loading ? 'Входим...' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  );
}
