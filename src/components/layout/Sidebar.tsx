import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Award,
  Bell,
  Users,
  Building2,
  Calendar,
  FileCode2,
  GitFork,
  Calculator,
  ShieldAlert,
  Database,
  Inbox,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/authStore';
import { getDb } from '../../api/mockDb';
import { AskHRModal } from '../../features/common/AskHRModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToastStore } from '../ui/Toast';

export interface SidebarProps {
  isExpanded: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle }) => {
  const { currentUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const role = currentUser?.role || 'EMPLOYEE';

  const [isAskHROpen, setIsAskHROpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const db = getDb();
  // Approvals count for badges
  const pendingApprovalsCount = db.approvalSteps.filter((s) => {
    if (s.status !== 'PENDING') return false;
    if (role === 'HR_ADMIN') return s.stage === 2; // Level 2 waiting on HR
    return s.approverId === currentUser?.id;
  }).length;

  // Unread notifications count
  const unreadNotificationsCount = currentUser
    ? db.notifications.filter((n) => n.employeeId === currentUser.id && !n.read).length
    : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast({ type: 'info', message: 'Signed out successfully.' });
  };

  // Define nav links based on role (matching video items while including full OKR system)
  interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const groups: NavGroup[] = [];

  if (role === 'EMPLOYEE') {
    groups.push({
      title: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { path: '/check-ins', label: 'Attendance & Time', icon: <Clock className="w-5 h-5" /> },
        { path: '/okrs', label: 'Objectives & KRs', icon: <Target className="w-5 h-5" /> },
        { path: '/company', label: 'Company OKRs', icon: <Building2 className="w-5 h-5" /> },
      ],
    });
    groups.push({
      title: 'Performance & Docs',
      items: [
        { path: '/reviews', label: 'Performance Reviews', icon: <Award className="w-5 h-5" /> },
        {
          path: '/notifications',
          label: 'Notifications',
          icon: <Bell className="w-5 h-5" />,
          badge: unreadNotificationsCount,
        },
      ],
    });
  } else if (role === 'MANAGER') {
    groups.push({
      title: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { path: '/okrs', label: 'My Objectives', icon: <Target className="w-5 h-5" /> },
        { path: '/team', label: 'My Team', icon: <Users className="w-5 h-5" /> },
        { path: '/check-ins', label: 'Attendance & Check-ins', icon: <Clock className="w-5 h-5" /> },
        { path: '/company', label: 'Company OKRs', icon: <Building2 className="w-5 h-5" /> },
      ],
    });
    groups.push({
      title: 'Reviews & Approvals',
      items: [
        {
          path: '/approvals',
          label: 'Approvals',
          icon: <Inbox className="w-5 h-5" />,
          badge: pendingApprovalsCount,
        },
        { path: '/reviews', label: 'Performance Reviews', icon: <Award className="w-5 h-5" /> },
        {
          path: '/notifications',
          label: 'Notifications',
          icon: <Bell className="w-5 h-5" />,
          badge: unreadNotificationsCount,
        },
      ],
    });
  } else {
    // HR_ADMIN
    groups.push({
      title: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { path: '/company', label: 'Company OKRs', icon: <Building2 className="w-5 h-5" /> },
        { path: '/check-ins', label: 'Attendance & Check-ins', icon: <Clock className="w-5 h-5" /> },
      ],
    });
    groups.push({
      title: 'Reviews & Approvals',
      items: [
        {
          path: '/approvals',
          label: 'Approvals',
          icon: <Inbox className="w-5 h-5" />,
          badge: pendingApprovalsCount,
        },
        { path: '/reviews', label: 'Performance Reviews', icon: <Award className="w-5 h-5" /> },
        {
          path: '/notifications',
          label: 'Notifications',
          icon: <Bell className="w-5 h-5" />,
          badge: unreadNotificationsCount,
        },
      ],
    });
    groups.push({
      title: 'Admin Governance',
      items: [
        { path: '/admin/cycles', label: 'Cycles', icon: <Calendar className="w-5 h-5" /> },
        { path: '/admin/templates', label: 'Templates', icon: <FileCode2 className="w-5 h-5" /> },
        { path: '/admin/workflows', label: 'Workflows', icon: <GitFork className="w-5 h-5" /> },
        { path: '/admin/scores', label: 'Scores', icon: <Calculator className="w-5 h-5" /> },
        { path: '/admin/master-data', label: 'Master Data', icon: <Database className="w-5 h-5" /> },
        { path: '/admin/audit-log', label: 'Audit Log', icon: <ShieldAlert className="w-5 h-5" /> },
      ],
    });
  }

  return (
    <>
      <aside
        className={`fixed top-0 left-0 bottom-0 z-[45] transition-all duration-300 ease-in-out select-none flex flex-col shadow-xl text-white ${
          isExpanded ? 'w-[260px]' : 'w-[76px]'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0c4d3e 0%, #0a4336 100%)',
        }}
      >
        {/* ======================================================================= */}
        {/* HEADER: BrandCrock Logo + Expand/Collapse Button (Matching Video Frame 4 & 6) */}
        {/* ======================================================================= */}
        <div
          className={`h-[60px] flex items-center border-b border-white/10 px-3.5 transition-all ${
            isExpanded ? 'justify-between' : 'justify-center relative'
          }`}
        >
          {isExpanded ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 p-1 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img
                  src="/brandcrock-logo-transparent.png"
                  alt="BrandCrock Logo"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/brandcrock-logo.png';
                  }}
                />
              </div>
              <span className="font-bold text-sm text-white tracking-tight truncate">
                BrandCrock India
              </span>
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-xl bg-white/15 p-1 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-sm cursor-pointer hover:bg-white/25 transition-colors"
              onClick={onToggle}
              title="Expand Sidebar"
            >
              <img
                src="/brandcrock-logo-transparent.png"
                alt="BrandCrock Logo"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/brandcrock-logo.png';
                }}
              />
            </div>
          )}

          {/* Expand/Collapse Toggle Button */}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              title={isExpanded ? 'Collapse Navigation' : 'Expand Navigation'}
              className={`w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-all ${
                !isExpanded ? 'absolute -right-3 top-4 shadow-md border border-white/20 z-50 bg-[#0c4d3e]' : ''
              }`}
            >
              {isExpanded ? (
                <ChevronLeft className="w-4 h-4 text-white" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>

        {/* ======================================================================= */}
        {/* NAVIGATION ITEMS LIST */}
        {/* ======================================================================= */}
        <div className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-4 px-2.5 custom-scrollbar">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              {isExpanded ? (
                <div className="px-3 pt-1 pb-1 text-[10px] uppercase font-bold tracking-wider text-emerald-200/50">
                  {group.title}
                </div>
              ) : (
                <div className="my-1.5 border-t border-white/10" />
              )}

              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' &&
                    location.pathname.startsWith(item.path) &&
                    item.path !== '/okrs');

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={!isExpanded ? item.label : undefined}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative ${
                      isActive
                        ? 'bg-[#186453] text-white font-semibold shadow-inner'
                        : 'text-[#b7e0d6] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center relative">
                      {item.icon}
                      {!isExpanded && item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {isExpanded && (
                      <span className="text-xs tracking-wide truncate">
                        {item.label}
                      </span>
                    )}

                    {isExpanded && item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* ======================================================================= */}
        {/* BOTTOM SECTION: Ask HR + User Profile Card (Matching Video Frame 6 & 8) */}
        {/* ======================================================================= */}
        <div className="p-2.5 border-t border-white/10 space-y-2 bg-black/10">
          {/* Ask HR Interactive Button */}
          <button
            type="button"
            onClick={() => setIsAskHROpen(true)}
            title="Ask HR for inquiries and support"
            className={`w-full rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex items-center ${
              isExpanded ? 'px-3 py-2.5 justify-start gap-2.5' : 'p-2.5 justify-center'
            } text-left group`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-teal-800/80 border border-teal-600/40 flex items-center justify-center text-teal-200">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0a4336] rounded-full animate-pulse" />
            </div>

            {isExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white group-hover:text-emerald-200 transition-colors">
                  Ask HR
                </span>
                <span className="text-[10px] text-emerald-200/60 truncate">
                  Helpdesk & Requests
                </span>
              </div>
            )}
          </button>

          {/* User Account Card */}
          <div
            className={`w-full rounded-2xl bg-white/10 border border-white/10 transition-all flex items-center ${
              isExpanded ? 'p-2 justify-between' : 'p-2 justify-center'
            }`}
          >
            <div
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
              onClick={() => navigate('/profile')}
              title={`View Profile: ${currentUser?.name}`}
            >
              <div className="w-8 h-8 rounded-full bg-teal-800 border border-teal-500/50 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow-sm">
                {currentUser?.avatar || 'MA'}
              </div>

              {isExpanded && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">
                    {currentUser?.name || 'Mohammed Ashraf'}
                  </span>
                  <span className="text-[10px] text-emerald-200/70 capitalize truncate max-w-[130px]">
                    {currentUser?.role === 'HR_ADMIN'
                      ? 'HR / Admin'
                      : currentUser?.role?.toLowerCase() || 'Employee'}
                  </span>
                </div>
              )}
            </div>

            {/* Logout Action Button */}
            {isExpanded && (
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                title="Sign out"
                className="p-1.5 rounded-lg hover:bg-white/20 text-emerald-200/70 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Ask HR Modal Dialog */}
      <AskHRModal isOpen={isAskHROpen} onClose={() => setIsAskHROpen(false)} />

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Sign out of BrandCrock HRMS?"
        message="Are you sure you want to end your current session?"
        confirmLabel="Sign out"
        isDestructive
      />
    </>
  );
};
