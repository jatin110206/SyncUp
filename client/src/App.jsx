import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useUiStore } from './store/useUiStore';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AppPage } from './pages/AppPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <ErrorBoundary>
      <AppLayout>{children}</AppLayout>
    </ErrorBoundary>
  );
};

// Public Route Guard (Redirects to /app if already logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default function App() {
  const theme = useUiStore((state) => state.theme);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Apply saved theme class to <html> element
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]); // Dependent strictly on boolean isAuthenticated

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Root Redirect */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
