import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function LikesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/matches').then(res => {
      setMatches(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="app-header">
        <span className="logo">wave</span>
        <div className="header-icons">
          <button className="header-icon-btn">?</button>
          <button className="header-icon-btn" style={{ position: 'relative' }}>
            🔔<span className="badge" />
          </button>
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 80 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', paddingTop: 40 }}>Загрузка...</p>
        ) : matches.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💛</div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Пока нет матчей</h3>
            <p style={{ color: '#888', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
              Листай профили — когда совпадёте взаимно, они появятся здесь
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17 }}>Матчи ({matches.length})</h3>
            {matches.map(m => (
              <div
                key={m.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/view/${m.id}`)}
              >
                {m.primary_photo ? (
                  <img src={m.primary_photo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#EDE0D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    👤
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: 16 }}>{m.first_name}</strong>
                  {m.telegram_username && (
                    <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>@{m.telegram_username}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
