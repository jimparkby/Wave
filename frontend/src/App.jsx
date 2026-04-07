import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LikesPage from './pages/LikesPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ViewProfilePage from './pages/ViewProfilePage';
import Layout from './components/Layout';

export default function App() {
  useEffect(() => {
    window?.Telegram?.WebApp?.ready();
    window?.Telegram?.WebApp?.expand();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/likes" element={<LikesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/view/:userId" element={<ViewProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
