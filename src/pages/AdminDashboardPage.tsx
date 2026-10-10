import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Complaint,
  AdminStats,
  Department,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  XCircle,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Loader2,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface AdminDashboardPageProps {
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

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modal for Status & Assignment Update
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updateStatus, setUpdateStatus] = useState<ComplaintStatus>('Submitted');
  const [updateDeptId, setUpdateDeptId] = useState<string>('');
  const [updateOfficer, setUpdateOfficer] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [updateResNotes, setUpdateResNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Modal for Adding Department
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptEmail, setDeptEmail] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, complaintsRes, deptsRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getComplaints({
          search: search.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
        }),
        api.admin.getDepartments(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (complaintsRes.success) setComplaints(complaintsRes.complaints);
      if (deptsRes.success) setDepartments(deptsRes.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAdminData();
    }
  }, [isAuthenticated, isAdmin, statusFilter, categoryFilter, priorityFilter, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const openUpdateModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setUpdateStatus(c.status);
    setUpdateDeptId(c.department_id ? String(c.department_id) : '');
    setUpdateOfficer(c.assigned_to || '');
    setUpdateRemarks('');
    setUpdateResNotes(c.resolution_notes || '');
    setUpdateSuccess(null);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const res = await api.admin.updateStatus(selectedComplaint.id, {
        status: updateStatus,
        departmentId: updateDeptId ? parseInt(updateDeptId, 10) : undefined,
        assignedTo: updateOfficer.trim() || undefined,
        remarks: updateRemarks.trim() || undefined,
        resolutionNotes: updateResNotes.trim() || undefined,
      });

      if (res.success) {
        setUpdateSuccess(res.message);
        setTimeout(() => {
          setSelectedComplaint(null);
          fetchAdminData();
        }, 1200);
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    setCreatingDept(true);
    try {
      const res = await api.admin.createDepartment({
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        contactEmail: deptEmail.trim() || undefined,
        headOfficer: deptHead.trim() || undefined,
      });
      if (res.success) {
        setShowAddDeptModal(false);
        setDeptName('');
        setDeptCode('');
        setDeptEmail('');
        setDeptHead('');
        fetchAdminData();
      }
    } catch (err: any) {
      alert(`Failed to add department: ${err.message}`);
    } finally {
      setCreatingDept(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await api.admin.downloadCsv();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          This portal requires municipal administrative credentials (admin role).
        </p>
        <button
          onClick={() => navigate('login')}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          Sign In as Administrator
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-blue-700" />
            <span>Municipal Authority Control Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.name}</strong> (Administrator) &middot; Real-time civic complaint dispatch and resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Department</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchAdminData}
            title="Refresh database records"
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (Real DB counts) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">Total Logged</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {stats.total}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{stats.totalCitizens} citizens</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="text-[11px] font-medium text-amber-800">Pending Review</div>
            <div className="text-2xl font-extrabold text-amber-900 mt-1 font-mono">
              {stats.pending}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">Submitted / Review</div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
            <div className="text-[11px] font-medium text-indigo-800">Assigned</div>
            <div className="text-2xl font-extrabold text-indigo-900 mt-1 font-mono">
              {stats.assigned}
            </div>
            <div className="text-[10px] text-indigo-700 mt-0.5">Routed to depts</div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
            <div className="text-[11px] font-medium text-blue-800">In Progress</div>
            <div className="text-2xl font-extrabold text-blue-900 mt-1 font-mono">
              {stats.inProgress}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">Field crew active</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="text-[11px] font-medium text-emerald-800">Resolved</div>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1 font-mono">
              {stats.resolved}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">{stats.resolutionRate}% rate</div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
            <div className="text-[11px] font-medium text-rose-800">Rejected</div>
            <div className="text-2xl font-extrabold text-rose-900 mt-1 font-mono">
              {stats.rejected}
            </div>
            <div className="text-[10px] text-rose-700 mt-0.5">Duplicate / invalid</div>
          </div>
        </div>
      )}

      {/* Analytics Breakdown Charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Complaints by Category */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Complaints by Category (Real Database Aggregation)</span>
              </h3>
            </div>
            <div className="space-y-2 pt-1">
              {stats.categories.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No complaints recorded yet.</div>
              ) : (
                stats.categories.map((cat) => {
                  const pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">{cat.category}</span>
                        <span className="text-slate-500 font-mono">
                          {cat.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Department Workload Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Department Workload & Allocations</span>
              </h3>
            </div>
            <div className="space-y-2 pt-1">
              {stats.departments.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No assignments yet.</div>
              ) : (
                stats.departments.map((dept) => {
                  const pct = stats.total > 0 ? Math.round((dept.count / stats.total) * 100) : 0;
                  return (
                    <div key={dept.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium truncate max-w-xs">{dept.name}</span>
                        <span className="text-slate-500 font-mono">
                          {dept.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by ID, keyword, address, citizen name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 pl-9 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
          >
            Search Records
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">All Priorities</option>
            <option value="Emergency">Emergency</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setPriorityFilter('all');
                setDepartmentFilter('all');
                setSearch('');
              }}
              className="text-[11px] text-rose-600 hover:underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Registered Public Grievances ({complaints.length} records)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Table: <code className="text-slate-600 font-bold">complaints</code>
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500">Querying MySQL database...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No complaints found matching the active filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Subject & Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Department / Officer</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {c.complaint_code}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{c.address}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {c.category}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <div>{c.department_name || <span className="text-slate-400 italic">Unassigned</span>}</div>
                      {c.assigned_to && (
                        <div className="text-[10px] text-slate-400 font-medium">{c.assigned_to}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <div className="font-medium text-slate-800">{c.citizen_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.citizen_mobile}</div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => openUpdateModal(c)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium text-xs cursor-pointer transition-colors"
                      >
                        Action / Assign
                      </button>
                      <button
                        onClick={() => navigate('complaint-detail', c.id)}
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action / Update Status & Assign Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700">
                  {selectedComplaint.complaint_code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Update Status & Department Assignment
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{updateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs">
              {/* Status Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Workflow Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign to Municipal Department
                </label>
                <select
                  value={updateDeptId}
                  onChange={(e) => setUpdateDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                >
                  <option value="">-- No Department Assigned --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Officer In Charge */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Designated Officer or Field Squad Leader
                </label>
                <input
                  type="text"
                  placeholder="e.g. Er. Rajesh Varma (PWD Road Brigade)"
                  value={updateOfficer}
                  onChange={(e) => setUpdateOfficer(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              {/* Official Remark for History Audit */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Audit Remark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Field team dispatched; hot-mix bituminous batch allocated."
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Logged in <code className="font-mono">complaint_status_history</code> table with your admin ID.
                </span>
              </div>

              {/* Resolution Notes (Visible if Resolved) */}
              {updateStatus === 'Resolved' && (
                <div>
                  <label className="block font-semibold text-emerald-800 mb-1">
                    Public Resolution Notes (Proof of Work)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe how the problem was resolved (e.g. Pothole asphalt patching completed at 11:30 AM; site inspected and approved)."
                    value={updateResNotes}
                    onChange={(e) => setUpdateResNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/40 text-slate-900"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Register New Civic Department
              </h3>
              <button
                onClick={() => setShowAddDeptModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parks & Horticultural Development"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PARK"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Desk Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. parks@smartcivic.gov.in"
                  value={deptEmail}
                  onChange={(e) => setDeptEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Superintending Officer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. H. Sharma"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDept}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creatingDept && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
