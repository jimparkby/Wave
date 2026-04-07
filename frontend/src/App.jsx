import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import InvitePage from './pages/InvitePage';
import HomePage from './pages/HomePage';
import LikesPage from './pages/LikesPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ViewProfilePage from './pages/ViewProfilePage';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: invite/entry page */}
        <Route path="/" element={<InvitePage />} />
        <Route path="/invite/:code" element={<InvitePage />} />

        {/* Private: main app */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
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
