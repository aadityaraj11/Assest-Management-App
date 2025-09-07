# FireSafe - Fire Safety Asset Management System

## 📋 Project Overview

FireSafe is a comprehensive Fire Safety Asset Management System designed to help organizations maintain compliance, track safety equipment, and manage maintenance schedules for fire safety assets. This system ensures that all fire safety equipment is properly maintained, assigned, and tracked throughout its lifecycle.

### 🎯 Purpose & Why It Matters

Fire safety compliance is critical for any organization. This system solves key challenges:
- **Prevents equipment failure** through scheduled maintenance
- **Ensures regulatory compliance** with automated tracking
- **Reduces risk** by monitoring equipment status in real-time
- **Saves costs** by optimizing maintenance schedules and warranty management
- **Improves accountability** through assignment tracking and audit logs

## 🏗️ System Architecture

### Frontend (React + TypeScript)
- Modern React with TypeScript for type safety
- Tailwind CSS for responsive styling
- Role-based access control
- Real-time dashboard with analytics

### Backend (Node.js + Express + MongoDB)
- RESTful API architecture
- JWT authentication
- MongoDB with Mongoose ODM
- Role-based authorization

# FireSafe API Documentation


## 🔐 Authentication Endpoints

### **POST** `/api/v1/auth/login`
- **Description**: Authenticate user and return JWT token
- **Access**: Public
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### **POST** `/api/v1/auth/register`
- **Description**: Create new user (Admin privilege required)
- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "123-456-7890",
  "department": "Operations",
  "role": "technician"
}
```

### **POST** `/api/v1/auth/logout`
- **Description**: User logout
- **Access**: Authenticated users

### **POST** `/api/v1/auth/refresh`
- **Description**: Refresh access token
- **Access**: Authenticated users

### **POST** `/api/v1/auth/public-register`
- **Description**: User self-registration (assigns 'employee' role)
- **Access**: Public
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "987-654-3210",
  "department": "Sales"
}
```

---

## 👥 User Management Endpoints

### **GET** `/api/v1/users`
- **Description**: Get all users
- **Access**: Admin only
- **Query Parameters**: `role`, `department`, `page`, `limit`

### **GET** `/api/v1/users/profile`
- **Description**: Get current user profile
- **Access**: Authenticated users

### **GET** `/api/v1/users/:id`
- **Description**: Get user by ID
- **Access**: Admin only

### **PUT** `/api/v1/users/:id`
- **Description**: Update user
- **Access**: Admin only
- **Request Body**: (Partial user data)

### **DELETE** `/api/v1/users/:id`
- **Description**: Delete user
- **Access**: Admin only

---

## 📦 Asset Management Endpoints

### **GET** `/api/v1/assets`
- **Description**: Get all assets with filtering
- **Access**: Authenticated users
- **Query Parameters**: 
  - `status` (available, assigned, maintenance, retired)
  - `category` (extinguisher, detector, panel, sprinkler, etc.)
  - `location` (string)
  - `search` (string)
  - `page`, `limit` (pagination)

### **POST** `/api/v1/assets`
- **Description**: Create new asset
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "name": "Fire Extinguisher ABC-123",
  "assetTag": "FE-001",
  "category": "extinguisher",
  "serial": "ABC123XYZ",
  "vendorId": "vendor_id",
  "purchaseDate": "2023-01-15",
  "warrantyUntil": "2025-01-15",
  "cost": 250,
  "location": "Floor 1, Main Hallway",
  "metadata": {
    "manufacturer": "SafetyFirst",
    "model": "FE-500",
    "capacity": "5kg"
  }
}
```

### **GET** `/api/v1/assets/:id`
- **Description**: Get asset details
- **Access**: Authenticated users

### **PUT** `/api/v1/assets/:id`
- **Description**: Update asset
- **Access**: Admin/Ops

### **DELETE** `/api/v1/assets/:id`
- **Description**: Delete asset
- **Access**: Admin only

### **POST** `/api/v1/assets/:id/assign`
- **Description**: Assign asset to user
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "userId": "user_id",
  "dueDate": "2023-12-31",
  "notes": "Quarterly inspection assignment"
}
```

### **POST** `/api/v1/assets/:id/return`
- **Description**: Return assigned asset
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "notes": "Inspection completed"
}
```

### **POST** `/api/v1/assets/:id/maintenance`
- **Description**: Schedule maintenance
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "scheduledAt": "2023-11-15",
  "notes": "Routine maintenance",
  "vendorId": "vendor_id",
  "cost": 150
}
```

---

## 🔧 Maintenance Endpoints

### **GET** `/api/v1/maintenance`
- **Description**: Get maintenance records
- **Access**: Authenticated users
- **Query Parameters**: `status`, `assetId`, `page`, `limit`

### **POST** `/api/v1/maintenance`
- **Description**: Create maintenance record
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "assetId": "asset_id",
  "scheduledAt": "2023-11-15",
  "notes": "Routine maintenance scheduled",
  "vendorId": "vendor_id",
  "cost": 150
}
```

### **PUT** `/api/v1/maintenance/:id`
- **Description**: Update maintenance status
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "status": "in_progress",
  "performedAt": "2023-11-15T10:00:00Z",
  "cost": 175,
  "notes": "Additional parts required"
}
```

---

## 📋 Assignment Endpoints

### **GET** `/api/v1/assignments`
- **Description**: Get all assignments
- **Access**: Authenticated users
- **Query Parameters**: `status`, `userId`, `assetId`, `page`, `limit`

### **POST** `/api/v1/assignments`
- **Description**: Create assignment
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "assetId": "asset_id",
  "userId": "user_id",
  "dueDate": "2023-12-31",
  "notes": "Quarterly inspection assignment"
}
```

### **POST** `/api/v1/assignments/:id/return`
- **Description**: Return assignment
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "reason": "Inspection completed successfully"
}
```

---

## 📊 Dashboard & Reports Endpoints

### **GET** `/api/v1/dashboard/stats`
- **Description**: Get dashboard statistics
- **Access**: Authenticated users
- **Response**:
```json
{
  "totalAssets": 150,
  "availableAssets": 45,
  "assignedAssets": 85,
  "maintenanceAssets": 20,
  "overdueMaintenances": 5,
  "expiringWarranties": 8,
  "assetsByCategory": [
    { "category": "extinguisher", "count": 50 },
    { "category": "detector", "count": 40 }
  ]
}
```

### **GET** `/api/v1/reports/maintenance-due`
- **Description**: Maintenance due report
- **Access**: Authenticated users
- **Query Parameters**: `days` (default: 30)

### **GET** `/api/v1/reports/warranty-expiry`
- **Description**: Warranty expiry report
- **Access**: Authenticated users
- **Query Parameters**: `days` (default: 30)

### **GET** `/api/v1/reports/compliance`
- **Description**: Compliance report
- **Access**: Admin/Auditor

---

## 🏢 Vendor Endpoints

### **GET** `/api/v1/vendors`
- **Description**: Get all vendors
- **Access**: Authenticated users

### **POST** `/api/v1/vendors`
- **Description**: Create vendor
- **Access**: Admin/Ops
- **Request Body**:
```json
{
  "name": "ABC Fire Safety",
  "contact": "John Smith",
  "email": "john@abcfiresafety.com",
  "phone": "555-123-4567",
  "address": "123 Safety Street, City, State",
  "specialization": ["extinguisher", "detector"]
}
```

---

## 📝 Audit Log Endpoints

### **GET** `/api/v1/audit-logs`
- **Description**: Get audit logs
- **Access**: Admin/Auditor
- **Query Parameters**: `entityType`, `entityId`, `action`, `page`, `limit`

---

## 🔐 Authentication Header

All endpoints (except public ones) require authentication header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 🚦 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "errors": []
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific error details"]
}
```

---

## 📝 Pagination Response

Paginated endpoints return:
```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ 
- MongoDB 5+
- npm or yarn

### Backend Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd firesafe-backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configurations:
# MONGODB_URI=mongodb://localhost:27017/firesafe
# JWT_SECRET=your-super-secret-jwt-key
# JWT_EXPIRES_IN=7d
# PORT=3000

# Start the development server
npm run dev

# Or start production server
npm start
```

### Frontend Setup
```bash
cd firesafe-frontend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:3000/api/v1

# Start development server
npm run dev

# Build for production
npm run build
```

**FireSafe** - Ensuring fire safety through modern asset management technology. 🔥🛡️