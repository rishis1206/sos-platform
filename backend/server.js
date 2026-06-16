require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Models
require('./models/User');
require('./models/SOSRequest');
require('./models/Message');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const sosRoutes = require('./routes/sos');
const userRoutes = require('./routes/users');
const volunteerRoutes = require('./routes/volunteers');
const messageRoutes = require('./routes/messages');

// Socket
const { initializeSocket } = require('./socket/socketHandler');

// App setup
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.set('io', io);

// Initialize Socket.io
initializeSocket(io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SOS Platform backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/messages', messageRoutes);

// Error handler — always last
app.use(errorHandler);

// Connect MongoDB + Start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ FULL ERROR:');
    console.error(err);
    process.exit(1);
  });