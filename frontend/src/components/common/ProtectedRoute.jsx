import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-saffron">Loading SilverHands...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    if (requiredRole === 'ADMIN') {
      if (!isAdmin) {
        return <Navigate to="/" replace />;
      }
    } else if (requiredRole === 'PROVIDER') {
      if (user?.role !== 'PROVIDER' && !isAdmin) {
        return <Navigate to="/" replace />;
      }
    } else if (user?.role !== requiredRole && !isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};
