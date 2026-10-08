import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCode,
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getAuditLog, getUsers } from '../../api';
import { AuditEntry, User as UserType } from '../../types';
import { format } from 'date-fns';

export const AuditLogPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');

  // Selected Detail Modal
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [aList, uList] = await Promise.all([getAuditLog(), getUsers()]);
        setEntries(aList);
        setUsers(uList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const usersMap = useMemo(() => {
    const map = new Map<number, UserType>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (tableFilter !== 'ALL' && e.table !== tableFilter) return false;
      if (actionFilter !== 'ALL' && e.action !== actionFilter) return false;
      if (userFilter !== 'ALL' && e.actionBy !== Number(userFilter)) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const userName = usersMap.get(e.actionBy)?.name.toLowerCase() || '';
        const matchRemarks = e.remarks?.toLowerCase().includes(q);
        const matchTable = e.table.toLowerCase().includes(q);
        if (!userName.includes(q) && !matchRemarks && !matchTable) {
          return false;
        }
      }
      return true;
    });
  }, [entries, tableFilter, actionFilter, userFilter, searchTerm, usersMap]);

  const getActionBadge = (action: AuditEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SUBMIT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'APPROVE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'REJECT':
      case 'RETURN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'OVERRIDE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            System Compliance & Audit Trail
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Immutable log of all OKR lifecycle actions, approvals, calculations, and administrator overrides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Append-Only Audit Security
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by user, remarks, or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            aria-label="Filter by Target Entity"
            className="text-xs px-3 py-2 border border-border rounded-lg bg-white text-text-secondary focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Entities</option>
            <option value="Objectives">Objectives</option>
            <option value="KeyResults">Key Results</option>
            <option value="ApprovalSteps">Approval Steps</option>
            <option value="CheckIns">Check-ins</option>
            <option value="Scores">Scores</option>
            <option value="Cycles">Cycles</option>
            <option value="Templates">Templates</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by Action Type"
            className="text-xs px-3 py-2 border border-border rounded-lg bg-white text-text-secondary focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="SUBMIT">SUBMIT</option>
            <option value="APPROVE">APPROVE</option>
            <option value="RETURN">RETURN</option>
            <option value="REJECT">REJECT</option>
            <option value="OVERRIDE">OVERRIDE</option>
          </select>

          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            aria-label="Filter by User"
            className="text-xs px-3 py-2 border border-border rounded-lg bg-white text-text-secondary focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title="No audit entries matched"
          description="Try broadening your filter criteria."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchTerm('');
              setTableFilter('ALL');
              setActionFilter('ALL');
              setUserFilter('ALL');
            },
          }}
        />
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-text-secondary font-semibold">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Remarks & Description</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((entry) => {
                  const actor = usersMap.get(entry.actionBy);
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="py-3 px-4 text-text-secondary whitespace-nowrap font-mono text-[11px]">
                        {format(new Date(entry.actionAt), 'dd MMM yyyy, hh:mm a')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {actor?.name.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary block">
                              {actor?.name || `User #${entry.actionBy}`}
                            </span>
                            <span className="text-[10px] text-text-muted">{actor?.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-text-primary font-medium">
                          {entry.table} #{entry.recordId}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(
                            entry.action
                          )}`}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary max-w-md truncate">
                        {entry.remarks || 'No remarks provided'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(entry);
                          }}
                        >
                          View Diff
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border bg-slate-50/50 flex items-center justify-between text-xs text-text-secondary">
            <span>Showing {filteredEntries.length} immutable audit records</span>
            <span className="text-[11px] text-text-muted">
              Records are cryptographically bound and tamper-evident.
            </span>
          </div>
        </div>
      )}

      {/* Detail Diff Modal */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={`Audit Record #${selectedEntry.id} Details`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-border grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-text-muted block">Entity & Record:</span>
                <span className="font-bold text-text-primary">
                  {selectedEntry.table} (ID: #{selectedEntry.recordId})
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Action:</span>
                <span className="font-bold text-primary">{selectedEntry.action}</span>
              </div>
              <div>
                <span className="text-text-muted block">Performed By:</span>
                <span className="font-bold text-text-primary">
                  {usersMap.get(selectedEntry.actionBy)?.name} (
                  {usersMap.get(selectedEntry.actionBy)?.role})
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Timestamp:</span>
                <span className="font-bold text-text-primary">
                  {format(new Date(selectedEntry.actionAt), 'dd MMM yyyy, hh:mm:ss a')}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-text-secondary block mb-1">
                Summary Remarks:
              </span>
              <p className="text-xs text-text-primary p-3 rounded-lg border border-border bg-white">
                {selectedEntry.remarks || 'No detailed remarks recorded.'}
              </p>
            </div>

            {selectedEntry.details && selectedEntry.details.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                  Field-Level Value Changes:
                </span>
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border text-xs">
                  {selectedEntry.details.map((diff, idx) => (
                    <div key={idx} className="p-3 bg-white grid grid-cols-3 gap-2 items-center">
                      <span className="font-mono font-bold text-text-primary">{diff.column}</span>
                      <span className="line-through text-rose-600 bg-rose-50 px-2 py-1 rounded truncate">
                        {String(diff.oldValue ?? 'null')}
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded truncate font-medium">
                        {String(diff.newValue ?? 'null')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-text-muted p-3 bg-slate-50 rounded-lg text-center">
                No granular column diffs recorded for this standard action.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
