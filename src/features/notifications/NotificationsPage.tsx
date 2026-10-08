import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb } from '../../api/mockDb';
import { Notification } from '../../types';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToastStore } from '../../components/ui/Toast';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const {
    notifications: storeNotifications,
    keyResults: storeKRs,
    markNotificationRead: storeMarkRead,
    markAllNotificationsRead: storeMarkAllRead,
  } = useOkrStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const db = getDb();

  const userNotifications = storeNotifications.filter(
    (n) => n.employeeId === currentUser?.id
  );

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await storeMarkAllRead(currentUser.id);
    showToast({ type: 'success', message: 'All notifications marked as read' });
  };

  const handleItemClick = async (notif: Notification) => {
    await storeMarkRead(notif.id);

    // Navigate to the correct destination with ZERO 404s
    if (notif.objectType === 'KEY_RESULT') {
      const kr = storeKRs.find((k) => k.id === notif.objectId) || db.keyResults.find((k) => k.id === notif.objectId);
      if (kr) {
        navigate(`/okrs/${kr.objectiveId}/kr/${kr.id}`);
        return;
      }
      navigate('/okrs');
    } else if (notif.objectType === 'OBJECTIVE') {
      navigate(`/okrs/${notif.objectId}`);
    } else if (notif.objectType === 'APPROVAL') {
      if (currentUser?.role === 'MANAGER' || currentUser?.role === 'HR_ADMIN') {
        navigate(`/approvals/${notif.objectId}`);
      } else {
        navigate(`/okrs/${notif.objectId}`);
      }
    } else if (notif.objectType === 'CHECK_IN') {
      navigate('/check-ins');
    } else if (
      notif.objectType === 'PERFORMANCE_REVIEW' ||
      notif.objectType === 'REVIEW'
    ) {
      navigate('/reviews');
    } else {
      navigate('/dashboard');
    }
  };

  const filtered = userNotifications.filter((n) => (filter === 'UNREAD' ? !n.read : true));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Notifications</h1>
          <p className="text-xs text-[#64748b] mt-1">
            System updates, approval requests, pace warnings, and review feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            filter === 'ALL'
              ? 'bg-[#2d8fd8] text-white shadow-sm'
              : 'bg-white text-slate-600 border'
          }`}
        >
          All Notifications ({userNotifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            filter === 'UNREAD'
              ? 'bg-[#2d8fd8] text-white shadow-sm'
              : 'bg-white text-slate-600 border'
          }`}
        >
          Unread Only ({userNotifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => handleItemClick(n)}
            className={`p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors text-xs ${
              !n.read ? 'bg-sky-50/40 font-medium' : ''
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${!n.read ? 'text-[#0369a1]' : 'text-slate-900'}`}>
                  {n.title}
                </span>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-[#2d8fd8] flex-shrink-0" />
                )}
              </div>
              <p className="text-slate-600 text-xs">{n.message}</p>
            </div>

            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {new Date(n.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon="inbox"
            title="You are all caught up"
            description="No notifications matching your selection."
          />
        )}
      </div>
    </div>
  );
};
