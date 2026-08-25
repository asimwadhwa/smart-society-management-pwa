<p align="center">
  <img src="https://ik.imagekit.io/xh3awoalr/Portfolio/Manager_Thumbnail.png" alt="Society Management System" width="600" />
</p>

<h1 align="center">🏢 Rajarshi Darshan Society Management System</h1>

<p align="center">
  <strong>A comprehensive full-stack society management web application</strong>
</p>

<p align="center">
  <a href="https://society-management-system-vert.vercel.app/showcase">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
  <a href="https://society-management-system-zjlf.onrender.com">
    <img src="https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render" alt="API Server" />
  </a>
  <a href="https://github.com/AAYUSH412/Society-Management-System">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

---

## 📖 Overview

A complete society management solution for **Rajarshi Darshan** housing society (~40 flats). Built with modern technologies, this system streamlines daily operations including:

- 💳 **Maintenance Collection** - ₹1000/month with Razorpay UPI/Card payments
- 🚨 **Lift Emergency Alerts** - One-click emergency notification to all residents
- 📝 **Complaints Management** - File and track complaints with image uploads
- 🔧 **Asset Tracking** - Monitor lifts, water pumps, generators with service history
- 🚪 **Watchman Portal** - Gate log and visitor management system

## 🖥️ Live Demo

| Platform | URL |
|----------|-----|
| 🌐 **Frontend** | [society-management-system-vert.vercel.app](https://society-management-system-vert.vercel.app/showcase) |
| 🔗 **Backend API** | [society-management-system-zjlf.onrender.com](https://society-management-system-zjlf.onrender.com) |

## 🎬 Video Demos

<table>
  <tr>
    <td align="center" width="33%">
      <a href="https://ik.imagekit.io/xh3awoalr/Portfolio/Manager_Screen_Recording.mp4">
        <img src="https://ik.imagekit.io/xh3awoalr/Portfolio/Manager_Thumbnail.png" alt="Manager Demo" width="200" /><br/>
        <strong>Manager Dashboard</strong>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://ik.imagekit.io/xh3awoalr/Portfolio/Resident_Screen_Recording.mp4">
        <img src="https://ik.imagekit.io/xh3awoalr/Portfolio/Resident_Thumbnail.png" alt="Resident Demo" width="200" /><br/>
        <strong>Resident Portal</strong>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://ik.imagekit.io/xh3awoalr/Portfolio/Watchman_Screen_Recording.mp4">
        <img src="https://ik.imagekit.io/xh3awoalr/Portfolio/Watchman_Thumbanail.png" alt="Watchman Demo" width="200" /><br/>
        <strong>Watchman Portal</strong>
      </a>
    </td>
  </tr>
</table>

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible UI components |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| **Express.js 4.x** | REST API server |
| **Node.js 20.x** | JavaScript runtime |
| **MongoDB Atlas** | NoSQL database |
| **Mongoose 8.x** | ODM for MongoDB |
| **node-cron** | Scheduled jobs |

### Services
| Service | Purpose |
|---------|---------|
| **Razorpay** | Payment gateway (UPI/Cards) |
| **Brevo** | Transactional emails |
| **ImageKit** | Image CDN & uploads |
| **JWT** | Authentication |
| **bcrypt** | Password hashing |

### Deployment
| Platform | Service |
|----------|---------|
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting (Docker) |
| **MongoDB Atlas** | Database hosting |

## 📁 Project Structure

```
Society_Management/
├── client/                    # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   ├── context/          # Auth context
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── server/                    # Express.js Backend
│   ├── config/               # DB, services config
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth, error middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── services/             # Email, upload services
│   ├── jobs/                 # Cron jobs
│   └── package.json
│
├── .github/                   # GitHub Actions
│   └── workflows/
│       ├── ci.yml            # CI pipeline
│       └── deploy.yml        # Deployment workflow
│
├── docker-compose.yml         # Docker setup
├── ARCHITECTURE.md            # System design
├── CONTRIBUTING.md            # Contribution guide
├── SECURITY.md                # Security policy
└── LICENSE                    # MIT License
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x LTS or higher
- **npm** 10.x or higher
- **MongoDB Atlas** account
- **Razorpay** account
- **Brevo** account
- **ImageKit** account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AAYUSH412/Society-Management-System.git
   cd Society-Management-System
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client && npm install

   # Install server dependencies
   cd ../server && npm install
   ```

3. **Configure environment variables**

   **Server** (`server/.env.local`):
   ```env
   NODE_ENV=development
   PORT=4000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   BREVO_API_KEY=xkeysib-xxxx
   BREVO_SENDER_EMAIL=noreply@domain.com
   BREVO_SENDER_NAME=Rajarshi Darshan Society
   IMAGEKIT_PUBLIC_KEY=public_xxxx
   IMAGEKIT_PRIVATE_KEY=private_xxxx
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxxx
   CLIENT_URL=http://localhost:3000
   OTP_EXPIRY_MINUTES=10
   ```

   **Client** (`client/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxx
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxxx
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend (Port 4000)
   cd server && npm run dev

   # Terminal 2 - Frontend (Port 3000)
   cd client && npm run dev
   ```

5. **Open in browser**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:4000](http://localhost:4000)

## 👥 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Manager** | Full access, user management, assign admin roles, view all data |
| **Admin** | Manage complaints, emergencies, view payments, asset tracking |
| **Resident** | Pay maintenance, file complaints, trigger emergency, view own data |
| **Watchman** | Gate log management, emergency alerts, mobile-first interface |

## ✨ Features

### 💳 Maintenance Payments
- Automated monthly maintenance generation (₹1000/month)
- ₹100 late fee after 18 days
- Razorpay integration (UPI, Cards, Net Banking)
- Payment reminders via email (Day 1, 10, 16)
- Payment history and receipts

### 🚨 Emergency System
- One-click lift emergency button
- Instant email notification to ALL users
- Real-time emergency status dashboard
- Resolution tracking with timestamps

### 📝 Complaints Management
- File complaints with image upload
- Status tracking (Open → In Progress → Resolved)
- Email notifications on status change
- Admin/Manager resolution panel

### 🔧 Asset Tracking
- Track lifts, water pumps, generators
- Service history logging
- Status monitoring (Working/Under Maintenance/Not Working)
- Technician and service notes

### 🚪 Watchman Portal
- Mobile-first design
- Visitor entry/exit logging
- Vehicle number tracking
- Purpose of visit recording
- Emergency alert access

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send OTP |
| POST | `/api/auth/reset-password` | Reset password |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance` | Get maintenance records |
| GET | `/api/maintenance/:id` | Get single record |
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment |

### Emergency
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency/trigger` | Trigger emergency |
| GET | `/api/emergency/active` | Get active emergencies |
| PUT | `/api/emergency/:id/resolve` | Resolve emergency |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | Create complaint |
| GET | `/api/complaints` | Get complaints |
| PUT | `/api/complaints/:id` | Update status |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## 📧 Email Notifications

| Event | Recipients | Timing |
|-------|------------|--------|
| Maintenance Invoice | Resident | 1st of month |
| Payment Reminder | Resident | Day 10, 16 |
| Late Fee Warning | Resident | Day 16 |
| Payment Confirmation | Resident | On payment |
| Emergency Alert | All users | Immediately |
| Emergency Resolved | All users | On resolution |
| Complaint Status | Resident | On change |
| Password Reset OTP | User | On request |

## 🐳 Docker Development

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## 🚀 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set Root Directory: `client`
4. Add environment variables
5. Deploy

### Backend (Render)

1. Push code to GitHub
2. Create Web Service in [Render](https://render.com)
3. Set Root Directory: `server`
4. Runtime: Docker
5. Add environment variables
6. Deploy

See detailed deployment guide in the docs.

## 🔐 Security

- JWT authentication with httpOnly cookies
- bcrypt password hashing (10 rounds)
- CORS protection with whitelisted origins
- Helmet security headers
- Input validation with express-validator
- Rate limiting on auth routes
- Environment variable secrets

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

**Aayush Vaghela**

- Portfolio: [aayush-vaghela.vercel.app](https://aayush-vaghela.vercel.app)
- GitHub: [@AAYUSH412](https://github.com/AAYUSH412)
- LinkedIn: [Aayush Vaghela](https://linkedin.com/in/aayush-vaghela)

---

<p align="center">
  Made with ❤️ by Aayush Vaghela
</p>
