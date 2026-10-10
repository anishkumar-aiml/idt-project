-- ============================================================================
-- Smart Civic Complaint System - MySQL 8 Database Schema
-- Project Owner & Student: Anish Kumar Singh
-- Database: smart_civic
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smart_civic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_civic;

-- ----------------------------------------------------------------------------
-- Table: users
-- Stores registered citizens and administrative officers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen', 'admin') NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: departments
-- Municipal and civic authority departments handling issues
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  contact_email VARCHAR(150),
  head_officer VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: complaints
-- Primary civic issues reported by citizens
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_code VARCHAR(30) NOT NULL UNIQUE,
  citizen_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category ENUM(
    'Road/Pothole',
    'Garbage',
    'Water Supply',
    'Drainage',
    'Streetlight',
    'Electricity',
    'Public Sanitation',
    'Other'
  ) NOT NULL,
  priority ENUM('Low', 'Medium', 'High', 'Emergency') NOT NULL DEFAULT 'Medium',
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  image_url VARCHAR(500) NULL,
  status ENUM(
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Rejected'
  ) NOT NULL DEFAULT 'Submitted',
  department_id INT NULL,
  assigned_to VARCHAR(100) NULL,
  resolution_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaints_citizen FOREIGN KEY (citizen_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_complaints_department FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_complaints_code (complaint_code),
  INDEX idx_complaints_citizen (citizen_id),
  INDEX idx_complaints_status (status),
  INDEX idx_complaints_category (category),
  INDEX idx_complaints_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: complaint_assignments
-- Audit trail of department & officer delegations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  department_id INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_officer VARCHAR(100) NOT NULL,
  notes TEXT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignment_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_dept FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_assignment_user FOREIGN KEY (assigned_by)
    REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_assignment_complaint (complaint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: complaint_status_history
-- Immutable audit log of every workflow state transition
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (changed_by)
    REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_history_complaint (complaint_id),
  INDEX idx_history_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
