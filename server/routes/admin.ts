import { Router, Response } from 'express';
import { dbQuery, dbExecute } from '../db.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Apply admin authentication to all routes in this file
router.use(authenticateToken);
router.use(requireAdmin);

// 1. List All Complaints with Filters
router.get('/complaints', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, category, priority, departmentId, search } = req.query;

    let sql = `
      SELECT 
        c.*,
        u.name AS citizen_name,
        u.email AS citizen_email,
        u.mobile AS citizen_mobile,
        d.name AS department_name,
        d.code AS department_code
      FROM complaints c
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && typeof status === 'string' && status !== 'all') {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (category && typeof category === 'string' && category !== 'all') {
      sql += ' AND c.category = ?';
      params.push(category);
    }

    if (priority && typeof priority === 'string' && priority !== 'all') {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }

    if (departmentId && departmentId !== 'all') {
      sql += ' AND c.department_id = ?';
      params.push(departmentId);
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      sql += ' AND (c.complaint_code LIKE ? OR c.title LIKE ? OR c.address LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = await dbQuery(sql, params);

    res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (err: any) {
    console.error('[Admin Complaints List Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative complaint records.',
    });
  }
});

// 2. Real Database Statistics and Aggregate Metrics
router.get('/stats', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Total count
    const totalRow = await dbQuery<{ total: number }>('SELECT COUNT(*) AS total FROM complaints');
    const total = totalRow[0]?.total || 0;

    // Status counts
    const statusRows = await dbQuery<{ status: string; count: number }>(
      'SELECT status, COUNT(*) AS count FROM complaints GROUP BY status'
    );
    const statusMap: Record<string, number> = {
      Submitted: 0,
      'Under Review': 0,
      Assigned: 0,
      'In Progress': 0,
      Resolved: 0,
      Rejected: 0,
    };
    statusRows.forEach(row => {
      statusMap[row.status] = Number(row.count);
    });

    // Category breakdown
    const categoryRows = await dbQuery<{ category: string; count: number }>(
      'SELECT category, COUNT(*) AS count FROM complaints GROUP BY category ORDER BY count DESC'
    );

    // Department breakdown
    const departmentRows = await dbQuery<{ name: string; count: number }>(
      `SELECT COALESCE(d.name, 'Unassigned') AS name, COUNT(c.id) AS count
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       GROUP BY d.name
       ORDER BY count DESC`
    );

    // Priority breakdown
    const priorityRows = await dbQuery<{ priority: string; count: number }>(
      'SELECT priority, COUNT(*) AS count FROM complaints GROUP BY priority'
    );

    // Total citizens count
    const citizensRow = await dbQuery<{ count: number }>(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'citizen'"
    );

    const pending = statusMap.Submitted + statusMap['Under Review'];
    const active = pending + statusMap.Assigned + statusMap['In Progress'];
    const resolutionRate = total > 0 ? Math.round((statusMap.Resolved / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        total,
        pending,
        submitted: statusMap.Submitted,
        underReview: statusMap['Under Review'],
        assigned: statusMap.Assigned,
        inProgress: statusMap['In Progress'],
        resolved: statusMap.Resolved,
        rejected: statusMap.Rejected,
        active,
        totalCitizens: citizensRow[0]?.count || 0,
        resolutionRate,
        categories: categoryRows,
        departments: departmentRows,
        priorities: priorityRows,
      },
    });
  } catch (err: any) {
    console.error('[Admin Stats Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to aggregate administrative database metrics.',
    });
  }
});

// 3. Update Complaint Status, Assignment, and Official Remarks
router.put('/complaints/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.user!;
    const complaintId = parseInt(req.params.id, 10);
    const { status, departmentId, assignedTo, remarks, resolutionNotes } = req.body;

    const allowedStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
    if (status && !allowedStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
      return;
    }

    const complaintRows = await dbQuery('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!complaintRows || complaintRows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
      });
      return;
    }

    const currentComplaint = complaintRows[0];
    const oldStatus = currentComplaint.status;
    const newStatus = status || oldStatus;
    const targetDeptId = departmentId !== undefined && departmentId !== '' ? parseInt(departmentId, 10) : currentComplaint.department_id;
    const targetAssignedTo = assignedTo !== undefined ? (assignedTo ? String(assignedTo).trim() : null) : currentComplaint.assigned_to;
    const targetResNotes = resolutionNotes !== undefined ? (resolutionNotes ? String(resolutionNotes).trim() : null) : currentComplaint.resolution_notes;

    // Update complaints table
    await dbExecute(
      `UPDATE complaints 
       SET status = ?, department_id = ?, assigned_to = ?, resolution_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, targetDeptId, targetAssignedTo, targetResNotes, complaintId]
    );

    // Record audit status history
    const officialRemark = remarks && String(remarks).trim().length > 0 
      ? String(remarks).trim() 
      : `Status changed from ${oldStatus} to ${newStatus} by authority officer ${admin.name}.`;

    await dbExecute(
      `INSERT INTO complaint_status_history (
        complaint_id, previous_status, new_status, changed_by, remarks
      ) VALUES (?, ?, ?, ?, ?)`,
      [complaintId, oldStatus, newStatus, admin.id, officialRemark]
    );

    // Record assignment audit if department changed or newly assigned
    if (targetDeptId && targetDeptId !== currentComplaint.department_id) {
      await dbExecute(
        `INSERT INTO complaint_assignments (
          complaint_id, department_id, assigned_by, assigned_officer, notes
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          complaintId,
          targetDeptId,
          admin.id,
          targetAssignedTo || 'Department Duty Desk',
          officialRemark,
        ]
      );
    }

    res.json({
      success: true,
      message: `Complaint ${currentComplaint.complaint_code} updated successfully to status "${newStatus}".`,
    });
  } catch (err: any) {
    console.error('[Admin Update Status Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status in database.',
    });
  }
});

// 4. Get Departments
router.get('/departments', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const departments = await dbQuery('SELECT * FROM departments ORDER BY name ASC');
    res.json({
      success: true,
      departments,
    });
  } catch (err: any) {
    console.error('[Admin Get Departments Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load civic departments.',
    });
  }
});

// 5. Add New Department
router.post('/departments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, contactEmail, headOfficer } = req.body;

    if (!name || !code) {
      res.status(400).json({
        success: false,
        message: 'Department name and department short code are required.',
      });
      return;
    }

    const result = await dbExecute(
      `INSERT INTO departments (name, code, contact_email, head_officer) VALUES (?, ?, ?, ?)`,
      [name.trim(), code.trim().toUpperCase(), contactEmail ? contactEmail.trim() : null, headOfficer ? headOfficer.trim() : null]
    );

    res.status(201).json({
      success: true,
      message: 'New civic department registered successfully.',
      departmentId: result.insertId,
    });
  } catch (err: any) {
    console.error('[Add Department Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Department code or name already exists.',
    });
  }
});

// 6. Export Complaints to CSV
router.get('/export-csv', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        c.complaint_code,
        c.title,
        c.category,
        c.priority,
        c.status,
        c.address,
        c.created_at,
        c.updated_at,
        u.name AS citizen_name,
        u.email AS citizen_email,
        u.mobile AS citizen_mobile,
        COALESCE(d.name, 'Unassigned') AS department,
        COALESCE(c.assigned_to, 'None') AS assigned_officer,
        COALESCE(c.resolution_notes, '') AS resolution_notes
      FROM complaints c
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.created_at DESC
    `;

    const rows = await dbQuery(sql);

    // Escape CSV cell according to RFC 4180
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Complaint ID',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Address',
      'Created Date',
      'Last Updated',
      'Citizen Name',
      'Citizen Email',
      'Citizen Mobile',
      'Department',
      'Assigned Officer',
      'Resolution Notes',
    ];

    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const line = [
        escapeCsv(row.complaint_code),
        escapeCsv(row.title),
        escapeCsv(row.category),
        escapeCsv(row.priority),
        escapeCsv(row.status),
        escapeCsv(row.address),
        escapeCsv(row.created_at),
        escapeCsv(row.updated_at),
        escapeCsv(row.citizen_name),
        escapeCsv(row.citizen_email),
        escapeCsv(row.citizen_mobile),
        escapeCsv(row.department),
        escapeCsv(row.assigned_officer),
        escapeCsv(row.resolution_notes),
      ];
      csvLines.push(line.join(','));
    }

    const csvContent = csvLines.join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="smart_civic_complaints_report_${timestamp}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('[CSV Export Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSV export.',
    });
  }
});

export default router;
