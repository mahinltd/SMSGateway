// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const apiRoutes = require('./routes');
const { registerSocketHandlers } = require('./sockets');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'https://sms.mahinai.app';
const allowedOrigins = [
  frontendUrl,
  'http://localhost:5173',
  'https://sms-gateway-seven.vercel.app',
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean));
}

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || uniqueAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (_origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  allowRequest: (_req, callback) => callback(null, true),
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.set('io', io);
app.set('trust proxy', 1);

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'sms-gateway-backend' });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
