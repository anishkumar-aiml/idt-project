import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PublicTrackingData, PublicTimelineItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import {
  Search,
  Building2,
  Calendar,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface TrackComplaintPageProps {
  initialCode?: string;
  navigate: (view: string, param?: string | number) => void;
}

export const TrackComplaintPage: React.FC<TrackComplaintPageProps> = ({
  initialCode,
  navigate,
}) => {
  const [searchCode, setSearchCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complaintData, setComplaintData] = useState<{
    complaint: PublicTrackingData;
    timeline: PublicTimelineItem[];
  } | null>(null);

  const fetchTracking = async (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid complaint code (e.g. SC-2026-00001).');
      return;
    }

    setLoading(true);
    setError(null);
    setComplaintData(null);

    try {
      const res = await api.public.trackComplaint(cleanCode);
      if (res.success && res.complaint) {
        setComplaintData({
          complaint: res.complaint,
          timeline: res.timeline,
        });
      } else {
        setError(res.message || 'Complaint not found.');
      }
    } catch (err: any) {
      setError(
        err.message ||
          `No public record found for complaint reference "${cleanCode}". Please verify your ID.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchTracking(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(searchCode);
  };

  const sampleCodes = ['SC-2026-00001', 'SC-2026-00002', 'SC-2026-00003'];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Search className="w-6 h-6 text-blue-600" />
          <span>Track Complaint Progress</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Public transparency lookup. Citizen contact data is protected according to municipal privacy standards.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="Enter Complaint ID (e.g. SC-2026-00001)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full px-3.5 py-3 pl-10 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 uppercase tracking-wider"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Database...</span>
              </>
            ) : (
              <span>Track Progress</span>
            )}
          </button>
        </form>

        {/* Sample Reference Code Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 text-[11px]">Quick test references:</span>
          {sampleCodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setSearchCode(code);
                fetchTracking(code);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] cursor-pointer transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Notice Pill */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-slate-600 text-xs">
        <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          <strong>Citizen Privacy Protected:</strong> Personal identity, phone numbers, and private internal notes are withheld on public search results.
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <div className="font-semibold">Complaint Not Found</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Complaint Result Record */}
      {complaintData && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-6 p-6 sm:p-8">
          {/* Card Top */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-base font-bold text-blue-700">
                  {complaintData.complaint.complaintCode}
                </span>
                <span className="text-slate-300">&middot;</span>
                <span className="text-xs text-slate-600 font-medium">
                  {complaintData.complaint.category}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {complaintData.complaint.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PriorityBadge priority={complaintData.complaint.priority} />
              <StatusBadge status={complaintData.complaint.status} size="lg" />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Reported Location</span>
              </div>
              <div className="font-medium text-slate-800">
                {complaintData.complaint.address}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Assigned Department</span>
              </div>
              <div className="font-medium text-slate-800">
                {complaintData.complaint.departmentName}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Submission Date</span>
              </div>
              <div className="font-medium text-slate-800 font-mono">
                {new Date(complaintData.complaint.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Updated</span>
              </div>
              <div className="font-medium text-slate-800 font-mono">
                {new Date(complaintData.complaint.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Resolution Notes (If Resolved) */}
          {complaintData.complaint.resolutionNotes && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs">
              <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Official Municipal Resolution Remarks</span>
              </div>
              <p className="text-emerald-800 leading-relaxed pt-1">
                {complaintData.complaint.resolutionNotes}
              </p>
            </div>
          )}

          {/* Status Progression Timeline */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Resolution Progress Workflow
            </h3>
            <StatusTimeline
              currentStatus={complaintData.complaint.status}
              history={complaintData.timeline}
            />
          </div>
        </div>
      )}
    </div>
  );
};
