import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LessonDetail from './pages/LessonDetail';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css'; 

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">LangBridge</nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/:id"
          element={
            <ProtectedRoute>
              <LessonDetail />
            </ProtectedRoute>
          }
        />
        {/* Fallback: if logged in, go to dashboard; else login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}