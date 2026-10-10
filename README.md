# Smart Civic Complaint System

**Project Owner & Student:** Anish Kumar Singh  
**System Name:** Smart Civic Complaint System  
**Tagline:** Report civic issues. Track progress. Build a better city.  
**Tech Stack:** React 19, Vite, Tailwind CSS, Node.js, Express, MySQL 8, JWT, bcrypt, Multer  

---

## 🏛️ Project Overview

The **Smart Civic Complaint System** is an enterprise-grade, full-stack municipal grievance redressal web application. It connects citizens directly with municipal authorities (Public Works Department, Solid Waste Management, Water Supply & Sewerage Board, Electricity & Streetlighting, Urban Drainage) to report, route, inspect, and resolve civic hazards.

### Key Capabilities

1. **Citizen Portal**:
   - Register and login with secure bcrypt-hashed passwords.
   - File geo-tagged civic complaints with title, category, address, optional GPS coordinates, urgency priority, and photographic evidence.
   - Auto-generated sequential Complaint Reference IDs (e.g., `SC-2026-00001`).
   - Personal Citizen Dashboard with search, filter tabs (All / Active & Pending / Resolved), and detailed status audit logs.
   - Capability to add citizen follow-up remarks to open cases.

2. **Public Complaint Tracking**:
   - Public reference search protecting citizen privacy (never reveals passwords, phone numbers, email addresses, or internal confidential notes).
   - Real-time visual progress timeline displaying stages: `Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved` (or `Rejected`).
   - Official municipal resolution notes with completion proof.

3. **Municipal Administrator Control Console**:
   - Role-based authorization (`admin` role enforced on server).
   - Real-time database KPI dashboard: Total, Submitted, Under Review, Assigned, In Progress, Resolved, Rejected.
   - Dynamic charts: Complaints by Category and Department Workload Allocation.
   - Dispatch module: Assign grievances to specific municipal departments and designated field officers.
   - Update workflow status with official remarks logged in `complaint_status_history`.
   - Civic Department Management: Register new municipal departments dynamically.
   - Downloadable CSV Export formatted according to RFC 4180.

---

## 🗄️ Database Architecture (`smart_civic`)

The system utilizes a 3NF normalized relational schema designed for MySQL 8 (with dual-engine compatibility for local development via embedded relational storage).

### Tables

1. **`users`**
   - `id` (INT, PK, AUTO_INCREMENT)
   - `name` (VARCHAR(100))
   - `email` (VARCHAR(150), UNIQUE)
   - `mobile` (VARCHAR(20))
   - `password_hash` (VARCHAR(255))
   - `role` (ENUM('citizen', 'admin'))
   - `created_at`, `updated_at` (TIMESTAMP)

2. **`departments`**
   - `id` (INT, PK, AUTO_INCREMENT)
   - `name` (VARCHAR(100), UNIQUE)
   - `code` (VARCHAR(20), UNIQUE)
   - `contact_email` (VARCHAR(150))
   - `head_officer` (VARCHAR(100))
   - `created_at` (TIMESTAMP)

3. **`complaints`**
   - `id` (INT, PK, AUTO_INCREMENT)
   - `complaint_code` (VARCHAR(30), UNIQUE, e.g. `SC-2026-00001`)
   - `citizen_id` (INT, FK → users.id)
   - `title` (VARCHAR(200))
   - `description` (TEXT)
   - `category` (ENUM: 'Road/Pothole', 'Garbage', 'Water Supply', 'Drainage', 'Streetlight', 'Electricity', 'Public Sanitation', 'Other')
   - `priority` (ENUM: 'Low', 'Medium', 'High', 'Emergency')
   - `address` (VARCHAR(255))
   - `latitude`, `longitude` (DECIMAL(10, 7))
   - `image_url` (VARCHAR(500))
   - `status` (ENUM: 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected')
   - `department_id` (INT, FK → departments.id)
   - `assigned_to` (VARCHAR(100))
   - `resolution_notes` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

4. **`complaint_assignments`**
   - `id` (INT, PK, AUTO_INCREMENT)
   - `complaint_id` (INT, FK → complaints.id)
   - `department_id` (INT, FK → departments.id)
   - `assigned_by` (INT, FK → users.id)
   - `assigned_officer` (VARCHAR(100))
   - `notes` (TEXT)
   - `assigned_at` (TIMESTAMP)

5. **`complaint_status_history`**
   - `id` (INT, PK, AUTO_INCREMENT)
   - `complaint_id` (INT, FK → complaints.id)
   - `previous_status` (VARCHAR(50))
   - `new_status` (VARCHAR(50))
   - `changed_by` (INT, FK → users.id)
   - `remarks` (TEXT)
   - `created_at` (TIMESTAMP)

All SQL definitions and seeds are located in:
- `/database/schema.sql`: Full DDL script.
- `/database/seed.sql`: Initial seed data (default departments, initial administrator, sample citizen, and sample grievances).
- `/database/test-queries.sql`: Pre-written audit and reporting queries.

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm or bun
- Optional: MySQL 8 server (if running with an external MySQL database)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/anish-singh/smart-civic-complaint-system.git
cd smart-civic-complaint-system

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure parameters in `.env`:

```env
PORT=3000
JWT_SECRET="smart_civic_super_secure_jwt_token_2026_key"
JWT_EXPIRES_IN="7d"

# MySQL 8 Configuration (Leave empty to use built-in embedded relational storage)
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="your_mysql_password"
DB_NAME="smart_civic"
```

### 3. Setting Up MySQL 8 (Optional if connecting external MySQL)

In MySQL CLI or MySQL Workbench:

```sql
source database/schema.sql;
source database/seed.sql;
```

*Note: If `DB_HOST` is left empty in `.env`, the system automatically activates the embedded SQLite WASM engine with the exact same 5 tables and schemas.*

### 4. Running the Application

```bash
# Start full-stack development server on port 3000
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔑 Pre-Configured Test Accounts

The database comes pre-seeded with accounts for testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartcivic.gov.in` | `Admin@2026` | Full Municipal Access: Dispatch, update status, view stats, export CSV |
| **Citizen** | `citizen.rahul@smartcivic.gov.in` | `Citizen@2026` | Submit grievances, track personal reports, add follow-up notes |

---

## 🧪 Testing User Workflows

1. **Citizen Submission Flow**:
   - Navigate to `/` → Click **"Report a Problem"**.
   - Fill in Title, Description, Category, Address, Click **"Detect My Location"** for GPS.
   - Attach a sample photo evidence.
   - Click **"Submit Complaint"** → Confirm generated ID (e.g. `SC-2026-00004`).

2. **Public Tracking Flow**:
   - Go to **"Track Complaint"** in the top navigation.
   - Enter `SC-2026-00001` or any generated ID.
   - Verify timeline progression and ensure no sensitive citizen phone or email is displayed.

3. **Admin Workflow**:
   - Click **"Sign In"** → Select **"Admin Officer"** demo button.
   - View KPI metrics and Category breakdown.
   - Click **"Action / Assign"** on an open grievance:
     - Set Status to `In Progress` or `Resolved`.
     - Assign to `Public Works Department (PWD)` and designate officer `Er. Rajesh Varma`.
     - Add official remarks.
   - Confirm status update in database and audit history log.
   - Click **"Export CSV"** to download the complaint report.

---

## 📦 Production Deployment

### 1. Production Build

```bash
npm run build
npm start
```

### 2. Cloud Hosting Options

- **Database**: Cloud SQL for MySQL 8, AWS RDS MySQL, PlanetScale, or DigitalOcean Managed MySQL.
- **Backend / Full-Stack**: Render, Railway, DigitalOcean App Platform, or Google Cloud Run.
  - Set Environment Variables: `PORT`, `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
  - Start command: `node server.ts` or `npm start`.
- **Static Frontend** (if decoupling):
  - Configure `VITE_API_URL` to point to the backend server.
  - Deploy `dist/` folder to Vercel, Netlify, or Cloudflare Pages.

---

## 📄 License & Attribution

Designed and developed by **Anish Kumar Singh** as a comprehensive capstone project for the Smart Civic Complaint System.
