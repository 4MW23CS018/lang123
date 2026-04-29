// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const userId = localStorage.getItem('userId');
  const user = useQuery(api.users.get, userId ? { userId } : 'skip');

  if (!userId) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user === undefined) return <div className="container">Loading...</div>; // still fetching

  // If onboarding not completed and we're not already on onboarding page
  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}