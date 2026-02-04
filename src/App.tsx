import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();

  // Yükleniyor durumunu kontrol et
  if (loading) {
    return <LoadingSpinner fullScreen message="Saha Takip yükleniyor..." />;
  }

  // Giriş yapılmadıysa login ekranını göster
  if (!currentUser) {
    return <Login />;
  }

  // Kullanıcı girişi yapıldı ama profil yüklenmediyse
  if (!userProfile) {
    return <LoadingSpinner fullScreen message="Profiliniz yükleniyor..." />;
  }

  // Ana panel
  return <Dashboard />;
};

export default App;
