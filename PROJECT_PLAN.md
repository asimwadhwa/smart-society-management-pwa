# Plan: Asim Wadhwa Society Management System

A complete society management web app with **Next.js 14 + Express.js + MongoDB**, featuring Razorpay payments (₹1000/month + ₹100 late fee), Brevo email alerts, OTP password reset, ImageKit uploads, and watchman portal. Fully responsive for mobile & desktop.

---

## Project Overview

| Attribute | Details |
|-----------|---------|
| **Society Name** | Asim Wadhwa |
| **Total Flats** | 30-40 flats |
| **Flat Format** | Floor-based (101, 102, 201, 202...) |
| **Monthly Maintenance** | ₹1000 (fixed) |
| **Late Fee** | ₹100 after 10 days |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui, Axios |
| Backend | Express.js, Node.js, node-cron |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt, OTP via Brevo |
| Payments | Razorpay (UPI, Cards) |
| Email | Brevo Transactional API |
| Image Upload | ImageKit.io |
| Deployment | Vercel (frontend), Render (backend) |

---

## User Roles

| Role | Access Level |
|------|--------------|
| **Manager** | Super admin, first registered user, can assign admin role |
| **Admin** | Can manage complaints, emergencies, assets, view all payments |
| **Resident** | Pay maintenance, file complaints, trigger emergency, view own data |
| **Watchman** | Simplified portal - emergency alerts + gate log only |

---

## Steps

### Step 1: Initialize Monorepo Project Structure
- Create `/client` (Next.js 14 App Router, Tailwind CSS, shadcn/ui)
- Create `/server` (Express.js)
- Set up MongoDB Atlas cluster with Mongoose ODM
- Configure `.env` files for:
  - Razorpay API keys
  - Brevo API key
  - ImageKit credentials
  - MongoDB URI
  - JWT secret

### Step 2: Design MongoDB Schemas

#### User Schema
```javascript
{
  name: String,
  flat_no: String,           // Format: 101, 201, etc.
  email: String (unique),
  phone: String,
  role: Enum ['manager', 'admin', 'resident', 'watchman'],
  password_hash: String,
  is_verified: Boolean,
  otp: String,
  otp_expires: Date,
  created_at: Date
}
```

#### Maintenance Schema
```javascript
{
  flat_no: String,
  month: Number,             // 1-12
  year: Number,
  amount: Number,            // Fixed 1000
  due_date: Date,            // 18 days from generation
  paid_date: Date,
  late_fee: Number,          // 100 if overdue
  status: Enum ['pending', 'paid', 'overdue'],
  razorpay_payment_id: String,
  razorpay_order_id: String
}
```

#### PaymentLog Schema
```javascript
{
  user_id: ObjectId,
  flat_no: String,
  amount: Number,
  payment_date: Date,
  transaction_id: String,
  month: Number,
  year: Number
}
```

#### LiftEmergency Schema
```javascript
{
  triggered_by: ObjectId,
  triggered_at: Date,
  status: Enum ['active', 'resolved'],
  resolved_by: ObjectId,
  resolved_at: Date
}
```

#### Complaint Schema
```javascript
{
  flat_no: String,
  user_id: ObjectId,
  description: String,
  image_url: String,         // ImageKit URL
  status: Enum ['open', 'in-progress', 'resolved'],
  created_at: Date,
  updated_at: Date
}
```

#### GateLog Schema
```javascript
{
  visitor_name: String,
  flat_no_visiting: String,
  purpose: String,
  in_time: Date,
  out_time: Date,
  logged_by: ObjectId        // Watchman user ID
}
```

#### Asset Schema
```javascript
{
  type: Enum ['lift', 'water_pump', 'generator'],
  status: Enum ['working', 'under_maintenance', 'not_working'],
  services: [{
    date: Date,
    description: String,
    done_by: String
  }]
}
```

### Step 3: Build Authentication System

- **JWT-based auth** with httpOnly cookies
- **bcrypt** for password hashing
- **One-time manager registration page**:
  - First user to register becomes manager
  - Page disabled after manager exists
- **Self-registration for residents**:
  - Select flat_no from dropdown
  - Instant access after registration
- **Watchman registration** by manager only
- **Password Reset Flow**:
  1. Enter email
  2. Receive 6-digit OTP via Brevo
  3. Verify OTP
  4. Set new password

### Step 4: Implement Maintenance Payment Module

#### Automated Jobs (node-cron)
- **1st of month**: Generate `Maintenance` record for all registered flats
  - Amount: ₹1000
  - Due date: 18 days from generation
  - Status: pending
- **Daily check**: 
  - Find overdue payments (past due_date, status=pending)
  - Add ₹100 late fee
  - Update status to "overdue"

#### Email Reminders via Brevo
- **Day 1**: Invoice email with payment link
- **Day 10**: Reminder email
- **Day 16**: Final warning with late fee notice

#### Payment Flow
1. Resident clicks "Pay Now"
2. Razorpay checkout opens (UPI/Card)
3. On success, Razorpay webhook triggers
4. Server updates `Maintenance` record (status=paid, paid_date, payment_id)
5. Create `PaymentLog` entry
6. Send payment confirmation email

#### Dashboard Display
- Current month status (paid/pending/overdue amount)
- Simple payment history table (date, amount, transaction ID)

### Step 5: Create Lift Emergency Alert System

#### Trigger Flow
1. Resident/Watchman clicks big red "EMERGENCY" button
2. Create `LiftEmergency` record with status=active
3. Brevo sends email to ALL users:
   - Subject: "🚨 LIFT EMERGENCY - Asim Wadhwa"
   - Body: Flat number, timestamp, "Someone is stuck in the lift!"

#### Active Emergency Display
- Banner shown on all dashboards
- Poll every 30 seconds for active emergencies

#### Resolution Flow
1. Manager/Admin clicks "Mark Resolved"
2. Update record (status=resolved, resolved_by, resolved_at)
3. Send "Emergency Resolved" email to all users

### Step 6: Build Complaints Module

#### Resident Features
- Form with:
  - Description (textarea, required)
  - Image upload (optional, via ImageKit)
- View own complaints with status badges

#### Admin Features
- View all complaints
- Update status: Open → In Progress → Resolved
- Status change triggers email to complaint creator

### Step 7: Asset Service Tracking

#### Manager Features
- Add/Edit assets (Lift, Water Pump, Generator)
- Set current status (Working, Under Maintenance, Not Working)
- Log service entry:
  - Date
  - Description
  - Done by (technician name)

#### Dashboard Widget
- Asset health status cards
- Last service date for each asset

### Step 8: Build Watchman Portal

#### Separate Route: `/watchman`
- Mobile-first simple UI
- Requires watchman role to access

#### Features
1. **Emergency Alerts**
   - View active lift emergencies
   - Trigger emergency alert button

2. **Gate Log**
   - Entry form:
     - Visitor name
     - Flat visiting (dropdown)
     - Purpose
     - In-time (auto-captured)
   - Today's log view
   - Mark out-time for visitors

### Step 9: Set Up Deployment

#### Frontend (Vercel)
- Connect GitHub repository
- Set environment variables:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
  - `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
  - `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
- Auto-deploy from main branch

#### Backend (Render)
- Create Web Service (Node.js)
- Set environment variables:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `BREVO_API_KEY`
  - `IMAGEKIT_PRIVATE_KEY`
  - `IMAGEKIT_PUBLIC_KEY`
  - `IMAGEKIT_URL_ENDPOINT`
  - `CLIENT_URL`
- MongoDB Atlas IP whitelist for Render

---

## Project Folder Structure

```
Society_Management/
├── client/                     # Next.js 14 frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── manager-setup/   # One-time manager registration
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Home dashboard
│   │   │   ├── maintenance/
│   │   │   │   └── page.tsx
│   │   │   ├── complaints/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── emergency/
│   │   │   │   └── page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       ├── payments/
│   │   │       │   └── page.tsx
│   │   │       ├── complaints/
│   │   │       │   └── page.tsx
│   │   │       └── assets/
│   │   │           └── page.tsx
│   │   ├── watchman/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── emergency/
│   │   │   │   └── page.tsx
│   │   │   └── gate-log/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── EmergencyButton.tsx
│   │   ├── PaymentCard.tsx
│   │   ├── ComplaintForm.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── api.ts               # Axios instance
│   │   ├── auth.ts              # Auth utilities
│   │   ├── imagekit.ts          # ImageKit config
│   │   └── utils.ts             # Helper functions
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useEmergency.ts
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── middleware.ts            # Route protection
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── server/
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   ├── brevo.js             # Email setup
│   │   ├── razorpay.js          # Payment gateway
│   │   └── imagekit.js          # Image upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Maintenance.js
│   │   ├── PaymentLog.js
│   │   ├── LiftEmergency.js
│   │   ├── Complaint.js
│   │   ├── GateLog.js
│   │   └── Asset.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── maintenance.routes.js
│   │   ├── payment.routes.js
│   │   ├── emergency.routes.js
│   │   ├── complaint.routes.js
│   │   ├── gatelog.routes.js
│   │   └── asset.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── maintenance.controller.js
│   │   ├── payment.controller.js
│   │   ├── emergency.controller.js
│   │   ├── complaint.controller.js
│   │   ├── gatelog.controller.js
│   │   └── asset.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   ├── services/
│   │   ├── email.service.js     # Brevo transactional emails
│   │   ├── payment.service.js   # Razorpay logic
│   │   └── upload.service.js    # ImageKit
│   ├── jobs/
│   │   ├── index.js             # Cron job initializer
│   │   ├── maintenanceGenerator.js  # 1st of month
│   │   ├── lateFeeApplier.js        # Daily check
│   │   └── reminderSender.js        # Day 1, 10, 16
│   ├── utils/
│   │   ├── generateOTP.js
│   │   └── validators.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
├── .env.example
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (resident) |
| POST | `/api/auth/manager-setup` | One-time manager registration |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/forgot-password` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/reset-password` | Reset password with verified OTP |
| GET | `/api/auth/me` | Get current user |

### Users (Admin/Manager)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| PUT | `/api/users/:id/role` | Update user role |
| POST | `/api/users/watchman` | Create watchman account |
| DELETE | `/api/users/:id` | Delete user |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance` | Get current user's maintenance |
| GET | `/api/maintenance/all` | Get all flats maintenance (admin) |
| GET | `/api/maintenance/history` | Get payment history |
| POST | `/api/maintenance/create-order` | Create Razorpay order |
| POST | `/api/maintenance/verify-payment` | Verify Razorpay payment (webhook) |

### Emergency
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency/trigger` | Trigger lift emergency |
| GET | `/api/emergency/active` | Get active emergencies |
| PUT | `/api/emergency/:id/resolve` | Mark emergency as resolved |
| GET | `/api/emergency/history` | Get emergency history |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | Create new complaint |
| GET | `/api/complaints` | Get user's complaints |
| GET | `/api/complaints/all` | Get all complaints (admin) |
| PUT | `/api/complaints/:id/status` | Update complaint status |

### Gate Log (Watchman)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gatelog` | Create gate log entry |
| GET | `/api/gatelog/today` | Get today's entries |
| PUT | `/api/gatelog/:id/out` | Mark visitor out time |

### Assets (Manager)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | Get all assets |
| POST | `/api/assets` | Create asset |
| PUT | `/api/assets/:id` | Update asset status |
| POST | `/api/assets/:id/service` | Log service entry |

---

## Environment Variables

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxx
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

### Server (.env)
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rajarshi_darshan

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Brevo
BREVO_API_KEY=xkeysib-xxxxx
BREVO_SENDER_EMAIL=noreply@rajarshidarshan.com
BREVO_SENDER_NAME=Asim Wadhwa Society

# ImageKit
IMAGEKIT_PUBLIC_KEY=public_xxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Server
PORT=4000
NODE_ENV=development
```

---

## Email Templates (Brevo)

### 1. Maintenance Invoice (Day 1)
- Subject: "🏠 Maintenance Due - January 2026 | Asim Wadhwa"
- Body: Flat number, amount (₹1000), due date, payment link

### 2. Reminder (Day 10)
- Subject: "⏰ Reminder: Maintenance Payment Pending"
- Body: Amount due, 8 days remaining, payment link

### 3. Final Warning (Day 16)
- Subject: "⚠️ Final Notice: Pay Before Late Fee Applies"
- Body: Amount due, ₹100 late fee warning, 2 days remaining, payment link

### 4. Payment Confirmation
- Subject: "✅ Payment Received - Thank You!"
- Body: Amount paid, transaction ID, month, receipt

### 5. Lift Emergency Alert
- Subject: "🚨 LIFT EMERGENCY - Asim Wadhwa"
- Body: Flat number of person stuck, timestamp, urgent help needed

### 6. Emergency Resolved
- Subject: "✅ Lift Emergency Resolved"
- Body: Resolution time, resolved by

### 7. OTP for Password Reset
- Subject: "🔐 Password Reset OTP"
- Body: 6-digit OTP, valid for 10 minutes

### 8. Complaint Status Update
- Subject: "📋 Complaint Status Updated"
- Body: Complaint description, new status, updated by

---

## Implementation Priority

1. ✅ Project setup & folder structure
2. ✅ MongoDB schemas & database connection
3. ✅ Authentication (register, login, JWT)
4. ✅ Manager setup page
5. ✅ Basic dashboard UI
6. ⬜ Maintenance payment with Razorpay
7. ⬜ Payment reminders (cron jobs)
8. ⬜ Lift emergency system
9. ⬜ Complaints module
10. ⬜ Watchman portal
11. ⬜ Asset tracking
12. ⬜ Password reset with OTP
13. ⬜ Deployment

---

## Ready for Implementation! 🚀
