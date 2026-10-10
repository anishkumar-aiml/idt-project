import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  ExternalLink,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Camera,
} from 'lucide-react';

interface CitizenDashboardPageProps {
  navigate: (view: string, param?: string | number) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Road/Pothole',
  'Garbage',
  'Water Supply',
  'Drainage',
  'Streetlight',
  'Electricity',
  'Public Sanitation',
  'Other',
];

const STATUSES: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

export const CitizenDashboardPage: React.FC<CitizenDashboardPageProps> = ({ navigate }) => {
  const { user, isAuthenticated } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [tab, setTab] = useState<'all' | 'pending' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.complaints.getMyComplaints({
        tab,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });

      if (res.success) {
        setComplaints(res.complaints);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complaints from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchComplaints();
    }
  }, [isAuthenticated, tab, categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your complaints</h2>
        <p className="text-xs text-slate-500">
          Your personal grievance records and live progress tracking are protected.
        </p>
        <button
          onClick={() => navigate('login')}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          Sign In to Dashboard
        </button>
      </div>
    );
  }

  const pendingCount = complaints.filter(
    (c) => c.status !== 'Resolved' && c.status !== 'Rejected'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="space-y-6 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <span>Citizen Grievance Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <strong>{user?.name}</strong> &middot; Track your reported public issues and municipal actions.
          </p>
        </div>

        <button
          onClick={() => navigate('report')}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Tabs & Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Segmented Control Buttons (Zero-Pill compliant) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
              tab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Reports ({complaints.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
              tab === 'pending'
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active & Pending ({pendingCount})
          </button>
          <button
            onClick={() => setTab('resolved')}
            className={`px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
              tab === 'resolved'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ID or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 pl-8 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900 w-48 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Secondary Category & Status Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {(categoryFilter !== 'all' || statusFilter !== 'all' || search) && (
          <button
            onClick={() => {
              setCategoryFilter('all');
              setStatusFilter('all');
              setSearch('');
            }}
            className="text-[11px] text-rose-600 hover:underline cursor-pointer ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Complaints List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500">Loading complaints from MySQL database...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">No complaints found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'No issues match your active filter criteria.'
                : 'You have not submitted any civic complaints yet. Notice a pothole, leak, or garbage hazard? Report it now.'}
            </p>
          </div>
          <button
            onClick={() => navigate('report')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Report Your First Problem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate('complaint-detail', c.id)}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                {/* Clean unboxed metadata (anti-slop rule) */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                  <span className="font-bold text-blue-700">{c.complaint_code}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="text-slate-600 font-sans font-medium">{c.category}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="text-slate-500 font-sans">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-xs">{c.address}</span>
                  </div>

                  {c.department_name && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.department_name}</span>
                    </div>
                  )}

                  {c.image_url && (
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Photo Attached</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Action */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                </div>

                <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View Details & Timeline</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
