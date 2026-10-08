import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home, AlertCircle } from 'lucide-react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { DeveloperPanel } from './DeveloperPanel';
import { ToastContainer, useToastStore } from '../ui/Toast';
import { useAuthStore } from '../../features/auth/authStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getDb } from '../../api/mockDb';
import { Cycle } from '../../types';

export const AppShell: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();
  const { currentUser, logout, touchActivity } = useAuthStore();
  const [isSessionTimeoutOpen, setIsSessionTimeoutOpen] = useState(false);
  const { clearToasts } = useToastStore();

  // Clear toasts on route change
  useEffect(() => {
    clearToasts();
  }, [location.pathname, clearToasts]);

  // User activity tracker for 30 min idle session (throttled to avoid re-renders)
  useEffect(() => {
    let lastActiveRecorded = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActiveRecorded > 60000) {
        lastActiveRecorded = now;
        touchActivity();
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });

    // Check idle every 30 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      const lastActive = useAuthStore.getState().idleTimerLastActive;
      if (now - lastActive > 1800000) {
        setIsSessionTimeoutOpen(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [touchActivity]);

  // Construct breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const url = `/${pathParts.slice(0, index + 1).join('/')}`;
    let label = part;
    if (part === 'okrs') label = 'OKRs';
    else if (part === 'dashboard') label = 'Dashboard';
    else if (part === 'approvals') label = 'Approvals';
    else if (part === 'team') label = 'Team';
    else if (part === 'company') label = 'Company';
    else if (part === 'check-ins') label = 'Check-ins';
    else if (part === 'reviews') label = 'Reviews';
    else if (part === 'admin') label = 'Admin';
    else if (part === 'design-system') label = 'Design System';
    else if (part === 'dev') label = 'Dev';
    else if (part === 'status') label = 'Status View';
    else if (!isNaN(Number(part))) label = `#${part}`;
    return { url, label };
  });

  const { selectedCycleId } = useAuthStore();
  const db = getDb();
  const activeCycle = db.cycles.find((c) => c.status === 'Active') || db.cycles[1] || db.cycles[0];
  const headerCycle = db.cycles.find((c) => c.id === selectedCycleId) || activeCycle;

  return (
    <div className="min-h-screen bg-[#e7ecf2] flex font-sans text-[#1e293b]">
      {/* Sidebar (Full height on left) */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main Content Area (TopBar + Page Container) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 ${
          isSidebarExpanded ? 'ml-[260px]' : 'ml-[76px]'
        }`}
      >
        {/* Top Bar */}
        <TopBar
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />

        <main className="flex-1 flex flex-col">
          {/* Breadcrumbs Banner */}
          {breadcrumbs.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm border-b border-slate-200/80 px-6 py-2.5 flex items-center justify-between text-xs">
              <nav className="flex items-center gap-1.5 text-slate-500 overflow-x-auto">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1 hover:text-[#2d8fd8] transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={b.url}>
                    <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {i === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-[#1e293b] truncate max-w-[200px]">
                        {b.label}
                      </span>
                    ) : (
                      <Link
                        to={b.url}
                        className="hover:text-[#2d8fd8] transition-colors truncate max-w-[150px]"
                      >
                        {b.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              <div className="hidden md:flex items-center gap-2 text-slate-600">
                <span className={`w-2 h-2 rounded-full ${headerCycle?.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-[11px] font-medium">{headerCycle?.name} {headerCycle?.status === 'Active' ? 'Active' : `(${headerCycle?.status})`}</span>
              </div>
            </div>
          )}

          {/* Page Container */}
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Developer Tools */}
      <DeveloperPanel />

      {/* Toast Notification Mount */}
      <ToastContainer />

      {/* Idle Session Timeout Modal */}
      <Modal
        isOpen={isSessionTimeoutOpen}
        onClose={() => {}}
        title={
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-5 h-5" />
            <span>Session Inactivity Notice</span>
          </div>
        }
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setIsSessionTimeoutOpen(false);
              logout();
              window.location.href = '/login';
            }}
          >
            Sign in again
          </Button>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Your session has been idle for more than 30 minutes. To protect corporate goal and
          performance evaluation data, please sign in again.
        </p>
      </Modal>
    </div>
  );
};
