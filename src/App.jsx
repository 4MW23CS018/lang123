import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Practice from './pages/Practice';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Basics from './pages/Basics';
import Shop from './pages/Shop';
import ProtectedRoute from './components/ProtectedRoute';

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

export default function App() {
  return (
    <>
      <AmbientBackground />
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/basics" element={<ProtectedRoute><Layout><Basics /></Layout></ProtectedRoute>} />
        <Route path="/lessons" element={<ProtectedRoute><Layout><Lessons /></Layout></ProtectedRoute>} />
        <Route path="/lesson/:id" element={<ProtectedRoute><Layout><LessonDetail /></Layout></ProtectedRoute>} />
        <Route path="/practice/:id" element={<ProtectedRoute><Layout><Practice /></Layout></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><Layout><Shop /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </>
  );
}