import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (val: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  value,
  onValueChange,
  variant = 'pill',
  className = '',
  children,
}) => {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={`w-full flex flex-col ${className}`}
    >
      <TabsPrimitive.List
        className={`flex items-center gap-1 ${
          variant === 'pill'
            ? 'bg-slate-100/80 p-1 rounded-xl w-fit'
            : 'border-b border-slate-200 gap-6'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === value;

          if (variant === 'pill') {
            return (
              <TabsPrimitive.Trigger
                key={tab.id}
                value={tab.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 select-none focus:outline-none ${
                  isActive
                    ? 'bg-[#2d8fd8] text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#1e293b] hover:bg-slate-200/50'
                }`}
              >
                {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            );
          }

          // Underline variant
          return (
            <TabsPrimitive.Trigger
              key={tab.id}
              value={tab.id}
              className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-all duration-150 select-none focus:outline-none -mb-px ${
                isActive
                  ? 'border-[#2d8fd8] text-[#2d8fd8] font-semibold'
                  : 'border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-slate-300'
              }`}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {tab.badge}
                </span>
              )}
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
};

export const TabContent = TabsPrimitive.Content;
