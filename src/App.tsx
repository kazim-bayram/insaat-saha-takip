import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading SiteNotes..." />;
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  // Show loading if user is authenticated but profile hasn't loaded yet
  if (!userProfile) {
    return <LoadingSpinner fullScreen message="Loading your profile..." />;
  }

  // Show dashboard for authenticated users
  return <Dashboard />;
};

export default App;
