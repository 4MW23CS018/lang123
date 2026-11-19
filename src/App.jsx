import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';

const VisualNovel = lazy(() => import('./game/VisualNovel'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Lessons = lazy(() => import('./pages/Lessons'));
const CustomLessons = lazy(() => import('./pages/CustomLessons'));
const LessonDetail = lazy(() => import('./pages/LessonDetail'));
const Practice = lazy(() => import('./pages/Practice'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Basics = lazy(() => import('./pages/Basics'));
const Shop = lazy(() => import('./pages/Shop'));
const Roleplay = lazy(() => import('./pages/Roleplay'));

import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/chat/ChatWidget';

import Layout from './components/Layout';

import './index.css';

const AmbientBackground = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none',
    background: 'var(--bg-base)'
  }}>
    <div style={{
      position: 'absolute', top: '-10%', left: '-10%', width: '70vw', height: '70vh',
      background: 'radial-gradient(circle, var(--purple-bg) 0%, transparent 60%)',
      filter: 'blur(80px)', opacity: 0.8, animation: 'float 20s infinite ease-in-out alternate'
    }} />
    <div style={{
      position: 'absolute', bottom: '-10%', right: '-10%', width: '60vw', height: '60vh',
      background: 'radial-gradient(circle, var(--accent-bg) 0%, transparent 60%)',
      filter: 'blur(80px)', opacity: 0.8, animation: 'float 25s infinite ease-in-out alternate-reverse'
    }} />
  </div>
);

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] Uncaught route error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Something paused your journey</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>A quick refresh or heading to your dashboard will get you right back on track.</p>
          <a href="/lessons" style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--accent)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Go to Lessons
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <>
      <AmbientBackground />
      <BrowserRouter>
        <RouteErrorBoundary>
          <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          }>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/basics" element={<ProtectedRoute><Layout><Basics /></Layout></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><Layout><Lessons /></Layout></ProtectedRoute>} />
            <Route path="/custom-lessons" element={<ProtectedRoute><Layout><CustomLessons /></Layout></ProtectedRoute>} />
            <Route path="/lesson/:id" element={<ProtectedRoute><Layout><LessonDetail /></Layout></ProtectedRoute>} />
            <Route path="/practice/:id" element={<ProtectedRoute><Layout><Practice /></Layout></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><Layout><Shop /></Layout></ProtectedRoute>} />
            <Route path="/roleplay" element={<ProtectedRoute><Layout><Roleplay /></Layout></ProtectedRoute>} />
            <Route path="/roleplay/game" element={<ProtectedRoute><VisualNovel /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </RouteErrorBoundary>
        {/* Floating chat widget on all pages */}
        {localStorage.getItem('userId') && <ChatWidget />}
      </BrowserRouter>
    </>
  );
}