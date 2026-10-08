import React, { useState } from 'react';
import { User, Bell, Mail, Shield, Check } from 'lucide-react';
import { useAuthStore } from './authStore';
import { getDb, saveDb } from '../../api/mockDb';
import { NotificationPreference } from '../../types';
import { Button } from '../../components/ui/Button';
import { useToastStore } from '../../components/ui/Toast';

export const ProfilePage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const db = getDb();

  const [preferences, setPreferences] = useState<NotificationPreference[]>(
    db.preferences.filter((p) => p.employeeId === (currentUser?.id || 1))
  );

  const dept = db.departments.find((d) => d.id === currentUser?.departmentId);

  const togglePreference = (type: string, channel: 'email' | 'inApp') => {
    const updated = preferences.map((p) => {
      if (p.notificationType === type) {
        return channel === 'email'
          ? { ...p, emailEnabled: !p.emailEnabled }
          : { ...p, inAppEnabled: !p.inAppEnabled };
      }
      return p;
    });

    setPreferences(updated);

    // Save to DB
    db.preferences = db.preferences.map((p) => {
      if (p.employeeId === currentUser?.id && p.notificationType === type) {
        return channel === 'email'
          ? { ...p, emailEnabled: !p.emailEnabled }
          : { ...p, inAppEnabled: !p.inAppEnabled };
      }
      return p;
    });
    saveDb();
    showToast({ type: 'success', message: 'Notification preferences updated' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Employee Profile & Preferences</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Review employee identity, role assignments, and communication notification settings.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
          <img src="/brandcrock-logo.png" alt="BrandCrock" className="h-8 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">BrandCrock India</span>
            <span className="text-[10px] text-slate-500">Corporate HRMS Portal</span>
          </div>
        </div>
      </div>

      {/* Identity Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1e293b]">User Identity</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sky-100 text-[#0369a1] font-bold text-xl flex items-center justify-center">
            {currentUser?.avatar || 'US'}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{currentUser?.name}</div>
            <div className="text-xs text-slate-500">{currentUser?.title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Employee ID</span>
            <span className="font-semibold text-slate-800">{currentUser?.employeeCode || 'EMP-1001'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Department</span>
            <span className="font-semibold text-slate-800">{dept?.name || 'Department'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Assigned Role</span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-sky-100 text-[#0369a1] inline-block mt-0.5">
              {currentUser?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1e293b]">Notification Delivery Channels</h2>
          <p className="text-xs text-[#64748b]">Configure which events send Email vs In-App notifications</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9fe] text-slate-700 font-semibold border-b">
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-3 text-center">In-App Notification</th>
                <th className="py-3 px-3 text-center">Email Notification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preferences.map((p) => (
                <tr key={p.notificationType} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{p.label}</td>
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.inAppEnabled}
                      onChange={() => togglePreference(p.notificationType, 'inApp')}
                      className="w-4 h-4 rounded text-[#2d8fd8] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={p.emailEnabled}
                      onChange={() => togglePreference(p.notificationType, 'email')}
                      className="w-4 h-4 rounded text-[#2d8fd8] cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
