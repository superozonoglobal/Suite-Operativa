const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Error handler (will be filled in later)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    data: null,
    meta: {},
    errors: [{ message: err.message }]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
