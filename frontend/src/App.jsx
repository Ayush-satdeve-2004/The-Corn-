import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { initProtection } from './services/antiHack';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Friends from './pages/Friends';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

// Components
import Navbar from './components/Navbar';
import './App.css';

/**
 * ProtectedRoute — Redirects unauthenticated users to /login.
 * If authenticated but no username set, redirects to /onboarding.
 */
function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-corn">🌽</div>
        <p>Loading The Corn...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the user hasn't completed onboarding (no username), redirect
  if (!user?.username) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

/**
 * PublicRoute — Redirects authenticated users away from login/register.
 */
function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-corn">🌽</div>
        <p>Loading The Corn...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    if (!user?.username) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * AdminRoute — Restricts access strictly to Admin users (role === 'ADMIN').
 */
function AdminRoute({ children }) {
  const { isAdmin, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Initialize anti-hack protection
  useEffect(() => {
    initProtection();
  }, []);

  // Determine if navbar should be shown (only on authenticated main pages)
  const showNavbar = isAuthenticated && user?.username && 
    ['/', '/friends', '/create', '/profile'].includes(location.pathname);

  return (
    <div className="app-container">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Onboarding (authenticated but incomplete profile) */}
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Bottom Navigation Bar */}
      {showNavbar && <Navbar />}
    </div>
  );
}
