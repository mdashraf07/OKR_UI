import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Inbox,
  AlertTriangle,
  Clock,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Role, User, Cycle, Objective, KeyResult, ApprovalStep } from '../../types';
import { getDb } from '../../api/mockDb';

interface NextStepsCardProps {
  role: Role;
  currentUser: User | null;
  currentCycle: Cycle;
  objectives: Objective[];
  allKRs: KeyResult[];
  approvals: ApprovalStep[];
  overallProgress: number;
  cycleExpectedPace: number;
}

export const NextStepsCard: React.FC<NextStepsCardProps> = ({
  role,
  currentUser,
  currentCycle,
  objectives,
  allKRs,
  approvals,
  overallProgress,
  cycleExpectedPace,
}) => {
  const navigate = useNavigate();
  const db = getDb();
  const asOfDate = new Date(db.devSettings.demoDate);

  if (role === 'EMPLOYEE') {
    // 1. Create Objective (done if >= 1 objective)
    const hasObjective = objectives.length > 0;
    const firstObj = objectives[0];

    // 2. Add KRs until weightage = 100% (done if any objective has total KR weightage = 100)
    const hasFullWeightage = objectives.some((o) => {
      const krs = allKRs.filter((k) => k.objectiveId === o.id);
      return krs.reduce((sum, k) => sum + k.weightage, 0) === 100;
    });

    // 3. Submit for Review (done if any objective submitted or beyond draft)
    const hasSubmitted = objectives.some((o) => o.approvalState !== 'NotSubmitted' || o.status === 'Active');

    // 4. Update Progress (done if any KR has measurements or progress updated)
    const hasProgressUpdated = allKRs.some((k) => k.current !== k.baseline || k.achievementPercent > 0);

    const checklist = [
      {
        id: 'create',
        title: '1. Create Objective',
        description: hasObjective
          ? `Created "${firstObj?.title.slice(0, 32)}..."`
          : 'Define your primary objective for this cycle.',
        isDone: hasObjective,
        link: hasObjective ? `/okrs/${firstObj?.id}` : '/okrs/new',
        actionLabel: hasObjective ? 'View Objective' : 'Create Now',
      },
      {
        id: 'krs',
        title: '2. Add Key Results (100% Weightage)',
        description: hasFullWeightage
          ? 'Key results configured with 100% total weightage.'
          : 'Attach measurable metrics totaling exactly 100% weightage.',
        isDone: hasFullWeightage,
        link: firstObj ? `/okrs/${firstObj.id}` : '/okrs/new',
        actionLabel: hasFullWeightage ? 'Manage KRs' : 'Configure KRs',
      },
      {
        id: 'submit',
        title: '3. Submit for Manager Approval',
        description: hasSubmitted
          ? 'Submitted for managerial governance review.'
          : 'Submit your completed OKR package to your line manager.',
        isDone: hasSubmitted,
        link: firstObj ? `/okrs/${firstObj.id}` : '/okrs',
        actionLabel: hasSubmitted ? 'Track Approval' : 'Submit Review',
      },
      {
        id: 'progress',
        title: '4. Update Progress & Check-ins',
        description: hasProgressUpdated
          ? 'Progress updates and check-in records logged.'
          : 'Record metric progress and submit weekly check-ins.',
        isDone: hasProgressUpdated,
        link: '/check-ins',
        actionLabel: hasProgressUpdated ? 'View Check-ins' : 'Log Progress',
      },
    ];

    const completedCount = checklist.filter((c) => c.isDone).length;

    return (
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Your OKR Journey & Next Steps</h2>
              <p className="text-[11px] text-slate-500">
                {completedCount} of 4 steps completed for {currentCycle.name}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
            {completedCount === 4 ? 'All Set! Keep Pace' : 'Action Required'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {checklist.map((step) => (
            <div
              key={step.id}
              onClick={() => navigate(step.link)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                step.isDone
                  ? 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                  : 'bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50/60 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {step.isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      step.isDone ? 'text-slate-800 line-through opacity-80' : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {step.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#1a7260] group-hover:underline">
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (role === 'MANAGER') {
    const waitingApprovals = approvals.filter(
      (s) => s.status === 'PENDING' && s.approverId === currentUser?.id
    ).length;

    const unreviewedCheckIns = db.checkIns.filter((c) => c.status === 'SUBMITTED').length;

    const teamRiskKRs = allKRs.filter(
      (k) => k.status === 'At Risk' || k.status === 'In Trouble'
    ).length;

    const managerItems = [
      {
        id: 'approvals',
        icon: <Inbox className="w-4 h-4 text-amber-600" />,
        title: 'Pending Submissions',
        count: waitingApprovals,
        description:
          waitingApprovals > 0
            ? `${waitingApprovals} objective${waitingApprovals === 1 ? '' : 's'} awaiting your review`
            : 'All employee submissions reviewed.',
        link: '/approvals',
        urgent: waitingApprovals > 0,
      },
      {
        id: 'checkins',
        icon: <CheckSquare className="w-4 h-4 text-[#2d8fd8]" />,
        title: 'Check-ins to Review',
        count: unreviewedCheckIns,
        description:
          unreviewedCheckIns > 0
            ? `${unreviewedCheckIns} periodic check-in${unreviewedCheckIns === 1 ? '' : 's'} submitted`
            : 'No check-ins waiting for feedback.',
        link: '/check-ins',
        urgent: unreviewedCheckIns > 0,
      },
      {
        id: 'atrisk',
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        title: 'Team KRs at Risk',
        count: teamRiskKRs,
        description:
          teamRiskKRs > 0
            ? `${teamRiskKRs} Key Result${teamRiskKRs === 1 ? '' : 's'} lagging behind target pace`
            : 'All team metrics on track.',
        link: '/team',
        urgent: teamRiskKRs > 0,
      },
    ];

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1a7260]" />
            <h2 className="text-sm font-bold text-slate-800">Manager Next Steps & Action Queue</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Team Leadership</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {managerItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group hover:shadow-sm ${
                item.urgent
                  ? 'bg-amber-50/30 border-amber-200 hover:bg-amber-50/50'
                  : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#1a7260] group-hover:underline">
                <span>View & Take Action</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // HR_ADMIN Next steps
  const lvl2Pending = db.approvalSteps.filter((s) => s.status === 'PENDING' && s.stage === 2).length;

  const overdueApprovals = db.approvalSteps.filter((s) => {
    if (s.status !== 'PENDING') return false;
    const daysWaiting = Math.max(
      0,
      Math.round((asOfDate.getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    );
    return daysWaiting >= 3;
  }).length;

  const cyclePaceGap = overallProgress - cycleExpectedPace;

  const hrItems = [
    {
      id: 'lvl2',
      icon: <Inbox className="w-4 h-4 text-purple-600" />,
      title: 'Waiting for Level 2 Sign-off',
      count: lvl2Pending,
      description:
        lvl2Pending > 0
          ? `${lvl2Pending} objective${lvl2Pending === 1 ? '' : 's'} endorsed by managers awaiting HR approval`
          : 'No level 2 items pending.',
      link: '/approvals',
      urgent: lvl2Pending > 0,
    },
    {
      id: 'cyclehealth',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
      title: 'Cycle Health Governance',
      count: `${overallProgress}%`,
      description:
        cyclePaceGap >= -10
          ? `Cycle is healthy: ${overallProgress}% progress vs ${cycleExpectedPace}% expected target.`
          : `Pace lag detected: ${overallProgress}% progress vs ${cycleExpectedPace}% expected pace target.`,
      link: '/admin/cycles',
      urgent: cyclePaceGap < -10,
    },
    {
      id: 'overdue',
      icon: <Clock className="w-4 h-4 text-red-500" />,
      title: 'Overdue Approvals (3+ Days)',
      count: overdueApprovals,
      description:
        overdueApprovals > 0
          ? `${overdueApprovals} approval action${overdueApprovals === 1 ? '' : 's'} waiting >= 3 days`
          : 'Zero overdue review bottlenecks.',
      link: '/approvals',
      urgent: overdueApprovals > 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1a7260]" />
          <h2 className="text-sm font-bold text-slate-800">HR / Admin Governance & Next Steps</h2>
        </div>
        <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
          Executive Oversight
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {hrItems.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.link)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group hover:shadow-sm ${
              item.urgent
                ? 'bg-purple-50/30 border-purple-200 hover:bg-purple-50/60'
                : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-xs font-bold text-slate-800">{item.title}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    item.urgent ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.count}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#1a7260] group-hover:underline">
              <span>View & Manage</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
