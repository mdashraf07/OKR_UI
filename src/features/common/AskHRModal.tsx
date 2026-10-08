import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useToastStore } from '../../components/ui/Toast';

export interface AskHRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskHRModal: React.FC<AskHRModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'ask' | 'requests'>('ask');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [date, setDate] = useState('2026-10-08');
  const [slot, setSlot] = useState('10:00 AM - 11:00 AM');
  const [priority, setPriority] = useState('Medium');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myRequests, setMyRequests] = useState([
    {
      id: 'REQ-1082',
      date: '2026-10-06',
      slot: '02:00 PM - 03:00 PM',
      priority: 'High',
      reason: 'Clarification regarding Q4 Performance Appraisal Cycles and weights',
      status: 'Resolved',
    },
    {
      id: 'REQ-1081',
      date: '2026-09-28',
      slot: '11:00 AM - 12:00 PM',
      priority: 'Medium',
      reason: 'CTC Payslip reimbursement deduction query',
      status: 'Closed',
    },
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast({ type: 'warning', message: 'Please provide a reason or query.' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newReq = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        date,
        slot,
        priority,
        reason,
        status: 'Open',
      };
      setMyRequests([newReq, ...myRequests]);
      setIsSubmitting(false);
      setReason('');
      showToast({
        type: 'success',
        message: 'Your Ask HR query has been submitted to the HR Team!',
      });
      setActiveTab('requests');
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Ask HR</h2>
              <p className="text-xs text-slate-500">Employee Support & Direct Queries</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ask')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ask'
                ? 'bg-[#2d8fd8] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ask HR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-[#2d8fd8] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Requests ({myRequests.length})
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info Banner */}
          {showInfoBanner && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Ask HR allows you to connect directly with the HR team for support and queries.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoBanner(false)}
                className="text-[11px] font-semibold text-amber-700 hover:underline ml-2"
              >
                Hide
              </button>
            </div>
          )}

          {activeTab === 'ask' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Apply Ask HR</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-600"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Slot <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-600 bg-white"
                        required
                      >
                        <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                        <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                        <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                        <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-600 bg-white"
                      required
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason / Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter a reason or description of your query..."
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-600"
                      required
                    />
                  </div>
                </div>

                {/* Right Summary Box (matching video) */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between text-xs">
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                      Appointment Summary
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Priority:</span>
                      <span className="font-bold text-slate-800">{priority}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-semibold text-slate-800">30 Mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requested By:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[100px]">
                        {currentUser?.name || 'Employee'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 h-9 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/60 transition-colors flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{req.id}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {req.date} · {req.slot}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-2">{req.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Resolved' || req.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Priority: {req.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
