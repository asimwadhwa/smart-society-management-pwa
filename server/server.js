const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const paymentRoutes = require('./routes/payment.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const complaintRoutes = require('./routes/complaint.routes');
const gatelogRoutes = require('./routes/gatelog.routes');
const assetRoutes = require('./routes/asset.routes');

// Import cron jobs
const initCronJobs = require('./jobs');

// Import database connection
const connectDB = require('./config/db');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        'http://localhost:3000',

        // Vercel frontend URLs
        'https://smart-society-management-pwa.vercel.app',
        'https://smart-society-management-iqujwnk9n-asim-wadhwa.vercel.app',
        'https://smart-society-management-i3k11okqu-asim-wadhwa.vercel.app'
      ];

      // Allow exact URLs
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel deployment URLs
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ]
  })
);

// Logging
app.use(morgan('dev'));

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Asim Wadhwa Society Management API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// LANDING PAGE
// ============================================

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'templates', 'landing.html');

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Replace CLIENT_URL placeholder
  const clientUrl =
    process.env.CLIENT_URL || 'http://localhost:3000';

  html = html.replace(/{{CLIENT_URL}}/g, clientUrl);

  res.type('html').send(html);
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/maintenance', maintenanceRoutes);

app.use('/api/payment', paymentRoutes);

app.use('/api/emergency', emergencyRoutes);

app.use('/api/complaints', complaintRoutes);

app.use('/api/gatelog', gatelogRoutes);

app.use('/api/assets', assetRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;

  const message =
    err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  console.log(
    `📍 Environment: ${
      process.env.NODE_ENV || 'development'
    }`
  );

  // Initialize cron jobs
  initCronJobs();
});

// ============================================
// HANDLE UNHANDLED PROMISE REJECTIONS
// ============================================

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);

  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = app;