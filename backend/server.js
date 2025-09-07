// backend/api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://*.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/v1/auth', require('../routes/auth'));
app.use('/api/v1/users', require('../routes/users'));
app.use('/api/v1/assets', require('../routes/assets'));
app.use('/api/v1/assignments', require('../routes/assignments'));
app.use('/api/v1/maintenance', require('../routes/maintenance'));
app.use('/api/v1/vendors', require('../routes/vendors'));
app.use('/api/v1/audit-logs', require('../routes/auditLogs'));
app.use('/api/v1/reports', require('../routes/reports'));
app.use('/api/v1/dashboard', require('../routes/dashboard'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Export for Vercel serverless
module.exports = app;