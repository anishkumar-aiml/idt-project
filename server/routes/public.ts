import { Router, Request, Response } from 'express';
import { dbQuery, getDatabaseStatus } from '../db.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const trackLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many tracking requests. Please slow down.',
});

// 1. Live Database Public Statistics (Real numbers from DB only)
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalRow = await dbQuery<{ count: number }>('SELECT COUNT(*) AS count FROM complaints');
    const resolvedRow = await dbQuery<{ count: number }>("SELECT COUNT(*) AS count FROM complaints WHERE status = 'Resolved'");
    const activeRow = await dbQuery<{ count: number }>("SELECT COUNT(*) AS count FROM complaints WHERE status NOT IN ('Resolved', 'Rejected')");
    const citizensRow = await dbQuery<{ count: number }>("SELECT COUNT(*) AS count FROM users WHERE role = 'citizen'");

    const total = totalRow[0]?.count || 0;
    const resolved = resolvedRow[0]?.count || 0;
    const active = activeRow[0]?.count || 0;
    const totalCitizens = citizensRow[0]?.count || 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalComplaints: total,
        resolvedComplaints: resolved,
        activeComplaints: active,
        totalCitizens,
        resolutionRate,
      },
    });
  } catch (err: any) {
    console.error('[Public Stats Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve public statistics from database.',
    });
  }
});

// 2. Public Complaint Tracking (Privacy-safe: No passwords, private contact info or internal data)
router.get('/track/:code', trackLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code ? req.params.code.trim().toUpperCase() : '';

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid complaint reference code (e.g. SC-2026-00001).',
      });
      return;
    }

    const complaintRows = await dbQuery(
      `SELECT 
        c.id,
        c.complaint_code,
        c.title,
        c.category,
        c.priority,
        c.status,
        c.address,
        c.created_at,
        c.updated_at,
        c.resolution_notes,
        d.name AS department_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE UPPER(c.complaint_code) = ?`,
      [code]
    );

    if (!complaintRows || complaintRows.length === 0) {
      res.status(404).json({
        success: false,
        message: `No public record found matching complaint code "${code}". Please check the ID and try again.`,
      });
      return;
    }

    const complaint = complaintRows[0];

    // Fetch public timeline (excluding private email or sensitive notes)
    const historyRows = await dbQuery(
      `SELECT 
        h.id,
        h.previous_status,
        h.new_status,
        h.remarks,
        h.created_at
       FROM complaint_status_history h
       WHERE h.complaint_id = ?
       ORDER BY h.created_at ASC`,
      [complaint.id]
    );

    // Return strictly non-sensitive public record
    res.json({
      success: true,
      complaint: {
        complaintCode: complaint.complaint_code,
        title: complaint.title,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        address: complaint.address,
        departmentName: complaint.department_name || 'Central Intake Desk',
        resolutionNotes: complaint.status === 'Resolved' ? complaint.resolution_notes : null,
        createdAt: complaint.created_at,
        updatedAt: complaint.updated_at,
      },
      timeline: historyRows.map((h: any) => ({
        id: h.id,
        previousStatus: h.previous_status,
        newStatus: h.new_status,
        remarks: h.remarks,
        timestamp: h.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[Public Tracking Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to query public complaint tracking service.',
    });
  }
});

// 3. System & Database Health Check Endpoint
router.get('/health', (_req: Request, res: Response): void => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'healthy',
    system: 'Smart Civic Complaint System',
    owner: 'Anish Kumar Singh',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      engine: dbStatus.engine,
      connected: dbStatus.connected,
      host: dbStatus.host,
      name: dbStatus.database,
      tablesCount: dbStatus.tablesCount,
      notice: dbStatus.error || null,
    },
  });
});

export default router;
