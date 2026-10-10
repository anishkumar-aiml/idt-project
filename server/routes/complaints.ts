import { Router, Response } from 'express';
import { dbQuery, dbExecute } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { uploadComplaintImage } from '../middleware/upload.js';

const router = Router();

const ALLOWED_CATEGORIES = [
  'Road/Pothole',
  'Garbage',
  'Water Supply',
  'Drainage',
  'Streetlight',
  'Electricity',
  'Public Sanitation',
  'Other',
];

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

// Helper to calculate priority if citizen didn't explicitly specify or to validate rules
function inferPriority(category: string, description: string, userPriority?: string): string {
  if (userPriority && ALLOWED_PRIORITIES.includes(userPriority)) {
    return userPriority;
  }
  const text = (description || '').toLowerCase();
  if (
    text.includes('live wire') ||
    text.includes('sparking') ||
    text.includes('burst pipe') ||
    text.includes('flooding') ||
    text.includes('open manhole') ||
    text.includes('collapsed') ||
    text.includes('danger')
  ) {
    return 'Emergency';
  }
  if (category === 'Electricity' || category === 'Water Supply' || category === 'Drainage') {
    return 'High';
  }
  if (category === 'Road/Pothole' || category === 'Garbage') {
    return 'Medium';
  }
  return 'Low';
}

// 1. Submit a New Civic Complaint
router.post(
  '/',
  authenticateToken,
  uploadComplaintImage.single('image'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { title, description, category, address, latitude, longitude, priority } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || title.trim().length < 5) {
        res.status(400).json({
          success: false,
          message: 'Complaint title is required and must be at least 5 characters.',
        });
        return;
      }

      if (!description || typeof description !== 'string' || description.trim().length < 15) {
        res.status(400).json({
          success: false,
          message: 'Detailed description is required (at least 15 characters) to assist civic teams.',
        });
        return;
      }

      if (!category || !ALLOWED_CATEGORIES.includes(category)) {
        res.status(400).json({
          success: false,
          message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        });
        return;
      }

      if (!address || typeof address !== 'string' || address.trim().length < 5) {
        res.status(400).json({
          success: false,
          message: 'Location address or landmark is required (at least 5 characters).',
        });
        return;
      }

      const calculatedPriority = inferPriority(category, description, priority);

      let parsedLat: number | null = null;
      let parsedLng: number | null = null;
      if (latitude && !isNaN(parseFloat(latitude))) {
        parsedLat = parseFloat(latitude);
      }
      if (longitude && !isNaN(parseFloat(longitude))) {
        parsedLng = parseFloat(longitude);
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      // Generate next sequential complaint code
      // Format: SC-2026-00001
      const countRes = await dbQuery<{ total: number }>('SELECT COUNT(*) AS total FROM complaints');
      const nextSequence = (countRes[0]?.total || 0) + 1;
      const complaintCode = `SC-2026-${String(nextSequence).padStart(5, '0')}`;

      // Insert into complaints table
      const insertResult = await dbExecute(
        `INSERT INTO complaints (
          complaint_code, citizen_id, title, description, category, priority,
          address, latitude, longitude, image_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')`,
        [
          complaintCode,
          user.id,
          title.trim(),
          description.trim(),
          category,
          calculatedPriority,
          address.trim(),
          parsedLat,
          parsedLng,
          imageUrl,
        ]
      );

      const complaintId = insertResult.insertId;

      // Log initial status history
      await dbExecute(
        `INSERT INTO complaint_status_history (
          complaint_id, previous_status, new_status, changed_by, remarks
        ) VALUES (?, NULL, 'Submitted', ?, ?)`,
        [
          complaintId,
          user.id,
          imageUrl
            ? 'Complaint registered by citizen with photo evidence and location.'
            : 'Complaint registered by citizen with location coordinates.',
        ]
      );

      // Fetch the created record
      const createdRows = await dbQuery(
        'SELECT * FROM complaints WHERE id = ?',
        [complaintId]
      );

      res.status(201).json({
        success: true,
        message: 'Your civic complaint has been registered successfully in the system.',
        complaint: createdRows[0],
      });
    } catch (err: any) {
      console.error('[Submit Complaint Error]:', err);
      res.status(500).json({
        success: false,
        message: 'Database error occurred while saving your complaint. Please try again.',
      });
    }
  }
);

// 2. View Citizen's Complaints
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, category, search, tab } = req.query;

    let sql = `
      SELECT 
        c.*,
        d.name AS department_name,
        d.code AS department_code
      FROM complaints c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.citizen_id = ?
    `;
    const params: any[] = [user.id];

    if (status && typeof status === 'string' && status !== 'all') {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (category && typeof category === 'string' && category !== 'all') {
      sql += ' AND c.category = ?';
      params.push(category);
    }

    if (tab === 'resolved') {
      sql += " AND c.status = 'Resolved'";
    } else if (tab === 'pending') {
      sql += " AND c.status != 'Resolved' AND c.status != 'Rejected'";
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      sql += ' AND (c.complaint_code LIKE ? OR c.title LIKE ? OR c.address LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = await dbQuery(sql, params);

    res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (err: any) {
    console.error('[Citizen Complaints List Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your complaints from the database.',
    });
  }
});

// 3. View Complaint Details (With History and Authorization)
router.get('/:idOrCode', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { idOrCode } = req.params;

    const isNumeric = /^\d+$/.test(idOrCode);
    const complaintSql = `
      SELECT 
        c.*,
        u.name AS citizen_name,
        u.email AS citizen_email,
        u.mobile AS citizen_mobile,
        d.name AS department_name,
        d.code AS department_code,
        d.contact_email AS department_email,
        d.head_officer AS department_head
      FROM complaints c
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE ${isNumeric ? 'c.id = ?' : 'c.complaint_code = ?'}
    `;

    const complaints = await dbQuery(complaintSql, [idOrCode]);

    if (!complaints || complaints.length === 0) {
      res.status(404).json({
        success: false,
        message: `Complaint not found with identifier "${idOrCode}".`,
      });
      return;
    }

    const complaint = complaints[0];

    // Authorization check: Citizen can only view their own complaint unless admin
    if (user.role !== 'admin' && complaint.citizen_id !== user.id) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view private complaint records of other citizens.',
      });
      return;
    }

    // Fetch status history timeline
    const history = await dbQuery(
      `SELECT 
        h.id,
        h.complaint_id,
        h.previous_status,
        h.new_status,
        h.remarks,
        h.created_at,
        u.name AS changed_by_name,
        u.role AS changed_by_role
      FROM complaint_status_history h
      JOIN users u ON h.changed_by = u.id
      WHERE h.complaint_id = ?
      ORDER BY h.created_at ASC`,
      [complaint.id]
    );

    res.json({
      success: true,
      complaint,
      history,
    });
  } catch (err: any) {
    console.error('[Get Complaint Detail Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint details.',
    });
  }
});

// 4. Add Additional Citizen Note/Follow-up to Open Complaint
router.post('/:id/notes', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const complaintId = parseInt(req.params.id, 10);
    const { note } = req.body;

    if (!note || typeof note !== 'string' || note.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid note of at least 5 characters.',
      });
      return;
    }

    const rows = await dbQuery('SELECT id, citizen_id, status FROM complaints WHERE id = ?', [complaintId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Complaint not found.' });
      return;
    }

    const complaint = rows[0];
    if (user.role !== 'admin' && complaint.citizen_id !== user.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to add notes to this complaint.' });
      return;
    }

    // Add status history record with remark
    await dbExecute(
      `INSERT INTO complaint_status_history (
        complaint_id, previous_status, new_status, changed_by, remarks
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        complaintId,
        complaint.status,
        complaint.status,
        user.id,
        `Citizen Remark: ${note.trim()}`,
      ]
    );

    res.json({
      success: true,
      message: 'Remark recorded successfully in the audit timeline.',
    });
  } catch (err: any) {
    console.error('[Add Note Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to record note.',
    });
  }
});

export default router;
