-- ============================================================================
-- Smart Civic Complaint System - MySQL 8 Initial Seed Script
-- Project Owner & Student: Anish Kumar Singh
-- Database: smart_civic
-- ============================================================================

USE smart_civic;

-- Default departments
INSERT INTO departments (name, code, contact_email, head_officer) VALUES
('Public Works Department (PWD)', 'PWD', 'pwd-roads@smartcivic.gov.in', 'Er. Rajesh Varma'),
('Solid Waste Management', 'SWM', 'waste-sanitation@smartcivic.gov.in', 'Smt. Sunita Rao'),
('Water Supply & Sewerage Board', 'WSSB', 'water-support@smartcivic.gov.in', 'Er. K. Natarajan'),
('Stormwater Drainage & Flood Control', 'DRAIN', 'drainage-cell@smartcivic.gov.in', 'Shri A. Sen'),
('Electricity & Street Lighting Board', 'ESLB', 'power-lights@smartcivic.gov.in', 'Er. Meenakshi Sundaram'),
('Urban Health & Public Sanitation', 'UHPS', 'public-health@smartcivic.gov.in', 'Dr. Arvind Deshmukh')
ON DUPLICATE KEY UPDATE name=name;

-- Initial default administrator and sample citizen
-- Note: Passwords below are hashed with bcrypt (cost 10) for 'Admin@2026' and 'Citizen@2026'
-- Admin: admin@smartcivic.gov.in / Admin@2026
-- Citizen: citizen.rahul@smartcivic.gov.in / Citizen@2026
INSERT INTO users (id, name, email, mobile, password_hash, role) VALUES
(1, 'Civic Central Admin', 'admin@smartcivic.gov.in', '+919876543210', '$2a$10$v0vXlKz56Y05J8j6N4Vzfeh1.lIeG666iF07WpB4fBkyG3Bffs7qO', 'admin'),
(2, 'Rahul Sharma', 'citizen.rahul@smartcivic.gov.in', '+919811223344', '$2a$10$v0vXlKz56Y05J8j6N4Vzfeh1.lIeG666iF07WpB4fBkyG3Bffs7qO', 'citizen')
ON DUPLICATE KEY UPDATE email=email;

-- Initial realistic complaint seeds
INSERT INTO complaints (id, complaint_code, citizen_id, title, description, category, priority, address, latitude, longitude, status, department_id, assigned_to, resolution_notes) VALUES
(1, 'SC-2026-00001', 2, 'Hazardous deep pothole near Metro Station Gate 3', 'A 2-foot wide pothole has opened up in the middle lane causing severe traffic slowdown and hazard for two-wheelers.', 'Road/Pothole', 'High', 'MG Road near Metro Pillar 142, Central Zone', 28.6139391, 77.2090212, 'In Progress', 1, 'Er. Rajesh Varma', 'Road asphalt mix repair crew dispatched for hot mix patching.'),
(2, 'SC-2026-00002', 2, 'Overflowing community garbage dumpster near Market Complex', 'Garbage bin has not been cleared for 3 consecutive days. Waste is spilling over pedestrian sidewalk causing foul odor.', 'Garbage', 'Medium', 'Sector 14 Main Commercial Complex, Market Gate', 28.6219000, 77.2140000, 'Resolved', 2, 'Smt. Sunita Rao', 'Compactor truck deployed. Area cleared, sanitized with lime powder and geo-tagged inspection complete.'),
(3, 'SC-2026-00003', 2, 'Broken water pipeline causing continuous clean water flooding', 'Underground mainline burst is leaking thousands of liters of clean municipal drinking water onto the street.', 'Water Supply', 'Emergency', '7th Cross Road, Indira Nagar Colony', 28.6289000, 77.2050000, 'Assigned', 3, 'Er. K. Natarajan', NULL)
ON DUPLICATE KEY UPDATE complaint_code=complaint_code;

-- Initial status history logs
INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES
(1, NULL, 'Submitted', 2, 'Complaint registered by citizen with location coordinates.'),
(1, 'Submitted', 'Under Review', 1, 'Inspected by central intake officer. High priority road hazard verified.'),
(1, 'Under Review', 'In Progress', 1, 'Assigned to Public Works Department road patching brigade.'),
(2, NULL, 'Submitted', 2, 'Initial complaint registered by citizen.'),
(2, 'Submitted', 'Assigned', 1, 'Routed to Solid Waste Management zonal supervisor.'),
(2, 'Assigned', 'Resolved', 1, 'Zonal truck cleared waste at 08:30 AM. Bleaching powder spread.')
ON DUPLICATE KEY UPDATE complaint_id=complaint_id;
