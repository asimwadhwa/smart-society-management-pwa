# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-26

### 🎉 Initial Release

#### Added

- **Authentication System**
  - JWT-based authentication with httpOnly cookies
  - Role-based access control (Manager, Admin, Resident, Watchman)
  - Manager setup page for first-time registration
  - Self-registration for residents
  - Password reset with OTP via email

- **Maintenance Payment Module**
  - Automated monthly maintenance generation (₹1000/month)
  - Late fee application (₹100 after 18 days)
  - Razorpay integration (UPI, Cards, Net Banking)
  - Payment history and receipts
  - Email reminders (Day 1, 10, 16)

- **Lift Emergency System**
  - One-click emergency trigger button
  - Instant email notification to all users
  - Real-time emergency status on dashboard
  - Resolution tracking with timestamps

- **Complaints Management**
  - File complaints with image upload (ImageKit)
  - Status tracking (Open → In Progress → Resolved)
  - Email notifications on status change
  - Admin/Manager resolution panel

- **Asset Tracking**
  - Track lifts, water pumps, generators
  - Service history logging
  - Status monitoring (Working/Under Maintenance/Not Working)
  - Technician and service notes

- **Watchman Portal**
  - Mobile-first dedicated interface
  - Visitor entry/exit logging
  - Vehicle number tracking
  - Purpose of visit recording
  - Emergency alert access

- **Dashboard**
  - Role-specific dashboards
  - Payment status widgets
  - Emergency banner
  - Asset status overview
  - Recent complaints widget

#### Technical Features

- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS with shadcn/ui
- Express.js REST API
- MongoDB Atlas database
- Docker support for backend
- GitHub Actions CI/CD
- Vercel + Render deployment

---

## [Unreleased]

### Planned Features

- [ ] Multi-language support (Hindi, Gujarati)
- [ ] Push notifications
- [ ] Dark mode
- [ ] Annual maintenance summary
- [ ] Bulk payment reminder
- [ ] Mobile app (React Native)
