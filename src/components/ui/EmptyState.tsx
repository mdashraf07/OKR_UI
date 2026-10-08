import React from 'react';
import { Folder, Inbox, Search } from 'lucide-react';

import { Button } from './Button';

export interface EmptyStateProps {
  icon?: 'folder' | 'inbox' | 'search' | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode | { label: string; onClick: () => void };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder',
  title,
  description,
  action,
  className = '',
}) => {
  const renderIcon = () => {
    if (typeof icon !== 'string') return icon;
    switch (icon) {
      case 'inbox':
        return <Inbox className="w-10 h-10 text-[#2d8fd8]" />;
      case 'search':
        return <Search className="w-10 h-10 text-[#2d8fd8]" />;
      case 'folder':
      default:
        return <Folder className="w-10 h-10 text-[#2d8fd8]" />;
    }
  };

  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      return (
        <Button variant="primary" size="sm" onClick={(action as any).onClick}>
          {(action as any).label}
        </Button>
      );
    }
    return action as React.ReactNode;
  };

  return (
    <div
      className={`w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}
    >
      <div className="w-20 h-20 rounded-2xl bg-sky-50 border border-sky-100/80 flex items-center justify-center mb-4 shadow-sm">
        {renderIcon()}
      </div>
      <h3 className="text-base font-semibold text-[#1e293b] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#64748b] max-w-md mb-5">{description}</p>}
      {action && <div className="mt-1 flex items-center gap-3">{renderAction()}</div>}
    </div>
  );
};
