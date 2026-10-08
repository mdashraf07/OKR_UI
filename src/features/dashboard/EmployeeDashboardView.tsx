import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Sparkles,
  Heart,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Tag,
  Building2,
  Check,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb, saveDb } from '../../api/mockDb';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ObjectiveProgressDisplay } from '../../components/ui/ObjectiveProgressDisplay';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { KRStatusChip, ObjectiveStatusPill, ObjectiveHealthChip } from '../../components/ui/Chips';
import { calculateExpectedProgress } from '../../lib/calculations';
import { UpdateProgressDrawer } from '../progress/UpdateProgressDrawer';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../components/ui/Toast';
import { KeyResult, MeetingItem, FeedMoment } from '../../types';

export const EmployeeDashboardView: React.FC = () => {
  const { currentUser, selectedCycleId } = useAuthStore();
  const { objectives: storeObjectives, keyResults: storeKRs, refresh: refreshStore } = useOkrStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const db = getDb();

  const currentCycle = db.cycles.find((c) => c.id === selectedCycleId) || db.cycles[1];
  const asOfDate = db.devSettings.demoDate;
  const cycleExpectedPace = calculateExpectedProgress(
    currentCycle.startDate,
    currentCycle.endDate,
    asOfDate
  );

  const daysLeft = Math.max(
    0,
    Math.round(
      (new Date(currentCycle.endDate).getTime() - new Date(asOfDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Employee's personal objectives across all departments
  const myObjectives = storeObjectives.filter(
    (o) => o.ownerId === currentUser?.id && o.cycleId === selectedCycleId
  );
  const myKRs = storeKRs.filter((k) =>
    myObjectives.some((o) => o.id === k.objectiveId) || k.ownerId === currentUser?.id
  );

  // Progress metrics
  const activeObjs = myObjectives.filter((o) => o.status === 'Active');
  const overallProgress =
    activeObjs.length > 0
      ? Math.round(
          activeObjs.reduce((sum, o) => sum + (o.progress || 0), 0) / activeObjs.length
        )
      : 0;

  // Drawer for fast check-in
  const [selectedKRForUpdate, setSelectedKRForUpdate] = useState<KeyResult | null>(null);

  // Meetings
  const [meetingsList, setMeetingsList] = useState<MeetingItem[]>(
    (db.meetings || []).filter(
      (m) =>
        m.attendeeIds.includes(currentUser?.id || 1) ||
        m.organizerId === currentUser?.id
    )
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-10-15');
  const [meetingTime, setMeetingTime] = useState('02:00 PM - 02:30 PM');

  // Feeds
  const [feedsList, setFeedsList] = useState<FeedMoment[]>(db.feeds || []);

  const handleLikeFeed = (feedId: number) => {
    setFeedsList((prev) =>
      prev.map((f) => {
        if (f.id === feedId) {
          const isLiked = f.likedByCurrentUser;
          return {
            ...f,
            likes: isLiked ? f.likes - 1 : f.likes + 1,
            likedByCurrentUser: !isLiked,
          };
        }
        return f;
      })
    );
  };

  const handleScheduleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTopic.trim()) return;

    const newMeeting: MeetingItem = {
      id: Date.now(),
      title: meetingTopic.trim(),
      type: '1-on-1',
      date: meetingDate,
      time: meetingTime,
      durationMinutes: 30,
      organizerId: currentUser?.id || 1,
      attendeeIds: [currentUser?.id || 1, currentUser?.managerId || 2],
      meetingLink: 'https://meet.brandcrock.com/1on1-request',
      notes: 'Requested by employee for OKR check-in review',
    };

    const updated = [...meetingsList, newMeeting];
    setMeetingsList(updated);
    db.meetings = [...(db.meetings || []), newMeeting];
    saveDb();
    setIsScheduleModalOpen(false);
    setMeetingTopic('');
    showToast({ type: 'success', message: '1-on-1 meeting request sent to manager!' });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Greeting & Self Evaluation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
            Welcome back, <span className="text-[#0e7490]">{currentUser?.name || 'Mohammed Ashraf'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Self-Evaluation & Personal OKR Pacing Dashboard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsScheduleModalOpen(true)}
            leftIcon={<Calendar className="w-4 h-4 text-[#0e7490]" />}
          >
            Request 1-on-1
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/okrs')}
            leftIcon={<Target className="w-4 h-4" />}
          >
            My Objectives & KRs
          </Button>
        </div>
      </div>

      {/* 2. Self-Evaluation Hero Pacing Card */}
      <div
        className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                {currentCycle.name}
              </span>
              <span className="text-xs text-teal-100 font-medium">
                {daysLeft} days remaining in cycle
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Personal Goal Achievement: {overallProgress}%
            </h2>
            <p className="text-xs text-teal-50 max-w-xl leading-relaxed">
              Target pace for today is <strong>{cycleExpectedPace}%</strong>.{' '}
              {overallProgress >= cycleExpectedPace - 5 ? (
                <span className="text-white font-semibold">
                  You are tracking well against your quarterly milestones! Keep it up!
                </span>
              ) : (
                <span className="text-amber-200 font-semibold">
                  Slight pace gap detected. Schedule a check-in with your lead to unblock targets.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-center">
              <ProgressRing
                progress={overallProgress}
                size={82}
                strokeWidth={7}
                color="#ffffff"
              />
              <span className="text-[10px] text-teal-100 font-semibold block mt-1">Overall</span>
            </div>
            <div className="space-y-1.5 text-xs text-teal-50">
              <div>
                Active Goals: <strong className="text-white">{activeObjs.length}</strong>
              </div>
              <div>
                Key Results: <strong className="text-white">{myKRs.length}</strong>
              </div>
              <div>
                On Track KRs:{' '}
                <strong className="text-white">
                  {myKRs.filter((k) => k.status === 'On Track').length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: My Objectives + Meetings + Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: My Assigned OKRs across departments (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  My Active OKRs & Cross-Department Alignments
                </h3>
                <span className="text-[11px] text-slate-400">
                  Goals owned by you across Sales, Engineering, and Marketing
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/okrs')}
                className="text-[#0e7490] font-semibold text-xs"
              >
                View Full OKR Module &gt;
              </Button>
            </div>

            <div className="space-y-3">
              {myObjectives.map((obj) => {
                const krs = storeKRs.filter((k) => k.objectiveId === obj.id);
                const dept = db.departments.find((d) => d.id === obj.departmentId);

                return (
                  <div
                    key={obj.id}
                    className="p-4 rounded-xl border border-slate-200/90 hover:border-teal-400 bg-slate-50/40 hover:bg-white transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {dept?.name || 'Department'}
                          </span>
                          <ObjectiveStatusPill status={obj.status} />
                          {obj.status === 'Active' && <ObjectiveHealthChip health={obj.health} />}
                        </div>
                        <h4
                          onClick={() => navigate(`/okrs/${obj.id}`)}
                          className="font-bold text-sm text-slate-900 hover:text-[#0e7490] cursor-pointer"
                        >
                          {obj.title}
                        </h4>
                      </div>

                      <div className="w-36 flex-shrink-0">
                        <ObjectiveProgressDisplay
                          status={obj.status}
                          progress={obj.progress || 0}
                          expectedProgress={cycleExpectedPace}
                          showLabels
                          compact
                        />
                      </div>
                    </div>

                    {/* Associated KRs */}
                    {krs.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        {krs.map((kr) => (
                          <div
                            key={kr.id}
                            className="p-2 rounded-lg bg-white border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate max-w-xs">
                              <Tag className="w-3 h-3 text-[#0e7490] flex-shrink-0" />
                              <span className="truncate text-slate-800 font-medium">
                                {kr.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {obj.status === 'Draft' ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-slate-500">
                                    Target: {kr.baseline} → {kr.target}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-semibold text-[10px] border border-slate-200">
                                    Draft (Inactive)
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <span className="font-mono text-[11px] font-bold text-slate-700">
                                    {kr.achievementPercent}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedKRForUpdate(kr)}
                                    className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold text-[11px] border border-teal-200 transition-colors"
                                  >
                                    Check-in
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Meetings & Feeds (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Meetings & Plans */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Meetings & Plans</h3>
                <span className="text-[11px] text-slate-400">Scheduled 1-on-1s and syncs</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsScheduleModalOpen(true)}
                className="text-xs px-2.5"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Schedule
              </Button>
            </div>

            {meetingsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No meetings scheduled. Request a 1-on-1 with your manager.
              </div>
            ) : (
              <div className="space-y-2.5">
                {meetingsList.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{m.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.date} · {m.time}
                      </div>
                    </div>
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-center rounded-lg bg-[#0e7490] text-white font-medium text-xs hover:bg-teal-800 transition-colors"
                    >
                      Join
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Feeds & Moments */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Team Feeds</h3>
                <span className="text-[11px] text-slate-400">Announcements & peer kudos</span>
              </div>
            </div>

            <div className="space-y-3">
              {feedsList.slice(0, 3).map((feed) => {
                const author = db.users.find((u) => u.id === feed.authorId);
                return (
                  <div
                    key={feed.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {author?.avatar || 'S'}
                        </div>
                        <span className="font-semibold text-xs text-slate-900">
                          {author?.name || 'Manager'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        {feed.badge || feed.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{feed.content}</p>

                    <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleLikeFeed(feed.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          feed.likedByCurrentUser ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            feed.likedByCurrentUser ? 'fill-rose-600' : ''
                          }`}
                        />
                        <span>{feed.likes}</span>
                      </button>
                      <span>{feed.commentsCount} comments</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Update Drawer */}
      {selectedKRForUpdate && (
        <UpdateProgressDrawer
          isOpen={Boolean(selectedKRForUpdate)}
          onClose={() => setSelectedKRForUpdate(null)}
          keyResult={selectedKRForUpdate}
          onSuccess={() => {
            refreshStore();
            setSelectedKRForUpdate(null);
          }}
        />
      )}

      {/* Schedule 1-on-1 Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Request 1-on-1 with Manager"
      >
        <form onSubmit={handleScheduleRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Discussion Agenda</label>
            <input
              type="text"
              value={meetingTopic}
              onChange={(e) => setMeetingTopic(e.target.value)}
              placeholder="e.g., Q4 Pacing review & obstacle alignment"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time</label>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="02:00 PM - 02:30 PM"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsScheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
