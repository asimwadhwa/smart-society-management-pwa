# Architecture: Asim Wadhwa Society Management System

## Overview

A full-stack society management web application for **Asim Wadhwa** housing society (~40 flats). The system handles maintenance collection via Razorpay (₹1000/month + ₹100 late fee), lift emergency alerts via email, complaints with image uploads, asset tracking, and a dedicated watchman portal. Built with Next.js 14 + Express.js + MongoDB, deployed on Vercel + Render.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 14.x | React framework with App Router, SSR/SSG |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS framework |
| **UI Components** | shadcn/ui | latest | Pre-built accessible components |
| **HTTP Client** | Axios | 1.x | API requests from frontend |
| **Backend** | Express.js | 4.x | REST API server |
| **Runtime** | Node.js | 20.x LTS | JavaScript runtime |
| **Database** | MongoDB Atlas | 7.x | NoSQL document database |
| **ODM** | Mongoose | 8.x | MongoDB object modeling |
| **Authentication** | JWT | - | Stateless auth with httpOnly cookies |
| **Password Hashing** | bcrypt | 5.x | Secure password storage |
| **Scheduled Jobs** | node-cron | 3.x | Cron jobs for reminders, late fees |
| **Payments** | Razorpay | - | UPI/Card payment gateway |
| **Email** | Brevo (Sendinblue) | - | Transactional emails |
| **Image Upload** | ImageKit.io | - | Image CDN and transformation |
| **Frontend Hosting** | Vercel | - | Next.js optimized hosting |
| **Backend Hosting** | Render | - | Node.js web service |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Resident   │  │   Manager   │  │    Admin    │  │  Watchman   │        │
│  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │  │   Portal    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                          ┌────────▼────────┐                                │
│                          │   Next.js 14    │  ◄── Vercel                    │
│                          │   (Frontend)    │                                │
│                          └────────┬────────┘                                │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │ HTTPS
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                              API GATEWAY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                          ┌─────────────────┐                                │
│                          │   Express.js    │  ◄── Render                    │
│                          │   REST API      │                                │
│                          └────────┬────────┘                                │
│                                   │                                          │
│         ┌─────────────────────────┼─────────────────────────┐               │
│         │                         │                         │               │
│  ┌──────▼──────┐          ┌───────▼───────┐         ┌──────▼──────┐        │
│  │   Auth      │          │  Business     │         │   Cron      │        │
│  │ Middleware  │          │  Controllers  │         │   Jobs      │        │
│  └─────────────┘          └───────────────┘         └─────────────┘        │
│                                   │                                          │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  MongoDB    │  │  Razorpay   │  │   Brevo     │  │  ImageKit   │        │
│  │   Atlas     │  │  Payments   │  │   Email     │  │   CDN       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Authentication Module

**Purpose:** Secure user authentication with role-based access control

**Technology:** JWT + bcrypt + Brevo OTP

```
┌─────────────────────────────────────────────────────────┐
│                 AUTHENTICATION FLOW                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Register │───►│  Hash    │───►│  Save    │          │
│  │   Form   │    │ Password │    │  User    │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  Login   │───►│ Verify   │───►│  Issue   │          │
│  │   Form   │    │ Password │    │   JWT    │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  Forgot  │───►│  Send    │───►│  Verify  │          │
│  │ Password │    │   OTP    │    │   OTP    │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- User registration (self-register for residents, manager-only for watchman)
- One-time manager setup (first user becomes manager, page disables after)
- JWT token generation with 7-day expiry
- httpOnly cookie storage for security
- OTP-based password reset via Brevo email
- Role assignment (manager can promote residents to admin)

### 2. Maintenance Payment Module

**Purpose:** Collect monthly maintenance fees with Razorpay integration

**Technology:** Razorpay + node-cron + Brevo

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Cron: 1st   │────►│  Generate   │────►│ Send Email  │       │
│  │ of Month    │     │ Maintenance │     │ (Invoice)   │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Resident    │────►│  Razorpay   │────►│  Webhook    │       │
│  │ Pays        │     │  Checkout   │     │  Confirms   │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Cron: Daily │────►│ Check       │────►│ Add ₹100    │       │
│  │ Check       │     │ Overdue     │     │ Late Fee    │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- Auto-generate monthly maintenance records (1st of month)
- Send 3 email reminders (Day 1, Day 10, Day 16)
- Razorpay checkout integration (UPI, Cards)
- Webhook verification for payment confirmation
- Auto-apply ₹100 late fee after 18 days
- Payment history logging

### 3. Lift Emergency Module

**Purpose:** Alert all residents and watchman when someone is stuck in lift

**Technology:** Brevo email + Polling

```
┌─────────────────────────────────────────────────────────────────┐
│                 EMERGENCY ALERT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  EMERGENCY  │────►│  Create     │────►│ Email ALL   │       │
│  │   Button    │     │  Record     │     │  Users      │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                              │                                   │
│                              ▼                                   │
│                       ┌─────────────┐                           │
│                       │ Active      │◄──── Poll every 30s       │
│                       │ Emergency   │       (show banner)       │
│                       │ Banner      │                           │
│                       └──────┬──────┘                           │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Admin     │────►│   Mark      │────►│ Email ALL   │       │
│  │  Resolves   │     │  Resolved   │     │ (Resolved)  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- One-click emergency trigger from any dashboard
- Immediate email blast to all registered users
- Active emergency banner on all dashboards
- Resolution tracking with timestamp and resolver info
- Emergency history log for auditing

### 4. Complaints Module

**Purpose:** Allow residents to file complaints with optional images

**Technology:** ImageKit + Brevo

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMPLAINT FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Resident    │────►│  Upload     │────►│  Create     │       │
│  │ Files       │     │  Image      │     │  Complaint  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Admin     │────►│  Update     │────►│ Email       │       │
│  │  Reviews    │     │  Status     │     │ Resident    │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
│  Status Flow: Open ──► In Progress ──► Resolved                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- Simple complaint form (description + optional image)
- Image upload to ImageKit CDN
- Status tracking (Open → In Progress → Resolved)
- Email notifications on status change
- Separate views for residents (own) and admins (all)

### 5. Watchman Portal

**Purpose:** Simplified interface for watchman duties

**Technology:** Next.js with mobile-first design

```
┌─────────────────────────────────────────────────────────────────┐
│                   WATCHMAN PORTAL                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │    EMERGENCY ALERTS    │  │      GATE LOG          │        │
│  ├────────────────────────┤  ├────────────────────────┤        │
│  │ • View active alerts   │  │ • Log visitor entry    │        │
│  │ • Trigger emergency    │  │ • Mark visitor exit    │        │
│  │ • See alert history    │  │ • View today's log     │        │
│  └────────────────────────┘  └────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- Emergency alert viewing and triggering
- Gate log entry (visitor name, flat visiting, purpose, time)
- Auto-capture in-time, manual out-time marking
- Today's visitor log view
- Mobile-first responsive design

### 6. Asset Service Tracking

**Purpose:** Track maintenance status of society assets

**Technology:** MongoDB subdocuments

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSET TRACKING                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Assets: Lift | Water Pump | Generator                          │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Asset     │     │   Current   │     │  Service    │       │
│  │   Type      │────►│   Status    │────►│  History    │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
│  Status: Working | Under Maintenance | Not Working              │
│                                                                  │
│  Service Log: Date, Description, Done By                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- Asset CRUD operations (manager only)
- Status updates with history
- Service logging with technician details
- Dashboard widget for asset health overview

---

## Project Structure

```
Society_Management/
│
├── client/                          # Next.js 14 Frontend
│   │
│   ├── app/                         # App Router pages
│   │   │
│   │   ├── (auth)/                  # Auth route group (no layout nesting)
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login form
│   │   │   ├── register/
│   │   │   │   └── page.tsx         # Resident self-registration
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx         # OTP-based password reset
│   │   │   └── manager-setup/
│   │   │       └── page.tsx         # One-time manager registration
│   │   │
│   │   ├── (dashboard)/             # Protected dashboard routes
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── page.tsx             # Home dashboard (overview)
│   │   │   │
│   │   │   ├── maintenance/
│   │   │   │   └── page.tsx         # Pay maintenance, view history
│   │   │   │
│   │   │   ├── complaints/
│   │   │   │   ├── page.tsx         # List own complaints
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     # File new complaint
│   │   │   │
│   │   │   ├── emergency/
│   │   │   │   └── page.tsx         # Emergency button + history
│   │   │   │
│   │   │   └── admin/               # Admin-only routes
│   │   │       ├── layout.tsx       # Admin layout wrapper
│   │   │       ├── users/
│   │   │       │   └── page.tsx     # Manage users, assign roles
│   │   │       ├── payments/
│   │   │       │   └── page.tsx     # View all flat payments
│   │   │       ├── complaints/
│   │   │       │   └── page.tsx     # Manage all complaints
│   │   │       └── assets/
│   │   │           └── page.tsx     # Manage society assets
│   │   │
│   │   ├── watchman/                # Watchman-only routes
│   │   │   ├── layout.tsx           # Simple watchman layout
│   │   │   ├── page.tsx             # Watchman dashboard
│   │   │   ├── emergency/
│   │   │   │   └── page.tsx         # View/trigger emergencies
│   │   │   └── gate-log/
│   │   │       └── page.tsx         # Gate log management
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles + Tailwind
│   │   └── not-found.tsx            # 404 page
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── skeleton.tsx
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Navbar.tsx           # Top navigation bar
│   │   │   ├── Sidebar.tsx          # Dashboard sidebar
│   │   │   ├── Footer.tsx           # Footer (if needed)
│   │   │   └── MobileNav.tsx        # Mobile navigation
│   │   │
│   │   ├── auth/                    # Auth-related components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── OTPInput.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── StatsCard.tsx        # Statistics display card
│   │   │   ├── EmergencyBanner.tsx  # Active emergency alert
│   │   │   └── QuickActions.tsx     # Quick action buttons
│   │   │
│   │   ├── maintenance/             # Maintenance components
│   │   │   ├── PaymentCard.tsx      # Current payment status
│   │   │   ├── PaymentHistory.tsx   # Payment history table
│   │   │   └── RazorpayButton.tsx   # Razorpay checkout trigger
│   │   │
│   │   ├── emergency/               # Emergency components
│   │   │   ├── EmergencyButton.tsx  # Big red emergency button
│   │   │   └── EmergencyLog.tsx     # Emergency history
│   │   │
│   │   ├── complaints/              # Complaint components
│   │   │   ├── ComplaintForm.tsx    # New complaint form
│   │   │   ├── ComplaintCard.tsx    # Single complaint display
│   │   │   ├── ComplaintList.tsx    # List of complaints
│   │   │   └── ImageUpload.tsx      # ImageKit upload component
│   │   │
│   │   ├── admin/                   # Admin components
│   │   │   ├── UserTable.tsx        # User management table
│   │   │   ├── PaymentTable.tsx     # All payments table
│   │   │   ├── AssetCard.tsx        # Asset status card
│   │   │   └── ServiceLogForm.tsx   # Add service log
│   │   │
│   │   ├── watchman/                # Watchman components
│   │   │   ├── GateLogForm.tsx      # Visitor entry form
│   │   │   └── GateLogTable.tsx     # Today's visitors
│   │   │
│   │   └── shared/                  # Shared components
│   │       ├── StatusBadge.tsx      # Status indicator badge
│   │       ├── LoadingSpinner.tsx   # Loading state
│   │       ├── EmptyState.tsx       # Empty data state
│   │       └── ErrorBoundary.tsx    # Error handling
│   │
│   ├── lib/                         # Utility functions
│   │   ├── api.ts                   # Axios instance with interceptors
│   │   ├── auth.ts                  # Auth helper functions
│   │   ├── imagekit.ts              # ImageKit configuration
│   │   ├── razorpay.ts              # Razorpay client setup
│   │   ├── utils.ts                 # General utilities (cn, formatDate)
│   │   └── constants.ts             # App constants
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Authentication state hook
│   │   ├── useEmergency.ts          # Emergency polling hook
│   │   ├── useMaintenance.ts        # Maintenance data hook
│   │   └── useToast.ts              # Toast notifications hook
│   │
│   ├── types/                       # TypeScript definitions
│   │   ├── index.ts                 # Main type exports
│   │   ├── user.ts                  # User types
│   │   ├── maintenance.ts           # Maintenance types
│   │   ├── complaint.ts             # Complaint types
│   │   ├── emergency.ts             # Emergency types
│   │   └── api.ts                   # API response types
│   │
│   ├── context/                     # React Context providers
│   │   └── AuthContext.tsx          # Auth context provider
│   │
│   ├── middleware.ts                # Next.js middleware (route protection)
│   ├── next.config.js               # Next.js configuration
│   ├── tailwind.config.js           # Tailwind configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── components.json              # shadcn/ui configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── package.json
│   └── .env.local                   # Environment variables
│
├── server/                          # Express.js Backend
│   │
│   ├── config/                      # Configuration files
│   │   ├── db.js                    # MongoDB connection setup
│   │   ├── brevo.js                 # Brevo email client setup
│   │   ├── razorpay.js              # Razorpay client setup
│   │   └── imagekit.js              # ImageKit server config
│   │
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # User model
│   │   ├── Maintenance.js           # Maintenance record model
│   │   ├── PaymentLog.js            # Payment history model
│   │   ├── LiftEmergency.js         # Emergency alert model
│   │   ├── Complaint.js             # Complaint model
│   │   ├── GateLog.js               # Visitor gate log model
│   │   └── Asset.js                 # Society asset model
│   │
│   ├── routes/                      # API route definitions
│   │   ├── index.js                 # Route aggregator
│   │   ├── auth.routes.js           # /api/auth/*
│   │   ├── user.routes.js           # /api/users/*
│   │   ├── maintenance.routes.js    # /api/maintenance/*
│   │   ├── payment.routes.js        # /api/payment/* (Razorpay webhooks)
│   │   ├── emergency.routes.js      # /api/emergency/*
│   │   ├── complaint.routes.js      # /api/complaints/*
│   │   ├── gatelog.routes.js        # /api/gatelog/*
│   │   └── asset.routes.js          # /api/assets/*
│   │
│   ├── controllers/                 # Request handlers
│   │   ├── auth.controller.js       # Auth logic
│   │   ├── user.controller.js       # User management logic
│   │   ├── maintenance.controller.js # Maintenance logic
│   │   ├── payment.controller.js    # Payment processing logic
│   │   ├── emergency.controller.js  # Emergency alert logic
│   │   ├── complaint.controller.js  # Complaint handling logic
│   │   ├── gatelog.controller.js    # Gate log logic
│   │   └── asset.controller.js      # Asset management logic
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── role.middleware.js       # Role-based access control
│   │   ├── error.middleware.js      # Global error handler
│   │   └── validate.middleware.js   # Request validation
│   │
│   ├── services/                    # Business logic services
│   │   ├── email.service.js         # Brevo email sending
│   │   ├── payment.service.js       # Razorpay operations
│   │   ├── upload.service.js        # ImageKit operations
│   │   └── otp.service.js           # OTP generation & verification
│   │
│   ├── jobs/                        # Scheduled cron jobs
│   │   ├── index.js                 # Job initializer
│   │   ├── maintenanceGenerator.js  # Generate monthly maintenance (1st)
│   │   ├── lateFeeApplier.js        # Apply late fees (daily)
│   │   └── reminderSender.js        # Send payment reminders
│   │
│   ├── utils/                       # Utility functions
│   │   ├── generateOTP.js           # 6-digit OTP generator
│   │   ├── generateToken.js         # JWT token generator
│   │   ├── validators.js            # Input validation schemas
│   │   └── constants.js             # Server constants
│   │
│   ├── templates/                   # Email templates (HTML)
│   │   ├── invoice.html             # Maintenance invoice
│   │   ├── reminder.html            # Payment reminder
│   │   ├── finalWarning.html        # Late fee warning
│   │   ├── paymentConfirm.html      # Payment confirmation
│   │   ├── emergency.html           # Emergency alert
│   │   ├── emergencyResolved.html   # Emergency resolved
│   │   ├── otp.html                 # Password reset OTP
│   │   └── complaintUpdate.html     # Complaint status update
│   │
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   ├── .env                         # Environment variables
│   └── .env.example                 # Environment template
│
├── .gitignore                       # Git ignore rules
├── .env.example                     # Root env template
├── README.md                        # Project documentation
├── PROJECT_PLAN.md                  # Implementation plan
└── ARCHITECTURE.md                  # This architecture document
```

---

## Data Models

### User Model

```javascript
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  flat_no: {
    type: String,
    required: function() { return this.role !== 'watchman'; },
    trim: true,
    match: /^[1-9][0-9]{2}$/  // 101, 201, 301, etc.
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/  // Indian mobile number
  },
  role: {
    type: String,
    enum: ['manager', 'admin', 'resident', 'watchman'],
    default: 'resident'
  },
  password_hash: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  otp: {
    type: String,
    default: null
  },
  otp_expires: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ flat_no: 1 });
UserSchema.index({ role: 1 });
```

### Maintenance Model

```javascript
const MaintenanceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flat_no: {
    type: String,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 1000  // Fixed ₹1000
  },
  due_date: {
    type: Date,
    required: true
  },
  paid_date: {
    type: Date,
    default: null
  },
  late_fee: {
    type: Number,
    default: 0  // ₹100 if overdue
  },
  total_amount: {
    type: Number,
    default: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  razorpay_order_id: {
    type: String,
    default: null
  },
  razorpay_payment_id: {
    type: String,
    default: null
  },
  razorpay_signature: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for unique month/year per flat
MaintenanceSchema.index({ flat_no: 1, month: 1, year: 1 }, { unique: true });
MaintenanceSchema.index({ status: 1 });
MaintenanceSchema.index({ due_date: 1 });
```

### PaymentLog Model

```javascript
const PaymentLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maintenance_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance',
    required: true
  },
  flat_no: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  transaction_id: {
    type: String,
    required: true
  },
  payment_method: {
    type: String,
    default: 'razorpay'
  },
  month: Number,
  year: Number
}, {
  timestamps: true
});

PaymentLogSchema.index({ user_id: 1 });
PaymentLogSchema.index({ flat_no: 1 });
PaymentLogSchema.index({ payment_date: -1 });
```

### LiftEmergency Model

```javascript
const LiftEmergencySchema = new mongoose.Schema({
  triggered_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  triggered_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolved_at: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

LiftEmergencySchema.index({ status: 1 });
LiftEmergencySchema.index({ triggered_at: -1 });
```

### Complaint Model

```javascript
const ComplaintSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flat_no: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  image_url: {
    type: String,
    default: null  // ImageKit URL
  },
  image_file_id: {
    type: String,
    default: null  // ImageKit file ID for deletion
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  admin_notes: {
    type: String,
    default: null
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ComplaintSchema.index({ user_id: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ created_at: -1 });
```

### GateLog Model

```javascript
const GateLogSchema = new mongoose.Schema({
  visitor_name: {
    type: String,
    required: true,
    trim: true
  },
  flat_no_visiting: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  in_time: {
    type: Date,
    default: Date.now
  },
  out_time: {
    type: Date,
    default: null
  },
  logged_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // Watchman ID
  }
}, {
  timestamps: true
});

// Index for today's logs query
GateLogSchema.index({ in_time: -1 });
GateLogSchema.index({ logged_by: 1 });
```

### Asset Model

```javascript
const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lift', 'water_pump', 'generator', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['working', 'under_maintenance', 'not_working'],
    default: 'working'
  },
  location: {
    type: String,
    default: null
  },
  services: [{
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    done_by: {
      type: String,
      required: true
    },
    cost: {
      type: Number,
      default: 0
    },
    logged_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  last_service_date: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

AssetSchema.index({ type: 1 });
AssetSchema.index({ status: 1 });
```

---

## API Design

### Base URL
- **Development:** `http://localhost:4000/api`
- **Production:** `https://api.rajarshidarshan.com/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/auth/manager-setup` | First-time manager registration | No | - |
| GET | `/auth/manager-exists` | Check if manager exists | No | - |
| POST | `/auth/register` | Register new resident | No | - |
| POST | `/auth/login` | Login user | No | - |
| POST | `/auth/logout` | Logout user | Yes | All |
| GET | `/auth/me` | Get current user | Yes | All |
| POST | `/auth/forgot-password` | Send OTP to email | No | - |
| POST | `/auth/verify-otp` | Verify OTP | No | - |
| POST | `/auth/reset-password` | Reset password | No | - |
| PUT | `/auth/change-password` | Change password | Yes | All |

### User Management Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/users` | Get all users | Yes | Manager, Admin |
| GET | `/users/:id` | Get user by ID | Yes | Manager, Admin |
| PUT | `/users/:id/role` | Update user role | Yes | Manager |
| POST | `/users/watchman` | Create watchman account | Yes | Manager |
| DELETE | `/users/:id` | Deactivate user | Yes | Manager |
| GET | `/users/flats/available` | Get unregistered flats | No | - |

### Maintenance Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/maintenance` | Get current user's maintenance | Yes | All |
| GET | `/maintenance/current` | Get current month's status | Yes | All |
| GET | `/maintenance/history` | Get payment history | Yes | All |
| GET | `/maintenance/all` | Get all flats' maintenance | Yes | Manager, Admin |
| POST | `/maintenance/create-order` | Create Razorpay order | Yes | All |
| POST | `/maintenance/verify-payment` | Razorpay webhook | No | - |
| GET | `/maintenance/stats` | Get payment statistics | Yes | Manager, Admin |

### Emergency Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/emergency/trigger` | Trigger lift emergency | Yes | All |
| GET | `/emergency/active` | Get active emergencies | Yes | All |
| PUT | `/emergency/:id/resolve` | Mark emergency resolved | Yes | Manager, Admin |
| GET | `/emergency/history` | Get emergency history | Yes | Manager, Admin |

### Complaint Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/complaints` | Create new complaint | Yes | Resident |
| GET | `/complaints` | Get user's complaints | Yes | Resident |
| GET | `/complaints/all` | Get all complaints | Yes | Manager, Admin |
| GET | `/complaints/:id` | Get complaint details | Yes | All |
| PUT | `/complaints/:id/status` | Update complaint status | Yes | Manager, Admin |
| POST | `/complaints/upload-url` | Get ImageKit upload URL | Yes | All |

### Gate Log Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/gatelog` | Create gate log entry | Yes | Watchman |
| GET | `/gatelog/today` | Get today's entries | Yes | Watchman, Manager, Admin |
| PUT | `/gatelog/:id/out` | Mark visitor out time | Yes | Watchman |
| GET | `/gatelog/history` | Get gate log history | Yes | Manager, Admin |

### Asset Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/assets` | Get all assets | Yes | All |
| POST | `/assets` | Create new asset | Yes | Manager |
| PUT | `/assets/:id` | Update asset | Yes | Manager |
| PUT | `/assets/:id/status` | Update asset status | Yes | Manager, Admin |
| POST | `/assets/:id/service` | Log service entry | Yes | Manager |
| DELETE | `/assets/:id` | Delete asset | Yes | Manager |

---

## Authentication & Authorization

### JWT Token Structure

```javascript
{
  "user_id": "ObjectId",
  "email": "user@example.com",
  "role": "resident",
  "flat_no": "101",
  "iat": 1234567890,
  "exp": 1234567890  // 7 days
}
```

### Role Permissions Matrix

| Feature | Manager | Admin | Resident | Watchman |
|---------|---------|-------|----------|----------|
| View own maintenance | ✅ | ✅ | ✅ | ❌ |
| Pay maintenance | ✅ | ✅ | ✅ | ❌ |
| View all payments | ✅ | ✅ | ❌ | ❌ |
| Trigger emergency | ✅ | ✅ | ✅ | ✅ |
| Resolve emergency | ✅ | ✅ | ❌ | ❌ |
| File complaint | ✅ | ✅ | ✅ | ❌ |
| Manage complaints | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Assign admin role | ✅ | ❌ | ❌ | ❌ |
| Create watchman | ✅ | ❌ | ❌ | ❌ |
| Manage assets | ✅ | ❌ | ❌ | ❌ |
| Update asset status | ✅ | ✅ | ❌ | ❌ |
| Gate log entry | ❌ | ❌ | ❌ | ✅ |
| View gate log | ✅ | ✅ | ❌ | ✅ |

### Middleware Chain

```
Request → CORS → Body Parser → Auth Middleware → Role Middleware → Controller
```

---

## Cron Jobs Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| `maintenanceGenerator` | `0 0 1 * *` (1st of month, midnight) | Generate maintenance records for all flats |
| `reminderSender` | `0 9 * * *` (Daily 9 AM) | Send payment reminders (Day 1, 10, 16) |
| `lateFeeApplier` | `0 0 * * *` (Daily midnight) | Apply ₹100 late fee to overdue payments |

---

## Email Templates

### 1. Maintenance Invoice (Day 1)
```
Subject: 🏠 Maintenance Due - {Month} {Year} | Asim Wadhwa

Dear {Name} (Flat {Flat_No}),

Your monthly maintenance for {Month} {Year} is now due.

Amount: ₹1,000
Due Date: {Due_Date}

[Pay Now] → {Payment_Link}

Please pay before the due date to avoid late fees.

Regards,
Asim Wadhwa Society
```

### 2. Payment Reminder (Day 10)
```
Subject: ⏰ Reminder: Maintenance Payment Pending | Asim Wadhwa

Dear {Name},

This is a reminder that your maintenance payment is still pending.

Amount Due: ₹1,000
Days Remaining: 8
Due Date: {Due_Date}

[Pay Now] → {Payment_Link}

Regards,
Asim Wadhwa Society
```

### 3. Final Warning (Day 16)
```
Subject: ⚠️ Final Notice: Pay Before Late Fee Applies | Asim Wadhwa

Dear {Name},

URGENT: Your maintenance payment is due in 2 days!

Amount Due: ₹1,000
Due Date: {Due_Date}
Late Fee: ₹100 will be added after due date

[Pay Now] → {Payment_Link}

Regards,
Asim Wadhwa Society
```

### 4. Payment Confirmation
```
Subject: ✅ Payment Received - Thank You! | Asim Wadhwa

Dear {Name},

Thank you! Your maintenance payment has been received.

Amount Paid: ₹{Amount}
Transaction ID: {Transaction_ID}
Payment Date: {Date}
For Month: {Month} {Year}

Regards,
Asim Wadhwa Society
```

### 5. Lift Emergency Alert
```
Subject: 🚨 LIFT EMERGENCY - Asim Wadhwa

⚠️ URGENT: SOMEONE IS STUCK IN THE LIFT!

Triggered By: Flat {Flat_No}
Time: {Timestamp}

Please provide immediate assistance!

---
This is an automated alert from Asim Wadhwa Society Management System.
```

### 6. Emergency Resolved
```
Subject: ✅ Lift Emergency Resolved | Asim Wadhwa

The lift emergency has been resolved.

Resolved By: {Resolver_Name}
Resolution Time: {Timestamp}

Thank you for your assistance.

Regards,
Asim Wadhwa Society
```

### 7. Password Reset OTP
```
Subject: 🔐 Password Reset OTP | Asim Wadhwa

Your OTP for password reset is:

{OTP}

This OTP is valid for 10 minutes.

If you didn't request this, please ignore this email.

Regards,
Asim Wadhwa Society
```

### 8. Complaint Status Update
```
Subject: 📋 Complaint Status Updated | Asim Wadhwa

Dear {Name},

Your complaint status has been updated.

Complaint: {Description}
New Status: {Status}
Updated By: {Admin_Name}

{Admin_Notes}

Regards,
Asim Wadhwa Society
```

---

## Environment Variables

### Client (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxx
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### Server (.env)

```env
# Server
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rajarshi_darshan?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Brevo
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=asimwadhwa19@gmail.com
BREVO_SENDER_NAME=Asim Wadhwa Society

# ImageKit
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# OTP
OTP_EXPIRY_MINUTES=10
```

---

## Security Considerations

### 1. Authentication Security
- Passwords hashed with bcrypt (12 salt rounds)
- JWT stored in httpOnly cookies (prevents XSS)
- CSRF protection via SameSite cookie attribute
- OTP expires after 10 minutes
- Rate limiting on auth endpoints

### 2. API Security
- CORS configured for specific origins only
- Helmet.js for HTTP security headers
- Input validation on all endpoints
- MongoDB injection prevention via Mongoose
- Razorpay webhook signature verification

### 3. Data Security
- Sensitive data not logged
- Environment variables for secrets
- MongoDB Atlas with IP whitelist
- HTTPS enforced in production

### 4. Payment Security
- Razorpay handles card data (PCI compliant)
- Payment verification via server-side webhook
- Signature verification for webhook authenticity

---

## Performance Considerations

### 1. Database
- Proper indexing on frequently queried fields
- Pagination for list endpoints
- Lean queries where full document not needed
- Connection pooling via MongoDB driver

### 2. API
- Response compression (gzip)
- Appropriate HTTP caching headers
- Efficient queries with field selection

### 3. Frontend
- Next.js automatic code splitting
- Image optimization via ImageKit
- Lazy loading for non-critical components
- React Query for data caching (optional future)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐         ┌─────────────┐         ┌───────────┐ │
│  │   Vercel    │         │   Render    │         │  MongoDB  │ │
│  │  (Next.js)  │◄───────►│ (Express)   │◄───────►│   Atlas   │ │
│  │   CDN       │  HTTPS  │  Web Svc    │  TLS    │  Cluster  │ │
│  └─────────────┘         └─────────────┘         └───────────┘ │
│        │                        │                               │
│        │                        │                               │
│        ▼                        ▼                               │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │  ImageKit   │         │   Brevo     │                       │
│  │    CDN      │         │   Email     │                       │
│  └─────────────┘         └─────────────┘                       │
│                                 │                               │
│                                 ▼                               │
│                          ┌─────────────┐                       │
│                          │  Razorpay   │                       │
│                          │  Payments   │                       │
│                          └─────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Vercel Configuration
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Root Directory: `client`

### Render Configuration
- Environment: Node
- Build Command: `npm install`
- Start Command: `node server.js`
- Root Directory: `server`
- Instance Type: Free (upgrade for production)

---

## Key Architectural Decisions

| Decision | Choice | Rationale | Trade-offs |
|----------|--------|-----------|------------|
| **Monorepo** | Single repo for client + server | Easier development, shared types, atomic commits | Larger repo size, coupled deployments |
| **Next.js App Router** | Over Pages Router | Better layouts, server components, modern approach | Learning curve, newer patterns |
| **MongoDB** | Over PostgreSQL | Flexible schema for varied data, easy scaling | No strict relations, eventual consistency |
| **JWT in Cookies** | Over localStorage | Prevents XSS attacks, httpOnly security | Requires CORS setup, cookie management |
| **Brevo** | Over SendGrid | Free tier sufficient, good API, GDPR compliant | Smaller ecosystem |
| **ImageKit** | Over Cloudinary | Better free tier, simple SDK, transformations | Less advanced features |
| **node-cron** | Over external scheduler | Simple, runs with server, no extra service | Tied to server uptime |
| **Render** | Over Railway/Heroku | Good free tier, simple deployment, auto-scaling | Cold starts on free tier |
| **Polling for Emergencies** | Over WebSockets | Simpler implementation, sufficient for use case | Slight delay, more requests |

---

## Future Extensibility

### Phase 2 (Future Enhancements)
1. **Push Notifications** - Real-time browser notifications for emergencies
2. **SMS Alerts** - SMS notifications via Twilio/MSG91
3. **Meeting Scheduler** - Schedule and manage society meetings
4. **Notice Board** - Digital notice board for announcements
5. **Parking Management** - Track parking slot allocations
6. **Expense Tracking** - Track society expenses and generate reports

### Phase 3 (Advanced Features)
1. **Mobile App** - React Native app for residents
2. **Analytics Dashboard** - Payment trends, complaint analysis
3. **Multi-Society Support** - SaaS model for multiple societies
4. **Automated Reports** - Monthly PDF reports via email
5. **Integration APIs** - Third-party integrations

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd Society_Management

# Setup client
cd client
npm install
cp .env.example .env.local
# Fill in environment variables
npm run dev

# Setup server (new terminal)
cd server
npm install
cp .env.example .env
# Fill in environment variables
npm run dev
```

### Branch Strategy

- `main` - Production deployments
- `develop` - Development integration
- `feature/*` - New features
- `fix/*` - Bug fixes

### Deployment Flow

1. Push to `develop` for staging
2. Create PR to `main` for production
3. Vercel/Render auto-deploy on merge

---

## Implementation Priority

| Priority | Feature | Estimated Time |
|----------|---------|----------------|
| 1 | Project setup & folder structure | 2 hours |
| 2 | MongoDB schemas & database connection | 2 hours |
| 3 | Authentication (register, login, JWT) | 4 hours |
| 4 | Manager setup page | 2 hours |
| 5 | Basic dashboard UI | 4 hours |
| 6 | Maintenance payment with Razorpay | 6 hours |
| 7 | Payment reminders (cron jobs) | 3 hours |
| 8 | Lift emergency system | 4 hours |
| 9 | Complaints module | 4 hours |
| 10 | Watchman portal | 3 hours |
| 11 | Asset tracking | 3 hours |
| 12 | Password reset with OTP | 2 hours |
| 13 | Testing & bug fixes | 4 hours |
| 14 | Deployment | 2 hours |

**Total Estimated Time: ~45 hours**

---

## Ready for Implementation! 🚀

This architecture document provides a comprehensive blueprint for building the Asim Wadhwa Society Management System. All major decisions have been documented with rationale, and the system is designed for future extensibility.
