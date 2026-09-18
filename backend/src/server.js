const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');

const { verifySmtpConnection } = require('./config/mailer');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [
  'https://notesofani-z8fp.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]
  .filter(Boolean)
  .map((url) => url.trim().replace(/\/+$/, ''));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy error: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to NotesofAni API',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/contact', contactRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'The requested route was not found.',
  });
});

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

const handleShutdown = () => gracefulShutdown(0);

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('SIGUSR2', handleShutdown);
process.on('message', (msg) => {
  if (msg === 'shutdown') {
    handleShutdown();
  }
});

if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;

