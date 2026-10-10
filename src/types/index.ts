export type UserRole = 'citizen' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
}

export type ComplaintCategory =
  | 'Road/Pothole'
  | 'Garbage'
  | 'Water Supply'
  | 'Drainage'
  | 'Streetlight'
  | 'Electricity'
  | 'Public Sanitation'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export interface Department {
  id: number;
  name: string;
  code: string;
  contact_email?: string;
  head_officer?: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  complaint_code: string;
  citizen_id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  status: ComplaintStatus;
  department_id: number | null;
  department_name?: string;
  department_code?: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  citizen_name?: string;
  citizen_email?: string;
  citizen_mobile?: string;
}

export interface ComplaintHistoryItem {
  id: number;
  complaint_id: number;
  previous_status: string | null;
  new_status: string;
  remarks: string | null;
  created_at: string;
  changed_by_name?: string;
  changed_by_role?: string;
}

export interface PublicStats {
  totalComplaints: number;
  resolvedComplaints: number;
  activeComplaints: number;
  totalCitizens: number;
  resolutionRate: number;
}

export interface AdminStats {
  total: number;
  pending: number;
  submitted: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  active: number;
  totalCitizens: number;
  resolutionRate: number;
  categories: { category: string; count: number }[];
  departments: { name: string; count: number }[];
  priorities: { priority: string; count: number }[];
}

export interface PublicTrackingData {
  complaintCode: string;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  address: string;
  departmentName: string;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTimelineItem {
  id: number;
  previousStatus: string | null;
  newStatus: string;
  remarks: string;
  timestamp: string;
}

export interface DatabaseHealth {
  engine: 'mysql' | 'sqlite';
  connected: boolean;
  host: string;
  name: string;
  tablesCount: number;
  notice: string | null;
}
