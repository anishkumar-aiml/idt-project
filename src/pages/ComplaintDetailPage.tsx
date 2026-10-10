import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Complaint, ComplaintHistoryItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  User,
  ExternalLink,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Lock,
} from 'lucide-react';

interface ComplaintDetailPageProps {
  complaintIdOrCode: string | number;
  navigate: (view: string, param?: string | number) => void;
}

export const ComplaintDetailPage: React.FC<ComplaintDetailPageProps> = ({
  complaintIdOrCode,
  navigate,
}) => {
  const { user, isAdmin } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Note
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.complaints.getComplaint(complaintIdOrCode);
      if (res.success && res.complaint) {
        setComplaint(res.complaint);
        setHistory(res.history || []);
      } else {
        setError('Complaint details could not be loaded.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [complaintIdOrCode]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newNote.trim()) return;

    setSubmittingNote(true);
    setNoteSuccess(null);
    try {
      const res = await api.complaints.addNote(complaint.id, newNote.trim());
      if (res.success) {
        setNoteSuccess('Your remark has been attached to the complaint timeline.');
        setNewNote('');
        fetchDetails();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record remark.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500">Retrieving complaint history from database...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-4">
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold">Error Accessing Record</h3>
            <p>{error || 'Complaint record was not found or access is restricted.'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(isAdmin ? 'admin-dashboard' : 'citizen-dashboard')}
          className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  const isClosed = complaint.status === 'Resolved' || complaint.status === 'Rejected';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(isAdmin ? 'admin-dashboard' : 'citizen-dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isAdmin ? 'Admin Console' : 'My Complaints'}</span>
        </button>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold text-blue-700 text-base">
                {complaint.complaint_code}
              </span>
              <span className="text-slate-300">&middot;</span>
              <span className="font-semibold text-slate-700">{complaint.category}</span>
              <span className="text-slate-300">&middot;</span>
              <span className="text-slate-500 font-mono">
                {new Date(complaint.created_at).toLocaleString()}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {complaint.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} size="lg" />
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Description, Location, Photo */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Problem Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80 whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Photo Evidence */}
            {complaint.image_url && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Photographic Evidence
                </h3>
                <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden group">
                  <img
                    src={complaint.image_url}
                    alt="Complaint Evidence"
                    className="max-h-64 rounded-xl object-cover"
                  />
                  <button
                    onClick={() => setShowImageModal(true)}
                    className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </button>
                </div>
              </div>
            )}

            {/* Resolution Notes If Any */}
            {complaint.resolution_notes && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Authority Resolution Notes</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  {complaint.resolution_notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Col: Metadata & Assignment Card */}
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-3">
              <h3 className="font-semibold text-slate-900 text-xs border-b border-slate-200 pb-2">
                Administrative Information
              </h3>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Department Assigned</span>
                </div>
                <div className="font-medium text-slate-800">
                  {complaint.department_name || 'Pending Department Routing'}
                </div>
              </div>

              {complaint.assigned_to && (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Duty Officer</span>
                  </div>
                  <div className="font-medium text-slate-800">
                    {complaint.assigned_to}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Reported Address</span>
                </div>
                <div className="font-medium text-slate-800 break-words">
                  {complaint.address}
                </div>
                {complaint.latitude && complaint.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline pt-0.5"
                  >
                    <span>View Coordinates on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Complainant</span>
                </div>
                <div className="font-medium text-slate-800">
                  {complaint.citizen_name || user?.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {complaint.citizen_email || user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Workflow Timeline */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Resolution Lifecycle & Audit Trail
          </h3>
          <StatusTimeline currentStatus={complaint.status} history={history} />
        </div>

        {/* Add Citizen Follow-up Note */}
        {!isClosed && (
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Add Citizen Follow-up Note</span>
            </h3>

            {noteSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{noteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Provide additional details or ask a question regarding this complaint..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submittingNote ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post Follow-up Note</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Image Modal Lightbox */}
      {showImageModal && complaint.image_url && (
        <div
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-4xl max-h-screen p-2 relative">
            <img
              src={complaint.image_url}
              alt="Enlarged Evidence"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
