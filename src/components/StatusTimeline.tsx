import React from 'react';
import { ComplaintStatus, ComplaintHistoryItem, PublicTimelineItem } from '../types';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: ComplaintStatus | string;
  history?: (ComplaintHistoryItem | PublicTimelineItem)[];
}

const LIFECYCLE_STEPS: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, history = [] }) => {
  const isRejected = currentStatus === 'Rejected';

  const getStepIndex = (status: string) => {
    return LIFECYCLE_STEPS.indexOf(status as ComplaintStatus);
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="space-y-6">
      {/* Visual Step Indicator */}
      <div className="relative">
        <div className="hidden sm:block absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 bg-slate-200 z-0" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = !isRejected && currentIndex >= idx;
            const isCurrent = !isRejected && currentIndex === idx;

            return (
              <div
                key={step}
                className={`p-3 rounded-lg border text-center transition-all bg-white ${
                  isCurrent
                    ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="flex justify-center mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted && !isCurrent ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-900 truncate">{step}</div>
                <div className="text-[10px] text-slate-500">
                  {isCurrent ? 'Active Stage' : isCompleted ? 'Completed' : 'Pending'}
                </div>
              </div>
            );
          })}
        </div>

        {isRejected && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              This complaint has been reviewed and closed as <strong>Rejected</strong> by municipal authorities.
            </span>
          </div>
        )}
      </div>

      {/* Audit History Log */}
      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Official Status Audit Log ({history.length} events)</span>
          </h4>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((item, idx) => {
              const changedBy = (item as ComplaintHistoryItem).changed_by_name;
              const timestamp = (item as any).created_at || (item as any).timestamp;
              const newStatus = (item as any).new_status || (item as any).newStatus;
              const previousStatus = (item as any).previous_status || (item as any).previousStatus;

              return (
                <div key={item.id || idx} className="relative group">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="font-semibold text-slate-900">
                        {newStatus}
                        {previousStatus && (
                          <span className="font-normal text-slate-500 ml-1.5">
                            (was {previousStatus})
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] text-slate-500 font-mono">
                        {new Date(timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>

                    {item.remarks && (
                      <p className="text-slate-700 leading-relaxed mt-1 bg-white p-2 rounded border border-slate-100">
                        {item.remarks}
                      </p>
                    )}

                    {changedBy && (
                      <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                        <span>Action logged by:</span>
                        <span className="font-medium text-slate-700">{changedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
