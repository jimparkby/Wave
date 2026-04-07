import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '../utils/api';
import '../styles/editprofile.css';

const HOBBIES_LIST = ['Медитация', 'Кулинария', 'Написание текстов', 'Музеи', 'Хоррор', 'Пение', 'Кино', 'Путешествия', 'Спорт', 'Искусство', 'Чтение', 'Танцы'];
const TRAITS_LIST = ['Активист', 'Интроверт', 'Экстроверт', 'Творческий', 'Аналитик', 'Романтик', 'Авантюрист', 'Оптимист'];
const RELIGIONS = ['Не указано', 'Христианство', 'Ислам', 'Иудаизм', 'Буддизм', 'Индуизм', 'Агностик', 'Атеизм', 'Другое'];
const POLITICS = ['Не указано', 'Левые', 'Центр', 'Правые', 'Аполитичен'];
const HABITS = ['Нет', 'Иногда', 'Часто', 'Всегда'];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'view'
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/profile/me').then(res => {
      setData(res.data);
      setPhotos(res.data.photos || []);
      setForm({
        bio: res.data.profile?.bio || '',
        age: res.data.profile?.age || '',
        height_cm: res.data.profile?.height_cm || '',
        city: res.data.profile?.city || '',
        study: res.data.profile?.study || '',
        languages: res.data.profile?.languages || [],
        hobbies: res.data.profile?.hobbies || [],
        traits: res.data.profile?.traits || [],
        religion: res.data.profile?.religion || 'Не указано',
        political_view: res.data.profile?.political_view || 'Не указано',
        alcohol: res.data.profile?.alcohol || 'Нет',
        smoking: res.data.profile?.smoking || 'Нет'
      });
    });
  }, []);

  function toggle(field, value) {
    setForm(f => {
      const arr = f[field] || [];
      return {
        ...f,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    const res = await api.post('/profile/photos', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setPhotos(p => [...p, res.data]);
  }

  async function deletePhoto(id) {
    await api.delete(`/profile/photos/${id}`);
    setPhotos(p => p.filter(ph => ph.id !== id));
  }

  async function save() {
    setSaving(true);
    const res = await api.patch('/profile/me', form);
    setSaving(false);
    if (data) setData(d => ({ ...d, profile: { ...d.profile, profile_completeness: res.data.completeness } }));
  }

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Загрузка...</div>;

  const completeness = data.profile?.profile_completeness || 0;

  return (
    <div>
      {/* Sub-header */}
      <div className="edit-subheader">
        <button className="edit-back" onClick={() => navigate('/profile')}>←</button>
        <div className="edit-tabs">
          <button
            className={`edit-tab${activeTab === 'edit' ? ' active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >Редактировать</button>
          <button
            className={`edit-tab${activeTab === 'view' ? ' active' : ''}`}
            onClick={() => setActiveTab('view')}
          >Просмотр</button>
        </div>
        <button className="edit-share">↗</button>
      </div>

      {activeTab === 'edit' ? (
        <div className="edit-content">

          {/* Completeness */}
          <div className="card" style={{ margin: '16px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44 }}>
                <CircularProgressbar
                  value={completeness}
                  text={`${completeness}%`}
                  styles={buildStyles({ textSize: '28px', pathColor: '#E05C3A', textColor: '#1A1A1A', trailColor: '#EDE0D4' })}
                />
              </div>
              <div>
                <strong style={{ fontSize: 15 }}>Профиль заполнен</strong>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {completeness < 70 ? 'Добавь больше информации' : 'Отличный профиль!'}
                </p>
              </div>
            </div>

            {!form.bio && (
              <>
                <p style={{ fontSize: 13, color: '#888', marginTop: 12 }}>Расскажи о себе.</p>
                <textarea
                  className="input-field"
                  style={{ marginTop: 8, minHeight: 80, resize: 'vertical' }}
                  placeholder="Напиши несколько слов о себе..."
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
              </>
            )}
          </div>

          {/* Photos */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ fontWeight: 700, fontSize: 17 }}>Фото и видео</h3>
              <span style={{ fontSize: 12, color: '#888' }}>Удерживай для сортировки</span>
            </div>

            <div className="photo-grid">
              {[0, 1, 2, 3, 4, 5].map(i => {
                const photo = photos[i];
                return photo ? (
                  <div key={photo.id} className="photo-cell filled">
                    <img src={photo.url} alt="" />
                    {i === 0 ? (
                      <button className="photo-edit-btn" onClick={() => fileRef.current?.click()}>✏️</button>
                    ) : (
                      <button className="photo-delete-btn" onClick={() => deletePhoto(photo.id)}>×</button>
                    )}
                  </div>
                ) : (
                  <button key={i} className="photo-cell empty" onClick={() => fileRef.current?.click()}>
                    <span className="photo-add-icon">+</span>
                    <span className="photo-placeholder-icon">🖼</span>
                  </button>
                );
              })}
            </div>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
          </div>

          {/* Bio (if not shown above) */}
          {form.bio !== undefined && (
            <div style={{ padding: '16px 16px 0' }}>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Моя личность</h3>
              <div className="card">
                {/* Bio */}
                <div className="edit-row" onClick={() => {}}>
                  <div className="edit-row-icon">💬</div>
                  <div className="edit-row-content">
                    <strong>Bio</strong>
                    {form.bio ? (
                      <textarea
                        className="input-field"
                        style={{ marginTop: 6, minHeight: 60, resize: 'vertical' }}
                        value={form.bio}
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      />
                    ) : (
                      <span style={{ color: '#888', fontSize: 13 }}>Не указано</span>
                    )}
                  </div>
                  <span className="arrow">→</span>
                </div>
                <div className="divider" />

                {/* Hobbies */}
                <div className="edit-row">
                  <div className="edit-row-icon">📖</div>
                  <div className="edit-row-content">
                    <strong>Хобби и интересы</strong>
                    <div className="tags-row">
                      {HOBBIES_LIST.map(h => (
                        <button
                          key={h}
                          className={`tag ${form.hobbies?.includes(h) ? 'tag-selected' : ''}`}
                          onClick={() => toggle('hobbies', h)}
                        >{h}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="divider" />

                {/* Traits */}
                <div className="edit-row">
                  <div className="edit-row-icon">😊</div>
                  <div className="edit-row-content">
                    <strong>Черты характера</strong>
                    <div className="tags-row">
                      {TRAITS_LIST.map(t => (
                        <button
                          key={t}
                          className={`tag ${form.traits?.includes(t) ? 'tag-selected' : ''}`}
                          onClick={() => toggle('traits', t)}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Beliefs */}
          <div style={{ padding: '16px 16px 0' }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Убеждения</h3>
            <div className="card">
              <div className="edit-row">
                <div className="edit-row-icon">🙏</div>
                <div className="edit-row-content">
                  <strong>Религия</strong>
                  <select className="input-field" style={{ marginTop: 4 }} value={form.religion} onChange={e => setForm(f => ({ ...f, religion: e.target.value }))}>
                    {RELIGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="divider" />
              <div className="edit-row">
                <div className="edit-row-icon">🗳</div>
                <div className="edit-row-content">
                  <strong>Политические взгляды</strong>
                  <select className="input-field" style={{ marginTop: 4 }} value={form.political_view} onChange={e => setForm(f => ({ ...f, political_view: e.target.value }))}>
                    {POLITICS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Habits */}
          <div style={{ padding: '16px 16px 0' }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Привычки</h3>
            <div className="card">
              <div className="edit-row">
                <div className="edit-row-icon">🍷</div>
                <div className="edit-row-content">
                  <strong>Алкоголь</strong>
                  <select className="input-field" style={{ marginTop: 4 }} value={form.alcohol} onChange={e => setForm(f => ({ ...f, alcohol: e.target.value }))}>
                    {HABITS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="divider" />
              <div className="edit-row">
                <div className="edit-row-icon">✏️</div>
                <div className="edit-row-content">
                  <strong>Курение</strong>
                  <select className="input-field" style={{ marginTop: 4 }} value={form.smoking} onChange={e => setForm(f => ({ ...f, smoking: e.target.value }))}>
                    {HABITS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div style={{ padding: '16px 16px 0' }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Основная информация</h3>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input-field" placeholder="Город" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              <input className="input-field" placeholder="Учёба / работа" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
              <input className="input-field" type="number" placeholder="Возраст" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              <input className="input-field" type="number" placeholder="Рост (см)" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} />
            </div>
          </div>

          <div style={{ padding: '20px 16px 40px' }}>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </div>
      ) : (
        <ViewMode user={data.user} profile={data.profile} photos={photos} qas={data.qas} />
      )}
    </div>
  );
}

function ViewMode({ user, profile, photos, qas }) {
  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Hero photo */}
      {photos?.[0] && (
        <div className="view-hero">
          <img src={photos[0].url} alt="" />
          <div className="view-hero-info">
            <h2>{user?.first_name}</h2>
            <p>{profile?.age}{profile?.height_cm ? ` · ${profile.height_cm} см` : ''}</p>
          </div>
        </div>
      )}

      {/* Basic info row */}
      <div style={{ padding: '20px 20px 0' }}>
        {profile?.study && (
          <div className="view-info-row">
            <span>🎓</span><span>Учёба</span><span>{profile.study}</span>
          </div>
        )}
        {profile?.city && (
          <div className="view-info-row">
            <span>📍</span><span>Город</span><strong style={{ color: 'var(--color-accent)' }}>{profile.city}</strong>
          </div>
        )}
      </div>

      {/* Photos gallery + sections */}
      {photos?.slice(1).map((photo, i) => (
        <React.Fragment key={photo.id}>
          <div className="view-photo-card">
            <img src={photo.url} alt="" />
          </div>
          {/* Show a Q&A after every photo */}
          {qas?.[i] && (
            <div className="view-qa-card">
              <p className="view-qa-question">{qas[i].question}</p>
              <p className="view-qa-answer">{qas[i].answer}</p>
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Hobbies */}
      {profile?.hobbies?.length > 0 && (
        <div className="view-section">
          <h3>Хобби и интересы</h3>
          <div className="tags-row">
            {profile.hobbies.map(h => <span key={h} className="tag">{h}</span>)}
          </div>
        </div>
      )}

      {/* Traits */}
      {profile?.traits?.length > 0 && (
        <div className="view-section-dark">
          <div style={{ padding: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: 12 }}>Черты характера</h3>
            <div className="tags-row">
              {profile.traits.map(t => <span key={t} className="tag tag-dark">{t}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
