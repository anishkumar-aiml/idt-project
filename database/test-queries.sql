-- Verification queries for Smart Civic Complaint System

USE smart_civic;

-- 1. Check all users and roles
SELECT id, name, email, mobile, role, created_at FROM users;

-- 2. Count complaints by status
SELECT status, COUNT(*) AS count
FROM complaints
GROUP BY status;

-- 3. Count complaints by category
SELECT category, COUNT(*) AS count
FROM complaints
GROUP BY category;

-- 4. View detailed complaints with assigned department & citizen name
SELECT 
  c.complaint_code,
  c.title,
  c.category,
  c.priority,
  c.status,
  u.name AS citizen_name,
  u.email AS citizen_email,
  d.name AS department_name,
  c.assigned_to,
  c.created_at
FROM complaints c
JOIN users u ON c.citizen_id = u.id
LEFT JOIN departments d ON c.department_id = d.id
ORDER BY c.created_at DESC;

-- 5. Audit trail of a specific complaint
SELECT 
  h.id,
  h.complaint_id,
  h.previous_status,
  h.new_status,
  u.name AS changed_by_user,
  h.remarks,
  h.created_at
FROM complaint_status_history h
JOIN users u ON h.changed_by = u.id
WHERE h.complaint_id = 1
ORDER BY h.created_at ASC;
