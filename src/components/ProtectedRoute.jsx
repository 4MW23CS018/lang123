// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const userId = localStorage.getItem('userId');
  const sessionToken = localStorage.getItem('sessionToken');

  // Server-verified identity check via sessionToken
  const user = useQuery(
    api.users.get,
    sessionToken
      ? { sessionToken, userId: userId || undefined }
      : userId
      ? { userId }
      : 'skip'
  );

  if (!userId && !sessionToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // If session is invalid, revoked (e.g. after password reset), or expired
  if (!user) {
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionToken');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If onboarding not completed and we're not already on onboarding page
  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
