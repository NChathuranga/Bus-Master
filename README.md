# 🚌 Bus Master Pro - Bus Management System

A state-of-the-art **MERN Stack (MongoDB Atlas, Express.js, React 18 + Vite, Node.js)** Enterprise Fleet & Transport Management Application.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features & System Capabilities](#-key-features--system-capabilities)
3. [User Manual & Step-by-Step Guide](#-user-manual--step-by-step-guide)
4. [System Login Credentials Directory](#-system-login-credentials-directory)
5. [Role & Permissions Matrix (RBAC)](#-role--permissions-matrix-rbac)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Tech Stack & System Architecture](#-tech-stack--system-architecture)
8. [Installation & Local Setup Guide](#-installation--local-setup-guide)
9. [Database Collections Reference](#-database-collections-reference)
10. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 🌐 Project Overview

Managing a national bus fleet requires seamless coordination between central transport authorities, depot managers, dispatch clerks, and bus drivers. **Bus Master Pro** centralizes operations into a unified, cloud-connected web application featuring real-time fleet tracking, multi-tier depot scoping, automated schedule conflict detection, driver self-service portals, and executive PDF report exports.

### **Core Capabilities:**
* **Multi-Tier Role Hierarchy**: Super Admin, Depot Admin, Staff Member, and Bus Driver.
* **Depot Scoping & Isolation**: Strict data scoping ensuring Depot Admins, Staff, and Drivers access only their assigned depot data.
* **Dual-Authentication**: Sign in using either a **Username** or an **Email Address** (`@`).
* **Self-Service Password Reset & Profile Management**: Drivers and staff can change passwords or reset forgotten accounts directly.
* **Case-Insensitive Duplicate Prevention**: Advanced regex matching ensures zero duplicate usernames or emails.
* **Live Global Search Engine**: Search across Depots, Buses, Routes, and Drivers in real-time.
* **Executive PDF Exports**: One-click generation of branded PDF performance reports for national, depot, or driver scopes.
* **Cloud Database Persistence**: Connected live to **MongoDB Atlas Cloud**.

---

## ⚡ Key Features & System Capabilities

### 🔐 1. Smart Authentication & Security
- **Dual Login**: Login using either Username (e.g. `driver_kamal`) OR Email (e.g. `kamal.driver@busmaster.lk`).
- **Forgot Password Modal**: Instantly reset account password on the login screen using username or email.
- **Header Profile & Security**: Dedicated **🔑 Password** modal accessible directly from the Navbar header for all logged-in users.
- **JWT & Bcrypt Hashing**: Secure 24-hour JSON Web Token authentication with 10-round bcrypt password hashing.

### 🏢 2. Depot & Fleet Management
- **Automated Depot Manager Linkage**: Creating a new Depot automatically provisions its linked Depot Admin account.
- **Depot Inactivation**: Deactivate obsolete depots while preserving historic logs and scheduling records.
- **Fleet Tracking**: Monitor bus registration numbers, vehicle types, capacity, mileage, and active maintenance statuses.

### 📅 3. Trip Scheduling & Conflict Detection
- **Roster & Dispatch**: Assign drivers and vehicles to route schedules.
- **Conflict Prevention Engine**: Automated validation checks prevent double-booking a driver or vehicle on overlapping time windows.

### 📝 4. Driver Portal & Request Approval Workflow
- **Driver Self-Service Hub**: View personal assigned schedules, duty routes, and bus assignments.
- **Fuel & Maintenance Requests**: Drivers submit fuel quota requests or vehicle issue reports directly from their mobile/desktop portal.
- **Depot Approval Center**: Depot Admins review pending requests in real-time. Approving a request automatically generates official **Fuel Logs** or **Service Records**.

---

## 📖 User Manual & Step-by-Step Guide

### **1. Accessing the Application**
* Open your web browser and navigate to: `http://localhost:5173`
* Sign in using your **Username** OR **Email Address** along with your password (`admin123`).

---

### **2. Super Admin Guide**
* **Global Header Search**: Search any Depot Name, City, Vehicle Number, Route, or Driver Name instantly.
* **Global Depot Switcher**: Toggle between *"All Depots (National)"* or filter down to a specific depot.
* **Depot Management (`/depots`)**:
  * Click **+ Add Depot** to register a new depot location.
  * Fill in Depot Name, Code, City, Address, Contact, and Capacity.
  * Enter Manager Username & Password; the system automatically creates the linked Depot Admin user.
* **Executive Reports (`/reports`)**: Select National Scope or specific Depot Scope and click **Export Depot PDF** to download branded reports.

---

### **3. Depot Admin Guide**
* **Depot Operations Scope**: Operations are automatically locked to your assigned depot (e.g. *Colombo Central Bus Depot*).
* **Approval Center (`/requests`)**:
  * Review pending **Fuel Requests** and **Maintenance Requests** submitted by drivers and staff.
  * Click **Approve** to approve — the system **automatically populates** the corresponding Fuel Log or Maintenance record.
  * Click **Reject** to decline invalid requests with mandatory notes.
* **Fleet & Driver Roster (`/drivers`, `/vehicles`)**: Manage local drivers, update driver license expiry dates, and assign fleet buses.

---

### **4. Staff Member Guide**
* **Driver Management**: Register drivers, update contact details, and view 30-day license expiration warnings.
* **Trip Scheduling (`/schedules`)**: Create trip schedules by matching routes, vehicles, and available drivers.
* **Service Records (`/maintenance`, `/fuel-logs`)**: View service histories and fuel consumption logs.

---

### **5. Bus Driver Guide (`/driver-portal`)**
* **Personal Console**: Access your dark-purple header console showing your name, license status, and depot badge.
* **Submit Requests**:
  * **+ Fuel Request**: Submit fuel allowance requests for your bus.
  * **+ Maintenance Request**: Report engine, brake, or mechanical issues to depot management.
* **Profile & Security**:
  * Click **Password / Account Settings** in the action grid or top navbar.
  * Update your **Display Name** or change your **Login Password** securely.
* **Duty Schedule & PDF Export**: View upcoming trip shifts and click **Download Report (PDF)** to generate your official duty sheet.

---

## 🔑 System Login Credentials Directory

All accounts are pre-seeded and active on **MongoDB Atlas Cloud**.  
You can sign in using **EITHER the Username OR the Email Address** with password `admin123`:

| User Role | Full Name | Username Login | Email Login (`@`) | Password | Scope / Primary Function |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | System Admin | `admin` | `admin@busmaster.lk` | `admin123` | Full National Control & Setup |
| **Super Admin** | System Administrator | `superadmin` | `superadmin@busmaster.lk` | `admin123` | Global Administration & All Depots |
| **Depot Admin** | Colombo Depot Manager | `colombo_admin` | `colombo.admin@busmaster.lk` | `admin123` | Colombo Depot Management & Approvals |
| **Depot Admin** | Kandy Depot Manager | `kandy_admin` | `kandy.admin@busmaster.lk` | `admin123` | Kandy Depot Management & Approvals |
| **Depot Staff** | Colombo Dispatch Clerk | `staff_colombo` | `staff.colombo@busmaster.lk` | `admin123` | Colombo Staff Operations & Roster |
| **Bus Driver** | Kamal Perera | `driver_kamal` | `kamal.driver@busmaster.lk` | `admin123` | Driver Portal & Duty Shifts |
| **Bus Driver** | Nimal Silva | `driver_nimal` | `nimal.driver@busmaster.lk` | `admin123` | Driver Portal & Duty Shifts |

---

## 🛡️ Role & Permissions Matrix (RBAC)

| Feature / Action | **Super Admin** | **Depot Admin** | **Staff** | **Driver** |
| :--- | :---: | :---: | :---: | :---: |
| **National Scope & Global Depot Switcher** | ✅ Full Access | ❌ Restricted | ❌ Restricted | ❌ Personal Only |
| **Create Depots & Depot Admins** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Register Staff & Drivers** | ✅ Yes | ✅ Yes (Depot Scope) | ✅ Yes (Drivers Only) | ❌ No |
| **Manage Fleet Vehicles & Routes** | ✅ Global | ✅ Assigned Depot | ✅ Assigned Depot | 👁️ View Only |
| **Assign Trips & Duty Schedules** | ✅ Global | ✅ Assigned Depot | ✅ Assigned Depot | 👁️ My Shifts Only |
| **Submit Fuel & Maintenance Requests** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Approve / Reject Requests** | ✅ Yes | ✅ Yes (Depot Scope) | ✅ Yes (Depot Scope) | ❌ No |
| **Generate & Export PDF Reports** | ✅ National / Depot | ✅ Assigned Depot | ✅ Assigned Depot | ✅ My Driver PDF |
| **Rename Profile & Change Password** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 📡 API Endpoints Reference

### **Authentication Routes (`/api/auth`)**
* `POST /api/auth/login` - Authenticate via Username or Email + Password. Returns JWT token & user object.
* `POST /api/auth/register` - Register a new account (Case-insensitive username/email validation).
* `POST /api/auth/forgot-password` - Reset account password by entering Username/Email and new password.
* `PUT /api/auth/change-password` - Change password for currently logged-in user (requires current password).
* `PUT /api/auth/profile` - Update display name and profile details for logged-in user.

### **Depot Routes (`/api/depots`)**
* `GET /api/depots` - Get all depots (Supports active filter).
* `POST /api/depots` - Create new depot & automatically provision linked Depot Admin user.
* `PUT /api/depots/:id` - Update depot details.
* `PUT /api/depots/:id/inactivate` - Soft-delete / deactivate depot.

### **Fleet & Vehicle Routes (`/api/vehicles`)**
* `GET /api/vehicles` - Get list of vehicles (Filterable by `depotId`).
* `POST /api/vehicles` - Add new bus vehicle to depot fleet.
* `PUT /api/vehicles/:id` - Update bus mileage, type, or status.
* `DELETE /api/vehicles/:id` - Remove vehicle from fleet.

### **Driver & Route Routes (`/api/drivers`, `/api/routes`)**
* `GET /api/drivers` - Get registered drivers (Includes 30-day license expiry warnings).
* `POST /api/drivers` - Register new driver record.
* `GET /api/routes` - Get all bus routes and intermediate stops.
* `POST /api/routes` - Create new route definition.

### **Schedule & Request Routes (`/api/schedules`, `/api/requests`)**
* `GET /api/schedules` - Get trip schedules (Supports driver/vehicle conflict detection).
* `POST /api/schedules` - Create new trip schedule.
* `GET /api/requests` - Get pending/processed requests.
* `POST /api/requests` - Submit new fuel or maintenance request.
* `PUT /api/requests/:id/status` - Approve or reject request (Auto-generates fuel/maintenance record on approval).

---

## ⚡ Tech Stack & System Architecture

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | Single Page Application (SPA), Dark/Glassmorphism UI |
| **Backend** | Node.js, Express.js | RESTful API Server, Middleware RBAC Authentication |
| **Database** | MongoDB Atlas Cloud | Scalable Cloud NoSQL Persistence |
| **Security** | JSON Web Tokens (JWT), bcrypt.js | Secure Authentication & Password Encryption |
| **PDF Generation** | jsPDF, AutoTable | Executive Performance Report & Driver Shift Export |
| **Icons & UI** | Lucide React | Modern Vector Iconography |

---

## 🛠️ Installation & Local Setup Guide

### **Prerequisites**
* **Node.js** (v18.0 or higher)
* **npm** (v9.0 or higher)

### **1. Backend Setup**
```bash
cd backend
npm install
```

Ensure `.env` inside `backend/` contains:
```env
MONGO_URI=mongodb+srv://rchathu003_db_user:Asd22874@cluster0.8s488vc.mongodb.net/bus_management?retryWrites=true&w=majority
JWT_SECRET=busmaster_jwt_secret_key_2026
PORT=5000
```

Start the backend server:
```bash
npm run dev
```
*(Backend server runs on `http://localhost:5000`)*

---

### **2. Frontend Setup**
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend application runs on `http://localhost:5173`)*

---

### **3. Seed Database Initial Data**
To seed or reset MongoDB Atlas Cloud database with initial depots, buses, routes, drivers, and user accounts:
```bash
cd backend
node seeder.js
```

---

## 🗄️ Database Collections Reference

* **`users`**: `username`, `email`, `password` (hashed), `role` (`super_admin` \| `depot_admin` \| `staff` \| `driver`), `depotId`, `name`, `contact`.
* **`depots`**: `name`, `code`, `city`, `location`, `contactNumber`, `capacity`, `status` (`active` \| `inactive`), `inactivatedAt`.
* **`vehicles`**: `registrationNumber`, `type`, `capacity`, `mileage`, `depotId`, `status` (`available` \| `on-route` \| `maintenance`).
* **`drivers`**: `name`, `licenseNumber`, `contact`, `licenseExpiry`, `depotId`, `assignedRoute`, `userId`, `workingHours`, `status`.
* **`routes`**: `startPoint`, `endPoint`, `stops[]`, `distance`, `depotId`.
* **`schedules`**: `routeId`, `vehicleId`, `driverId`, `departureTime`, `arrivalTime`, `status`, `notes`.
* **`requests`**: `requestType` (`fuel` \| `maintenance`), `depotId`, `requestedBy`, `vehicleId`, `vehicleReg`, `details`, `status` (`pending` \| `approved` \| `rejected`), `approvedBy`, `actionNotes`.
* **`fuelLogs`**: `vehicleId`, `liters`, `cost`, `fuelStation`, `date`.
* **`maintenances`**: `vehicleId`, `type`, `description`, `cost`, `status`, `date`.

---

## ❓ Troubleshooting Guide

* **"Username or Email already registered"**: The system uses case-insensitive validation. Ensure username and email are unique.
* **"Invalid username/email or password"**: Double-check credentials in the [Credentials Directory](#-system-login-credentials-directory). Password for all seeded accounts is `admin123`.
* **MongoDB Atlas SRV Resolution Issue**: Built-in Google DNS resolution (`8.8.8.8`) is configured in `backend/config/db.js` to prevent ISP DNS blocking on Windows.
* **Port Conflict (5000 / 5173)**: Ensure ports 5000 and 5173 are free before launching `npm run dev`.

---

### 👨‍💻 Developed & Verified
**Bus Master Pro — Enterprise Fleet Management System**  
*All endpoints, dual-login workflows, driver portals, and database models verified with 0 errors.*
