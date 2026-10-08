import React from 'react';
import { useAuthStore } from '../auth/authStore';
import { ManagerDashboardView } from './ManagerDashboardView';
import { EmployeeDashboardView } from './EmployeeDashboardView';
import { AdminDashboardView } from './AdminDashboardView';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const currentRole = currentUser?.role || 'EMPLOYEE';

  return (
    <div className="space-y-4">
      {/* Persona Dashboard rendered based on authenticated role */}
      {currentRole === 'MANAGER' && <ManagerDashboardView />}
      {currentRole === 'HR_ADMIN' && <AdminDashboardView />}
      {currentRole === 'EMPLOYEE' && <EmployeeDashboardView />}
    </div>
  );
};
