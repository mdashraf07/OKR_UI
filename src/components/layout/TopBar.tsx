import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Power,
  ChevronDown,
  Layers,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/authStore';
import { getDb, resetDb } from '../../api/mockDb';
import { useToastStore } from '../ui/Toast';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LanguageSelector } from '../common/LanguageSelector';

export const TopBar: React.FC<{
  onToggleSidebar?: () => void;
  isSidebarExpanded?: boolean;
}> = ({ onToggleSidebar, isSidebarExpanded }) => {
  const { currentUser, selectedCycleId, setSelectedCycleId, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const db = getDb();
  const cycles = db.cycles;
  const notifications = currentUser
    ? db.notifications.filter((n) => n.employeeId === currentUser.id)
    : [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keyboard shortcut Ctrl+K or / for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetData = () => {
    resetDb();
    showToast({ type: 'success', message: 'Demo data reset to initial state' });
    setIsProfileOpen(false);
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast({ type: 'info', message: 'You have been signed out.' });
  };

  // Filter items for global search
  const searchResults = searchQuery.trim()
    ? {
        objectives: db.objectives.filter(
          (o) =>
            o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.description && o.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
        keyResults: db.keyResults.filter((k) =>
          k.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        people: db.users.filter((u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }
    : null;

  return (
    <>
      <header
        className="h-[60px] w-full text-white px-4 flex items-center justify-between sticky top-0 z-[40] select-none shadow-md"
        style={{
          background: 'linear-gradient(90deg, #0c4d3e 0%, #0f5847 45%, #136553 100%)',
        }}
      >
        {/* Left: Search input (Matching Video: "Search pages, holidays, and leaves") */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 h-9 rounded-full px-4 flex items-center gap-2.5 cursor-pointer transition-all bg-white/15 hover:bg-white/20 border border-white/25 shadow-sm group"
          >
            <Search className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
            <span className="text-xs text-white/80 group-hover:text-white font-normal truncate">
              Search pages, holidays, and leaves
            </span>
            <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-mono">
              Ctrl+K
            </span>
          </div>

          {/* Global Cycle Selector */}
          <div className="relative hidden lg:flex items-center">
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              className="h-8 pl-8 pr-7 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-full border border-white/25 appearance-none cursor-pointer focus:outline-none"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-800">
                  {c.name} {c.status === 'Active' ? '(Active)' : `(${c.status})`}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-white/80 absolute left-2.5 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-white/80 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right Section (Matching Video Frame 4 & 6: Language, Settings, Power, User Avatar) */}
        <div className="flex items-center gap-2.5 ml-4">
          {/* Language Selector Dropdown (Video: [ 🇬🇧 EN ⌵ ]) */}
          <LanguageSelector theme="dark" />

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#0f5847]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[60] overflow-hidden text-[#1e293b] animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#1e293b]">
                    Notifications ({unreadCount} new)
                  </span>
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/notifications');
                    }}
                    className="text-xs text-[#2d8fd8] font-medium hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (n.objectType === 'OBJECTIVE') navigate(`/okrs/${n.objectId}`);
                        else if (n.objectType === 'APPROVAL') navigate(`/approvals/${n.objectId}`);
                        else navigate('/notifications');
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-sky-50/50 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1e293b]">{n.title}</span>
                        <span className="text-[10px] text-slate-400">recent</span>
                      </div>
                      <p className="text-[#64748b] text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400">You are all caught up.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Design System Link */}
          <button
            onClick={() => navigate('/design-system')}
            title="Design System & Gallery"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 hidden sm:flex items-center justify-center transition-colors"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </button>

          {/* Settings Circle Button (Matching Video) */}
          <button
            onClick={() => navigate('/profile')}
            title="System Settings"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>

          {/* Power / Sign Out Circle Button (Matching Video) */}
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            title="Sign out"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Power className="w-4 h-4 text-white" />
          </button>

          {/* User Profile Avatar Circle (Matching Video: "MA") */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-teal-800 border border-teal-500/50 flex items-center justify-center font-bold text-xs text-white hover:ring-2 hover:ring-white/40 transition-all shadow-sm"
              title={`Logged in as: ${currentUser?.name}`}
            >
              {currentUser?.avatar || 'MA'}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[60] overflow-hidden text-[#1e293b] p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-slate-100">
                  <div className="font-semibold text-sm text-[#1e293b]">{currentUser?.name}</div>
                  <div className="text-xs text-[#64748b]">{currentUser?.email}</div>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    {currentUser?.role === 'HR_ADMIN' ? 'HR / Admin' : currentUser?.role}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#334155] hover:bg-slate-50 rounded-lg flex items-center justify-between"
                  >
                    <span>Profile & Preferences</span>
                  </button>
                  <button
                    onClick={handleResetData}
                    className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-lg flex items-center justify-between"
                  >
                    <span>Reset Demo Data</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-center pt-20 px-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-slate-100 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search objectives, key results, employees, holidays..."
                className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
              />
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
                ESC
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-4">
              {searchResults ? (
                <>
                  {searchResults.objectives.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Objectives ({searchResults.objectives.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.objectives.map((o) => (
                          <div
                            key={o.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/okrs/${o.id}`);
                            }}
                            className="p-2 rounded-lg hover:bg-sky-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-800">{o.title}</span>
                            <span className="text-slate-400">{o.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.keyResults.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Key Results ({searchResults.keyResults.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.keyResults.map((kr) => (
                          <div
                            key={kr.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/okrs/${kr.objectiveId}/kr/${kr.id}`);
                            }}
                            className="p-2 rounded-lg hover:bg-sky-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-800">{kr.name}</span>
                            <span className="text-slate-400">{kr.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.people.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        People ({searchResults.people.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.people.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/okrs?ownerId=${u.id}`);
                            }}
                            className="p-2 rounded-lg hover:bg-sky-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-800">{u.name}</span>
                            <span className="text-slate-400">{u.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.objectives.length === 0 &&
                    searchResults.keyResults.length === 0 &&
                    searchResults.people.length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                </>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Type to search across objectives, key results, and people...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation */}
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
