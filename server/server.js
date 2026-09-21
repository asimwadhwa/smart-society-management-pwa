const dns = require('dns');

dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

require('dotenv').config();


// ============================================================
// IMPORT ROUTES
// ============================================================

const authRoutes =
  require('./routes/auth.routes');

const userRoutes =
  require('./routes/user.routes');

const maintenanceRoutes =
  require('./routes/maintenance.routes');

const paymentRoutes =
  require('./routes/payment.routes');

const emergencyRoutes =
  require('./routes/emergency.routes');

const complaintRoutes =
  require('./routes/complaint.routes');

const gatelogRoutes =
  require('./routes/gatelog.routes');

const assetRoutes =
  require('./routes/asset.routes');

const societyRoutes =
  require('./routes/society.routes');


// ============================================================
// IMPORT CRON JOBS
// ============================================================

const initCronJobs =
  require('./jobs');


// ============================================================
// DATABASE
// ============================================================

const connectDB =
  require('./config/db');


// ============================================================
// EXPRESS APP
// ============================================================

const app = express();


// ============================================================
// CONNECT DATABASE
// ============================================================

connectDB();


// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

app.use(
  helmet()
);


// ============================================================
// CORS
// ============================================================

app.use(
  cors({

    origin: function (
      origin,
      callback
    ) {

      // Allow requests without origin
      // Postman / server-to-server etc.
      if (!origin) {
        return callback(
          null,
          true
        );
      }


      const allowedOrigins = [

        'http://localhost:3000',

        'https://smart-society-management-pwa.vercel.app',

        'https://smart-society-management-iqujwnk9n-asim-wadhwa.vercel.app',

        'https://smart-society-management-i3k11okqu-asim-wadhwa.vercel.app'

      ];


      // Exact URL
      if (
        allowedOrigins.includes(
          origin
        )
      ) {

        return callback(
          null,
          true
        );

      }


      // Allow Vercel deployment URLs
      if (
        origin.endsWith(
          '.vercel.app'
        )
      ) {

        return callback(
          null,
          true
        );

      }


      return callback(
        new Error(
          'Not allowed by CORS'
        )
      );

    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ]

  })
);


// ============================================================
// LOGGING
// ============================================================

app.use(
  morgan('dev')
);


// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: '10mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);


// ============================================================
// COOKIE PARSER
// ============================================================

app.use(
  cookieParser()
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  '/api/health',
  (req, res) => {

    res.status(200).json({

      status: 'ok',

      message:
        'Asim Wadhwa Society Management API is running',

      timestamp:
        new Date().toISOString()

    });

  }
);


// ============================================================
// LANDING PAGE
// ============================================================

app.get(
  '/',
  (req, res) => {

    const htmlPath =
      path.join(
        __dirname,
        'templates',
        'landing.html'
      );


    let html =
      fs.readFileSync(
        htmlPath,
        'utf8'
      );


    const clientUrl =
      process.env.CLIENT_URL ||
      'http://localhost:3000';


    html =
      html.replace(
        /{{CLIENT_URL}}/g,
        clientUrl
      );


    res
      .type('html')
      .send(html);

  }
);


// ============================================================
// API ROUTES
// ============================================================

app.use(
  '/api/auth',
  authRoutes
);


app.use(
  '/api/users',
  userRoutes
);


// ============================================================
// MAINTENANCE
// ============================================================
//
// Manager/Admin:
//   - maintenance settings
//   - generate maintenance
//   - edit unpaid maintenance
//
// Resident/Admin:
//   - view maintenance
//   - create payment order
//
// Manager:
//   - NO personal maintenance
//
// ============================================================

app.use(
  '/api/maintenance',
  maintenanceRoutes
);


// ============================================================
// PAYMENTS
// ============================================================

app.use(
  '/api/payment',
  paymentRoutes
);


app.use(
  '/api/emergency',
  emergencyRoutes
);


app.use(
  '/api/complaints',
  complaintRoutes
);


app.use(
  '/api/gatelog',
  gatelogRoutes
);


app.use(
  '/api/assets',
  assetRoutes
);


app.use(
  '/api/societies',
  societyRoutes
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        'Route not found'

    });

  }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      'Error:',
      err
    );


    const statusCode =
      err.statusCode || 500;


    const message =
      err.message ||
      'Internal Server Error';


    res.status(
      statusCode
    ).json({

      success: false,

      message,

      ...(process.env.NODE_ENV ===
        'development' && {
        stack:
          err.stack
      })

    });

  }
);


// ============================================================
// START SERVER
// ============================================================

const PORT =
  process.env.PORT || 4000;


app.listen(
  PORT,
  () => {

    console.log(
      `🚀 Server running on port ${PORT}`
    );


    console.log(
      `📍 Environment: ${
        process.env.NODE_ENV ||
        'development'
      }`
    );


    // --------------------------------------------------------
    // INITIALIZE CRON JOBS
    // --------------------------------------------------------

    initCronJobs();

  }
);


// ============================================================
// HANDLE UNHANDLED PROMISE REJECTIONS
// ============================================================

process.on(
  'unhandledRejection',
  (err) => {

    console.error(
      'Unhandled Rejection:',
      err
    );


    if (
      process.env.NODE_ENV ===
      'production'
    ) {

      process.exit(1);

    }

  }
);


// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;