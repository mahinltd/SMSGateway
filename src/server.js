// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const apiRoutes = require('./routes');
const { registerSocketHandlers } = require('./sockets');

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'https://sms.mahinai.app';
const allowedOrigins = [frontendUrl, 'http://localhost:5173'];

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
    origin: uniqueAllowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
app.set('trust proxy', 1);

app.use(helmet());

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

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
