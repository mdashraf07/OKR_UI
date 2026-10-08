import React from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton, CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToastStore } from '../../components/ui/Toast';

export const StatesGalleryPage: React.FC = () => {
  const { showToast } = useToastStore();

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 mb-2 inline-block">
          Section 11.15 & 14 States Gallery
        </span>
        <h1 className="text-2xl font-bold text-[#1e293b]">UI States & Validation Gallery</h1>
        <p className="text-xs text-[#64748b] mt-1">
          Review all empty states, skeleton loaders, validation error cues, alert banners, and system error designs in one place.
        </p>
      </div>

      {/* 1. Validation & Error States */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1e293b]">Validation & Error Messages (Section 14)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Required Field Rule" error="Objective name is required." required />
          <Input label="Name Length Rule" value="Hi" error="Name must be 3 to 255 characters." />
          <Input
            label="Weightage Rule"
            value="90"
            error="KR weightages must total 100. Currently 90."
          />
          <Input
            label="Directional Target Rule"
            value="5"
            error="For INCREASE the target must be higher than the baseline. For DECREASE it must be lower."
          />
        </div>

        {/* Error Banners */}
        <div className="pt-4 space-y-3">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-red-800">Something went wrong. Try again.</div>
              <div className="text-[11px] text-red-600 mt-0.5">
                500 Internal Server Error (Reference: ERR-SIM-500). Please check your connection or contact IT.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-amber-900">Returned for changes by Manager</div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                "Please split KR 2 into two measurable targets and clarify target cohort."
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toast Showcase */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-[#1e293b] mb-4">Interactive Semantic Toasts</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => showToast({ type: 'success', message: 'Progress updated successfully' })}
          >
            Show Success Toast
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              showToast({
                type: 'info',
                message: 'Draft saved just now',
                onUndo: () => alert('Undo action triggered'),
              })
            }
          >
            Show Toast with Undo
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => showToast({ type: 'error', message: 'Failed to submit objective' })}
          >
            Show Error Toast
          </Button>
        </div>
      </div>

      {/* 3. Skeleton Loading States */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#1e293b]">Skeleton Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <Skeleton height={24} width={180} />
            <Skeleton height={14} className="w-full" />
            <Skeleton height={14} className="w-3/4" />
            <TableSkeleton rows={3} />
          </div>
        </div>
      </div>

      {/* 4. Empty States Gallery */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#1e293b]">Empty States (Section 14.2)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EmptyState
            icon="folder"
            title="No objectives yet"
            description="Create your first objective or start from a pre-approved template."
            action={<Button size="sm">Create objective</Button>}
          />
          <EmptyState
            icon="inbox"
            title="Nothing is waiting for approval"
            description="You are all caught up on pending review requests."
          />
          <EmptyState
            icon="search"
            title="No results match your filters"
            description="Try clearing search filters or selecting another cycle."
            action={<Button size="sm" variant="secondary">Clear filters</Button>}
          />
        </div>
      </div>
    </div>
  );
};
