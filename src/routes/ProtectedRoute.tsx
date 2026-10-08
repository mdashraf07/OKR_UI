import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, isAllowed } from '../features/auth/authStore';
import { Role } from '../types';
import { getDb } from '../api/mockDb';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'EMPLOYEE',
}) => {
  const { currentUser } = useAuthStore();
  const db = getDb();
  const bypass = db.devSettings.bypassRoleRestrictions;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!bypass && !isAllowed(currentUser, requiredRole)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};
