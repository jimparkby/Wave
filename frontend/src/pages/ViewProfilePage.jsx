import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function ViewProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/profile/${userId}`).then(res => setData(res.data));
  }, [userId]);

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Загрузка...</div>;

  const { user, profile, photos, qas } = data;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--color-bg)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>←</button>
        <div style={{ display: 'flex', gap: 24, flex: 1, justifyContent: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#888' }}>Редактировать</span>
          <span style={{ fontWeight: 700, fontSize: 15, borderBottom: '2px solid #1A1A1A', paddingBottom: 4 }}>Просмотр</span>
        </div>
        <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>↗</button>
      </div>

      {photos?.[0] && (
        <div style={{ height: '70vw', maxHeight: 360, overflow: 'hidden', position: 'relative' }}>
          <img src={photos[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', padding: '20px 20px 16px', color: '#fff' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700 }}>{user?.first_name}</h2>
            <p style={{ fontSize: 15, opacity: 0.85 }}>
              {profile?.age}{profile?.height_cm ? ` · ${profile.height_cm} см` : ''}
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {profile?.study && (
          <div style={{ display: 'flex', gap: 10, fontSize: 14, color: '#888' }}>
            <span>🎓</span><span>Учёба</span><span style={{ marginLeft: 'auto', fontWeight: 500, color: '#1A1A1A' }}>{profile.study}</span>
          </div>
        )}
        {profile?.city && (
          <div style={{ display: 'flex', gap: 10, fontSize: 14, color: '#888' }}>
            <span>📍</span><span>Город</span>
            <strong style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>{profile.city}</strong>
          </div>
        )}
      </div>

      {photos?.slice(1).map((photo, i) => (
        <React.Fragment key={photo.id}>
          <div style={{ margin: 16, borderRadius: 16, overflow: 'hidden', background: '#3D1A1A' }}>
            <img src={photo.url} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          {qas?.[i] && (
            <div style={{ margin: '0 16px', background: '#3D1A1A', borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{qas[i].question}</p>
              <p style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>{qas[i].answer}</p>
            </div>
          )}
        </React.Fragment>
      ))}

      {profile?.hobbies?.length > 0 && (
        <div style={{ padding: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Хобби и интересы</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.hobbies.map(h => <span key={h} className="tag">{h}</span>)}
          </div>
        </div>
      )}

      {profile?.traits?.length > 0 && (
        <div style={{ background: '#3D1A1A', margin: '8px 0' }}>
          <div style={{ padding: 20 }}>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Черты характера</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.traits.map(t => (
                <span key={t} className="tag tag-dark">{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
