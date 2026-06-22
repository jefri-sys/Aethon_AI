import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Spinner from './Spinner.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner label="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    user.emailVerified &&
    !user.onboardingDone &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.onboardingDone && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
