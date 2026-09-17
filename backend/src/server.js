const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');

const { verifySmtpConnection } = require('./config/mailer');

const app = express();

// Enable Trust Proxy for production HTTPS reverse proxies (Render, Vercel, Railway, Heroku, AWS ALB)
app.set('trust proxy', 1);

// Security Headers Middleware via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration with Environment-based Origin Validation
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS policy error: Origin not allowed.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve local static uploads directory for development storage with password protection access control
const uploadsPath = path.join(__dirname, '../uploads');

app.use('/uploads', async (req, res, next) => {
  try {
    const fileUrl = `/uploads${req.path}`;
    const Resource = require('./models/Resource');
    const { hasResourceAccess } = require('./controllers/resourceController');

    const resource = await Resource.findOne({ fileUrl, passwordProtected: true });
    if (resource) {
      if (!hasResourceAccess(req, resource._id.toString())) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Password verification required to access this file.',
        });
      }
    }
  } catch (err) {
    console.error('[Upload Security Middleware Error]:', err?.message || err);
  }
  next();
});

app.use('/uploads', express.static(uploadsPath));

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to NotesofAni API',
  });
});

// Safe Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount REST API Routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/contact', contactRoutes);

// Professional 404 Route Handler for Unknown Routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'The requested route was not found.',
  });
});

// Centralized Express Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  console.error('[Global Error Handler]:', err.message || err);
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
});

const PORT = process.env.PORT || 5000;
let server = null;

/**
 * Start Server only AFTER MongoDB successfully connects.
 */
async function startServer(maxRetries = 15, retryDelayMs = 300) {
  try {
    await connectDB();
    await verifySmtpConnection();

    const attemptListen = (retriesLeft) => {
      const currentServer = app.listen(PORT);

      currentServer.once('listening', () => {
        server = currentServer;
        console.log(`Server started on http://localhost:${PORT}`);
      });

      currentServer.once('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          if (retriesLeft > 0) {
            try {
              currentServer.close(() => {});
            } catch (e) {}
            setTimeout(() => {
              attemptListen(retriesLeft - 1);
            }, retryDelayMs);
          } else {
            console.error(
              `Port ${PORT} is already in use. Stop the existing NotesofAni backend process before starting another instance.`
            );
            process.exit(1);
          }
        } else {
          console.error(`Server error: ${error.message}`);
          process.exit(1);
        }
      });
    };

    attemptListen(maxRetries);
  } catch (error) {
    console.error('Failed to start server due to MongoDB connection failure.');
    process.exit(1);
  }
}

/**
 * Gracefully close HTTP server & MongoDB connection.
 */
function gracefulShutdown(exitCode = 0) {
  if (server) {
    try {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
    } catch (err) {}
    try {
      server.close();
    } catch (err) {}
  }

  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      mongoose.connection.close(false);
    }
  } catch (err) {}

  process.exit(exitCode);
}

// Signal Handlers for Graceful Shutdown
const handleShutdown = () => gracefulShutdown(0);

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('SIGUSR2', handleShutdown);
process.on('message', (msg) => {
  if (msg === 'shutdown') {
    handleShutdown();
  }
});

// Only start server if executed directly as main script
if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
