# 🔧 Society Management - Backend API

The Express.js REST API backend for Rajarshi Darshan Society Management System.

<p align="center">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-8.x-880000?style=flat-square" alt="Mongoose" />
</p>

## 🚀 Live API

**Production URL:** [society-management-system-zjlf.onrender.com](https://society-management-system-zjlf.onrender.com)

**Health Check:** [/api/health](https://society-management-system-zjlf.onrender.com/api/health)

## 📁 Project Structure

```
server/
├── config/                     # Configuration
│   ├── db.js                   # MongoDB connection
│   ├── brevo.js                # Email service
│   ├── razorpay.js             # Payment gateway
│   └── imagekit.js             # Image CDN
│
├── controllers/                # Route Handlers
│   ├── auth.controller.js      # Authentication
│   ├── user.controller.js      # User management
│   ├── maintenance.controller.js
│   ├── payment.controller.js
│   ├── emergency.controller.js
│   ├── complaint.controller.js
│   ├── gatelog.controller.js
│   └── asset.controller.js
│
├── middleware/                 # Express Middleware
│   ├── auth.middleware.js      # JWT verification
│   └── error.middleware.js     # Error handling
│
├── models/                     # Mongoose Schemas
│   ├── User.js
│   ├── Maintenance.js
│   ├── PaymentLog.js
│   ├── LiftEmergency.js
│   ├── Complaint.js
│   ├── GateLog.js
│   └── Asset.js
│
├── routes/                     # API Routes
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── maintenance.routes.js
│   ├── payment.routes.js
│   ├── emergency.routes.js
│   ├── complaint.routes.js
│   ├── gatelog.routes.js
│   └── asset.routes.js
│
├── services/                   # Business Logic
│   ├── email.service.js        # Brevo emails
│   └── upload.service.js       # ImageKit uploads
│
├── jobs/                       # Cron Jobs
│   ├── index.js                # Job scheduler
│   ├── maintenanceGenerator.js # Monthly maintenance
│   ├── lateFeeApplier.js       # Apply late fees
│   └── reminderSender.js       # Email reminders
│
├── templates/                  # Email/HTML templates
│   └── landing.html            # API landing page
│
├── utils/                      # Utilities
│   ├── constants.js
│   ├── generateOTP.js
│   ├── generateToken.js
│   └── validators.js
│
├── scripts/                    # Database scripts
│   └── seedData.js             # Seed test data
│
├── Dockerfile                  # Docker config
├── server.js                   # Entry point
└── package.json
```

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.x | REST API framework |
| Node.js | 20.x | JavaScript runtime |
| MongoDB | 7.x | NoSQL database |
| Mongoose | 8.x | MongoDB ODM |
| JWT | - | Authentication |
| bcrypt | 5.x | Password hashing |
| node-cron | 3.x | Scheduled jobs |
| Razorpay | - | Payment gateway |
| Brevo | - | Email service |
| ImageKit | - | Image CDN |

## 📦 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Create `.env.local`:
   ```env
   # Server
   NODE_ENV=development
   PORT=4000
   
   # Database
   MONGODB_URI=mongodb+srv://...
   
   # JWT
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=7d
   
   # Razorpay
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   
   # Brevo
   BREVO_API_KEY=xkeysib-xxxx
   BREVO_SENDER_EMAIL=noreply@domain.com
   BREVO_SENDER_NAME=Rajarshi Darshan Society
   
   # ImageKit
   IMAGEKIT_PUBLIC_KEY=public_xxxx
   IMAGEKIT_PRIVATE_KEY=private_xxxx
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxxx
   
   # Client URL (CORS)
   CLIENT_URL=http://localhost:3000
   
   # OTP
   OTP_EXPIRY_MINUTES=10
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **API is available at**
   ```
   http://localhost:4000
   ```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start production server |
| `npm run seed` | Seed database with test data |

## 🔗 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/manager-exists` | Check if manager exists | No |
| POST | `/manager-setup` | Register first manager | No |
| POST | `/register` | Register user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/me` | Get current user | Yes |
| POST | `/forgot-password` | Send OTP | No |
| POST | `/verify-otp` | Verify OTP | No |
| POST | `/reset-password` | Reset password | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all users | Admin |
| GET | `/:id` | Get user by ID | Admin |
| PUT | `/:id/role` | Update user role | Manager |
| POST | `/watchman` | Create watchman | Manager |

### Maintenance (`/api/maintenance`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get maintenance records | Yes |
| GET | `/current` | Get current month | Yes |
| GET | `/history` | Get payment history | Yes |
| GET | `/stats` | Get statistics | Admin |

### Payments (`/api/payment`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/create-order` | Create Razorpay order | Yes |
| POST | `/verify` | Verify payment | Yes |
| POST | `/webhook` | Razorpay webhook | No |
| GET | `/logs` | Get payment logs | Yes |

### Emergency (`/api/emergency`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/trigger` | Trigger emergency | Yes |
| GET | `/active` | Get active emergencies | Yes |
| GET | `/history` | Get emergency history | Admin |
| PUT | `/:id/resolve` | Resolve emergency | Admin |

### Complaints (`/api/complaints`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create complaint | Yes |
| GET | `/` | Get complaints | Yes |
| GET | `/:id` | Get single complaint | Yes |
| PUT | `/:id` | Update status | Admin |

### Gate Log (`/api/gatelog`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create entry | Watchman |
| GET | `/` | Get logs | Yes |
| PUT | `/:id/out` | Mark exit | Watchman |

### Assets (`/api/assets`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create asset | Admin |
| GET | `/` | Get all assets | Yes |
| PUT | `/:id` | Update asset | Admin |
| POST | `/:id/service` | Log service | Admin |

## 🔐 Authentication

### JWT Flow

1. User logs in with email/password
2. Server validates credentials
3. JWT token generated and set as httpOnly cookie
4. Client includes cookie in subsequent requests
5. Middleware validates token on protected routes

### Token Structure

```javascript
{
  id: "user_id",
  role: "resident|admin|manager|watchman",
  iat: timestamp,
  exp: timestamp + 7 days
}
```

## 📧 Email Service (Brevo)

### Email Types

| Template | Trigger | Recipients |
|----------|---------|------------|
| Maintenance Invoice | 1st of month | All residents |
| Payment Reminder | Day 10, 16 | Unpaid residents |
| Payment Confirmation | On payment | Payer |
| Emergency Alert | On trigger | All users |
| Emergency Resolved | On resolve | All users |
| Complaint Update | Status change | Complaint owner |
| Password Reset | Forgot password | User |

## ⏰ Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Generate Maintenance | 1st of month, 00:00 | Create monthly records |
| Apply Late Fee | Daily, 00:00 | Add ₹100 after 18 days |
| Send Reminders | Day 10, 16 at 09:00 | Email payment reminders |

## 🐳 Docker

### Build & Run

```bash
# Build image
docker build -t society-api .

# Run container
docker run -p 4000:4000 --env-file .env.local society-api
```

### Docker Compose (with MongoDB)

```bash
# From root directory
docker-compose up -d
```

## 🚀 Deployment (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure:
   - **Name:** society-management-api
   - **Root Directory:** server
   - **Runtime:** Docker
   - **Branch:** main
5. Add environment variables
6. Deploy

### Post-Deployment Checklist

- [ ] MongoDB Atlas IP whitelist updated
- [ ] Razorpay webhook configured
- [ ] CORS origin set to frontend URL
- [ ] Environment set to production

## 🧪 Testing API

### Using cURL

```bash
# Health check
curl http://localhost:4000/api/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Using Postman

Import the Postman collection from `docs/postman_collection.json` (if available).

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **bcrypt** - Password hashing (10 rounds)
- **JWT** - Stateless authentication
- **httpOnly cookies** - XSS protection
- **Input validation** - express-validator
- **Rate limiting** - On sensitive routes

## 📚 Related Docs

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
- [PROJECT_PLAN.md](../PROJECT_PLAN.md) - Implementation plan
- [SECURITY.md](../SECURITY.md) - Security policy

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the root directory.

## 📄 License

MIT - See [LICENSE](../LICENSE) in the root directory.
