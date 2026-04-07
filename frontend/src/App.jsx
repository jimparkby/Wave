import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import api from './utils/api';

import HomePage from './pages/HomePage';
import LikesPage from './pages/LikesPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ViewProfilePage from './pages/ViewProfilePage';
import Layout from './components/Layout';

export default function App() {
  const { token, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) { setLoading(false); return; }

    const initData = window?.Telegram?.WebApp?.initData;
    if (!initData) { setLoading(false); return; }

    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();

    api.post('/auth/telegram', { initData })
      .then(res => setAuth(res.data.token, res.data.userId))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={token ? <Layout /> : <Navigate to="/noaccess" replace />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/likes" element={<LikesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/view/:userId" element={<ViewProfilePage />} />
        </Route>
        <Route path="*" element={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>Откройте Wave через Telegram</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
