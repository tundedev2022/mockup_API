const express = require('express');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { latency } = require('./config');

const app = express();

app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use((req, res, next) => {
  setTimeout(next, latency);
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json({
  type: '*/*',
  verify: (req, res, buffer) => {
    req.rawBody = buffer.toString();
  },
}));

app.use('/v1', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found. Use /v1/...' });
});

app.use(errorHandler);

module.exports = app;
