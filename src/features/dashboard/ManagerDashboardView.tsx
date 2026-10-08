import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pause,
  Calendar,
  Plus,
  Heart,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  TrendingUp,
  Link as LinkIcon,
  Check,
  Send,
  Building2,
  Tag,
  Smile,
  Megaphone,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useOkrStore } from '../okr/okrStore';
import { getDb, saveDb } from '../../api/mockDb';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../components/ui/Toast';
import { KRStatusChip, ObjectiveStatusPill, ObjectiveHealthChip } from '../../components/ui/Chips';
import { calculateExpectedProgress } from '../../lib/calculations';
import { FeedMoment, MeetingItem, TaskItem, Objective, KeyResult } from '../../types';

export const ManagerDashboardView: React.FC = () => {
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

  // Discipline table expand/collapse
  const [isDisciplineExpanded, setIsDisciplineExpanded] = useState(false);

  // Actions Tab
  const [actionTab, setActionTab] = useState<'pending' | 'upcoming'>('pending');

  // Feeds Filter Tab
  const [feedFilter, setFeedFilter] = useState<'all' | 'recognition' | 'announcements'>('all');
  const [feedsList, setFeedsList] = useState<FeedMoment[]>(db.feeds || []);

  // Meetings
  const [meetingsList, setMeetingsList] = useState<MeetingItem[]>(db.meetings || []);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingType, setNewMeetingType] = useState<MeetingItem['type']>('1-on-1');
  const [newMeetingDate, setNewMeetingDate] = useState('2026-10-14');
  const [newMeetingTime, setNewMeetingTime] = useState('11:00 AM - 11:30 AM');
  const [newMeetingAttendeeId, setNewMeetingAttendeeId] = useState<number>(11);

  // Moments / Feeds modals
  const [isRecognizeModalOpen, setIsRecognizeModalOpen] = useState(false);
  const [recognizeTargetId, setRecognizeTargetId] = useState<number>(13);
  const [recognizeBadge, setRecognizeBadge] = useState('Excellence');
  const [recognizeNote, setRecognizeNote] = useState('');

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Manager Alignment Modal
  const [isAlignModalOpen, setIsAlignModalOpen] = useState(false);
  const [alignTargetMemberId, setAlignTargetMemberId] = useState<number>(11);
  const [alignGoalTitle, setAlignGoalTitle] = useState('');
  const [alignParentObjId, setAlignParentObjId] = useState<number>(1);
  const [alignTargetKpi, setAlignTargetKpi] = useState('Enterprise Deal Closing');
  const [alignBaseline, setAlignBaseline] = useState(0);
  const [alignTargetVal, setAlignTargetVal] = useState(10);

  // Direct reports (all users with managerId: currentUser.id or Santhiya's team)
  const managerId = currentUser?.id || 10;
  const directReports = db.users.filter(
    (u) => u.managerId === managerId || (managerId === 10 && u.id >= 11 && u.id <= 20)
  );

  // Tasks
  const [tasksList, setTasksList] = useState<TaskItem[]>(db.tasks || []);

  const handleToggleTask = (taskId: number) => {
    setTasksList((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'Completed' ? 'Open' : 'Completed' }
          : t
      )
    );
  };

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

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    const newFeed: FeedMoment = {
      id: Date.now(),
      authorId: currentUser?.id || 10,
      type: 'Announcement',
      title: announcementTitle.trim(),
      content: announcementContent.trim(),
      badge: 'Corporate',
      likes: 1,
      likedByCurrentUser: true,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newFeed, ...feedsList];
    setFeedsList(updated);
    db.feeds = updated;
    saveDb();
    setIsAnnouncementModalOpen(false);
    setAnnouncementTitle('');
    setAnnouncementContent('');
    showToast({ type: 'success', message: 'Team announcement posted successfully!' });
  };

  const handleCreateRecognition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recognizeNote.trim()) return;

    const targetUser = db.users.find((u) => u.id === Number(recognizeTargetId));
    const newFeed: FeedMoment = {
      id: Date.now(),
      authorId: currentUser?.id || 10,
      type: 'Recognition',
      title: `Kudos to ${targetUser?.name || 'Team Member'}!`,
      content: recognizeNote.trim(),
      badge: recognizeBadge,
      targetUserId: Number(recognizeTargetId),
      likes: 1,
      likedByCurrentUser: true,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newFeed, ...feedsList];
    setFeedsList(updated);
    db.feeds = updated;
    saveDb();
    setIsRecognizeModalOpen(false);
    setRecognizeNote('');
    showToast({ type: 'success', message: `Recognition sent to ${targetUser?.name}!` });
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) return;

    const newMeeting: MeetingItem = {
      id: Date.now(),
      title: newMeetingTitle.trim(),
      type: newMeetingType,
      date: newMeetingDate,
      time: newMeetingTime,
      durationMinutes: 30,
      organizerId: currentUser?.id || 10,
      attendeeIds: [currentUser?.id || 10, Number(newMeetingAttendeeId)],
      meetingLink: 'https://meet.brandcrock.com/1on1-sync',
      notes: 'Scheduled from Manager Dashboard',
    };

    const updated = [...meetingsList, newMeeting];
    setMeetingsList(updated);
    db.meetings = updated;
    saveDb();
    setIsScheduleModalOpen(false);
    setNewMeetingTitle('');
    showToast({ type: 'success', message: 'Meeting scheduled successfully!' });
  };

  const handleAlignObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alignGoalTitle.trim()) return;

    const targetUser = db.users.find((u) => u.id === Number(alignTargetMemberId));
    const newObjId = Date.now();

    const newObj: Objective = {
      id: newObjId,
      cycleId: selectedCycleId,
      ownerId: Number(alignTargetMemberId),
      level: 'Individual',
      departmentId: targetUser?.departmentId || 1,
      parentObjectiveId: Number(alignParentObjId),
      title: alignGoalTitle.trim(),
      description: `Aligned directly by Manager ${currentUser?.name} to support strategic milestone.`,
      startDate: currentCycle.startDate,
      endDate: currentCycle.endDate,
      weightage: 50,
      status: 'Active',
      health: 'On Track',
      progress: 0,
      approvalState: 'Approved',
      submissionNo: 1,
      createdBy: currentUser?.id || 10,
      createdAt: new Date().toISOString(),
      perspective: 'Customer',
      visibility: 'Public',
      priority: 'High',
    };

    db.objectives.push(newObj);

    // Create Key Result under this aligned objective
    const newKR: KeyResult = {
      id: newObjId + 1,
      objectiveId: newObjId,
      ownerId: Number(alignTargetMemberId),
      name: `Achieve target for ${alignTargetKpi}`,
      measurementTypeId: 1,
      direction: 'INCREASE',
      baseline: Number(alignBaseline),
      target: Number(alignTargetVal),
      current: Number(alignBaseline),
      achievementPercent: 0,
      weightage: 100,
      startDate: currentCycle.startDate,
      targetDate: currentCycle.endDate,
      status: 'On Track',
      statusOverridden: false,
      createdBy: currentUser?.id || 10,
      createdAt: new Date().toISOString(),
      kpiName: alignTargetKpi,
    };

    db.keyResults.push(newKR);
    saveDb();
    refreshStore();

    setIsAlignModalOpen(false);
    setAlignGoalTitle('');
    showToast({
      type: 'success',
      message: `Goal & Key Result aligned directly to ${targetUser?.name}!`,
    });
  };

  const filteredFeeds = feedsList.filter((f) => {
    if (feedFilter === 'recognition') return f.type === 'Recognition';
    if (feedFilter === 'announcements') return f.type === 'Announcement';
    return true;
  });

  const visibleDiscipline = isDisciplineExpanded
    ? db.discipline
    : (db.discipline || []).slice(0, 5);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Greeting (Directly imitating Video) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
            Hello, <span className="text-[#0e7490]">{currentUser?.name || 'Santhiya'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Here's what needs your attention today
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsScheduleModalOpen(true)}
            leftIcon={<Calendar className="w-4 h-4 text-[#0e7490]" />}
          >
            Schedule Meeting
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAlignModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Align Goal / KR
          </Button>
        </div>
      </div>

      {/* 2. Main 2-Column Responsive Dashboard Layout (Matching Video Architecture) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Discipline, Actions, Tasks, Meetings (7 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Team check-in discipline */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Team check-in discipline
                  </h2>
                  <span className="text-[11px] text-slate-400">Weekly submission status</span>
                </div>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3" /> On-time 9
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" /> Late 1
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="w-3 h-3" /> Missed 1
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  <Pause className="w-3 h-3" /> Paused 1
                </span>
              </div>
            </div>

            {/* Discipline Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3 text-center w-20">On time</th>
                    <th className="py-2.5 px-3 text-center w-20">Late</th>
                    <th className="py-2.5 px-3 text-center w-20">Missed</th>
                    <th className="py-2.5 px-3 text-center w-20">Paused</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleDiscipline.map((member) => (
                    <tr key={member.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-xs">
                            {member.avatar}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-xs">
                              {member.userName}
                            </span>
                            <span className="text-[10px] text-slate-400">{member.title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {member.onTime > 0 ? (
                          <div className="w-5 h-5 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {member.late > 0 ? (
                          <div className="w-5 h-5 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                            {member.late}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {member.missed > 0 ? (
                          <div className="w-5 h-5 mx-auto rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px]">
                            {member.missed}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {member.paused > 0 ? (
                          <div className="w-5 h-5 mx-auto rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                            <Pause className="w-2.5 h-2.5" />
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Collapse / Expand Toggle */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDisciplineExpanded(!isDisciplineExpanded)}
                className="text-xs font-semibold text-[#0e7490] hover:text-teal-800 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                {isDisciplineExpanded ? (
                  <>
                    Collapse <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    View all {db.discipline.length} team members{' '}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card B: Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Actions</h2>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActionTab('pending')}
                  className={`px-3 py-1 rounded-full font-semibold transition-all ${
                    actionTab === 'pending'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Pending <span className="font-bold">2</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionTab('upcoming')}
                  className={`px-3 py-1 rounded-full font-semibold transition-all ${
                    actionTab === 'upcoming'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Upcoming <span className="font-bold">3</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Scheduled for Oct 09 to Oct 15 · Q4 Active Cycle
            </div>

            {/* Alert / Attention Banner (Matching Video) */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    1 Project / Goal requires your attention
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Gowri S: Automated Regression Suite pace is lagging behind pace target
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate('/team')}
                className="border-amber-300 text-amber-900 hover:bg-amber-100"
              >
                Review Pacing
              </Button>
            </div>
          </div>

          {/* Card C: Tasks Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Tasks Snapshot</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  Total: <strong className="text-slate-800">{tasksList.length}</strong>
                </span>
                <span>
                  Open:{' '}
                  <strong className="text-amber-600">
                    {tasksList.filter((t) => t.status !== 'Completed').length}
                  </strong>
                </span>
                <span>
                  Completed:{' '}
                  <strong className="text-emerald-600">
                    {tasksList.filter((t) => t.status === 'Completed').length}
                  </strong>
                </span>
              </div>
            </div>

            {/* Task Checklist Items */}
            <div className="space-y-2">
              {tasksList.slice(0, 4).map((task) => {
                const isDone = task.status === 'Completed';
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 hover:border-teal-400 text-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium">{task.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{task.dueDate}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          task.priority === 'High'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card D: Meetings */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Meetings</h2>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="text-xs font-semibold text-[#0e7490] hover:text-teal-800 flex items-center gap-1"
              >
                Schedule Meeting &gt;
              </button>
            </div>

            {meetingsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                You don't have any meetings scheduled today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {meetingsList.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-teal-700 flex flex-col items-center justify-center font-bold text-xs shadow-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{meeting.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {meeting.date} · {meeting.time}
                        </div>
                      </div>
                    </div>

                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-center rounded-lg bg-[#0e7490] text-white font-medium text-xs hover:bg-teal-800 transition-colors"
                    >
                      Join Sync
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Feeds & Moments (5 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-5">
            {/* Feeds Top Header with "Recognize" Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Feeds</h2>
                <span className="text-[11px] text-slate-400">Team recognition & updates</span>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsRecognizeModalOpen(true)}
                className="bg-[#0e7490] hover:bg-teal-800 text-xs px-3.5"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Recognize
              </Button>
            </div>

            {/* "Create a Moment" Quick Action Cards (Matching Video) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 block">Create a Moment</span>
              <div className="grid grid-cols-2 gap-3">
                {/* Moment 1: Announcement */}
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50/60 hover:bg-teal-50/30 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-teal-900">
                    Announcement
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Share important news & updates with your team
                  </p>
                </button>

                {/* Moment 2: Add Media / Shoutout */}
                <button
                  type="button"
                  onClick={() => setIsRecognizeModalOpen(true)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50/60 hover:bg-teal-50/30 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">
                    Add Media / Kudos
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Share a highlight or shoutout from team work
                  </p>
                </button>
              </div>
            </div>

            {/* Feeds Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setFeedFilter('all')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  feedFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Everything
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('recognition')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  feedFilter === 'recognition'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Recognition
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('announcements')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  feedFilter === 'announcements'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Announcements
              </button>
            </div>

            {/* Feeds Stream Cards */}
            <div className="space-y-4">
              {filteredFeeds.map((feed) => {
                const author = db.users.find((u) => u.id === feed.authorId);
                const targetUser = feed.targetUserId
                  ? db.users.find((u) => u.id === feed.targetUserId)
                  : null;

                return (
                  <div
                    key={feed.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                  >
                    {/* Feed Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                          {author?.avatar || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {author?.name || 'Santhiya'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(feed.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {feed.badge || feed.type}
                      </span>
                    </div>

                    {/* Announcement Title & Content */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 mb-1">{feed.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{feed.content}</p>
                    </div>

                    {/* Target user callout if recognition */}
                    {targetUser && (
                      <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-100 flex items-center gap-2 text-xs text-teal-900">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span>
                          Celebrating <strong>{targetUser.name}</strong> ({targetUser.title})
                        </span>
                      </div>
                    )}

                    {/* Corporate Badge Graphic / Trophy placeholder */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-between text-xs text-teal-900">
                      <div className="flex items-center gap-2 font-semibold">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>Corporate OKR Achievement</span>
                      </div>
                      <span className="text-[10px] text-teal-700 font-mono">Q4 Sprint</span>
                    </div>

                    {/* Interaction Buttons (Like & Comment) */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleLikeFeed(feed.id)}
                        className={`flex items-center gap-1.5 hover:text-rose-600 transition-colors ${
                          feed.likedByCurrentUser ? 'text-rose-600 font-bold' : ''
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            feed.likedByCurrentUser ? 'fill-rose-600' : ''
                          }`}
                        />
                        <span>{feed.likes}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>{feed.commentsCount} comments</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Team OKR Performance & Live Pacing Oversight */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Connected Pacing & Real-time Oversight
              </span>
              <span className="text-xs text-slate-400">· Expected Pace: {cycleExpectedPace}%</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Team OKR Performance ({directReports.length} Members)
            </h2>
            <p className="text-xs text-slate-500">
              Align, track, and monitor individual key result contributions across your team.
            </p>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsAlignModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5 text-[#0e7490]" />}
          >
            + Align Goal to Member
          </Button>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {directReports.map((member) => {
            const memberObjs = storeObjectives.filter(
              (o) => o.ownerId === member.id && o.cycleId === selectedCycleId
            );
            const memberKRs = storeKRs.filter((k) =>
              memberObjs.some((o) => o.id === k.objectiveId)
            );
            const activeObjs = memberObjs.filter((o) => o.status === 'Active');
            const avgProgress =
              activeObjs.length > 0
                ? Math.round(
                    activeObjs.reduce((s, o) => s + (o.progress || 0), 0) / activeObjs.length
                  )
                : 0;

            return (
              <div
                key={member.id}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-teal-400 bg-slate-50/40 hover:bg-white transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                      {member.avatar || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{member.name}</div>
                      <div className="text-[10px] text-slate-400">{member.title}</div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-800">{avgProgress}%</span>
                </div>

                <ProgressBar
                  progress={avgProgress}
                  expectedProgress={cycleExpectedPace}
                  showLabels
                />

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {memberObjs.length} Goals · {memberKRs.length} KRs
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/team')}
                    className="font-semibold text-[#0e7490] hover:underline"
                  >
                    View OKRs &gt;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Schedule Meeting Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Team OKR Meeting"
      >
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Topic</label>
            <input
              type="text"
              value={newMeetingTitle}
              onChange={(e) => setNewMeetingTitle(e.target.value)}
              placeholder="e.g., Weekly 1-on-1 OKR Progress Review"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Type</label>
              <select
                value={newMeetingType}
                onChange={(e) => setNewMeetingType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white outline-none"
              >
                <option value="1-on-1">1-on-1 Review</option>
                <option value="Team Sync">Team Sync</option>
                <option value="OKR Review">OKR Review</option>
                <option value="Quarterly Planning">Quarterly Planning</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attendee</label>
              <select
                value={newMeetingAttendeeId}
                onChange={(e) => setNewMeetingAttendeeId(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white outline-none"
              >
                {directReports.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={newMeetingDate}
                onChange={(e) => setNewMeetingDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
              <input
                type="text"
                value={newMeetingTime}
                onChange={(e) => setNewMeetingTime(e.target.value)}
                placeholder="10:00 AM - 10:30 AM"
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
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Recognize Team Member Modal */}
      <Modal
        isOpen={isRecognizeModalOpen}
        onClose={() => setIsRecognizeModalOpen(false)}
        title="Send Kudos & Recognition"
      >
        <form onSubmit={handleCreateRecognition} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Team Member</label>
            <select
              value={recognizeTargetId}
              onChange={(e) => setRecognizeTargetId(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white outline-none"
            >
              {directReports.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Badge</label>
            <div className="grid grid-cols-3 gap-2">
              {['Excellence', 'Speed Demon', 'Team Player', 'Innovator', 'Superstar'].map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setRecognizeBadge(b)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                    recognizeBadge === b
                      ? 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Recognition Message</label>
            <textarea
              rows={3}
              value={recognizeNote}
              onChange={(e) => setRecognizeNote(e.target.value)}
              placeholder="What exceptional effort or OKR milestone are you celebrating?"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRecognizeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Post Recognition
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Create Announcement Modal */}
      <Modal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        title="Post Team Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Headline</label>
            <input
              type="text"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="e.g., Applause for exceptional efforts!"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Body</label>
            <textarea
              rows={4}
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              placeholder="Share milestone announcements, deadlines, or strategic reminders..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAnnouncementModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Publish Announcement
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Manager Direct Goal & KR Alignment Modal */}
      <Modal
        isOpen={isAlignModalOpen}
        onClose={() => setIsAlignModalOpen(false)}
        title="Align Objective or KR to Team Member"
      >
        <form onSubmit={handleAlignObjective} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Member</label>
            <select
              value={alignTargetMemberId}
              onChange={(e) => setAlignTargetMemberId(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white outline-none"
            >
              {directReports.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Objective Title</label>
            <input
              type="text"
              value={alignGoalTitle}
              onChange={(e) => setAlignGoalTitle(e.target.value)}
              placeholder="e.g., Accelerate High-Touch Enterprise Pipeline"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parent Strategic Goal</label>
            <select
              value={alignParentObjId}
              onChange={(e) => setAlignParentObjId(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white outline-none"
            >
              {db.objectives
                .filter((o) => o.level === 'Organization' || o.level === 'Department')
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    [{o.level}] {o.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">KPI Name</label>
              <input
                type="text"
                value={alignTargetKpi}
                onChange={(e) => setAlignTargetKpi(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Baseline</label>
              <input
                type="number"
                value={alignBaseline}
                onChange={(e) => setAlignBaseline(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target</label>
              <input
                type="number"
                value={alignTargetVal}
                onChange={(e) => setAlignTargetVal(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAlignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Align & Assign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
