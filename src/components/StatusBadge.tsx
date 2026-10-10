import React from 'react';
import { ComplaintStatus } from '../types';
import { CheckCircle2, Clock, AlertTriangle, UserCheck, XCircle, PlayCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'Submitted':
        return {
          icon: Clock,
          label: 'Submitted',
          textClass: 'text-amber-800',
          bgClass: 'bg-amber-50 border-amber-200',
          dotClass: 'bg-amber-500',
        };
      case 'Under Review':
        return {
          icon: AlertTriangle,
          label: 'Under Review',
          textClass: 'text-sky-800',
          bgClass: 'bg-sky-50 border-sky-200',
          dotClass: 'bg-sky-500',
        };
      case 'Assigned':
        return {
          icon: UserCheck,
          label: 'Assigned',
          textClass: 'text-indigo-800',
          bgClass: 'bg-indigo-50 border-indigo-200',
          dotClass: 'bg-indigo-500',
        };
      case 'In Progress':
        return {
          icon: PlayCircle,
          label: 'In Progress',
          textClass: 'text-blue-800',
          bgClass: 'bg-blue-50 border-blue-200',
          dotClass: 'bg-blue-600',
        };
      case 'Resolved':
        return {
          icon: CheckCircle2,
          label: 'Resolved',
          textClass: 'text-emerald-800',
          bgClass: 'bg-emerald-50 border-emerald-200',
          dotClass: 'bg-emerald-600',
        };
      case 'Rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          textClass: 'text-rose-800',
          bgClass: 'bg-rose-50 border-rose-200',
          dotClass: 'bg-rose-600',
        };
      default:
        return {
          icon: Clock,
          label: st,
          textClass: 'text-slate-700',
          bgClass: 'bg-slate-100 border-slate-200',
          dotClass: 'bg-slate-500',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${config.bgClass} ${config.textClass} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
