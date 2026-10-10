import React from 'react';
import { ComplaintPriority } from '../types';
import { AlertCircle, Flame, ArrowUp, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getConfig = (pr: string) => {
    switch (pr) {
      case 'Emergency':
        return {
          icon: Flame,
          label: 'Emergency',
          textClass: 'text-red-700 bg-red-50 border-red-200',
        };
      case 'High':
        return {
          icon: AlertCircle,
          label: 'High Priority',
          textClass: 'text-amber-700 bg-amber-50 border-amber-200',
        };
      case 'Medium':
        return {
          icon: ArrowUp,
          label: 'Medium',
          textClass: 'text-blue-700 bg-blue-50 border-blue-200',
        };
      case 'Low':
      default:
        return {
          icon: ArrowDown,
          label: 'Low',
          textClass: 'text-slate-600 bg-slate-50 border-slate-200',
        };
    }
  };

  const config = getConfig(priority);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.textClass}`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
