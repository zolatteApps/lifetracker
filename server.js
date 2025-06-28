require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import API routes
const loginRoute = require('./api/auth/login');
const registerRoute = require('./api/auth/register');
const userRoute = require('./api/auth/user');
const sendOtpRoute = require('./api/auth/send-otp');
const verifyOtpRoute = require('./api/auth/verify-otp');
const updateProfileRoute = require('./api/auth/update-profile');

// Admin routes
const adminStatsRoute = require('./api/admin/stats');
const adminUsersRoute = require('./api/admin/users');
const adminUserDetailRoute = require('./api/admin/users/[userId]');
const adminFeedbackRoute = require('./api/admin/feedback/index');
const adminFeedbackDetailRoute = require('./api/admin/feedback/[id]');

// Goals routes
const goalsRoute = require('./api/goals/index');
const goalDetailRoute = require('./api/goals/[id]');
const goalProgressRoute = require('./api/goals/[id]/progress');
const goalAnalyticsRoute = require('./api/goals/[id]/analytics');
const goalAnalyticsSummaryRoute = require('./api/goals/analytics/summary');

// Feedback routes
const feedbackRoute = require('./api/feedback/index');

// Schedule routes
const scheduleGenerateRoute = require('./api/schedule/generate');
const scheduleRoute = require('./api/schedule/index');

// Convert Vercel serverless functions to Express routes
const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Auth routes
app.post('/api/auth/login', wrapHandler(loginRoute));
app.post('/api/auth/register', wrapHandler(registerRoute));
app.get('/api/auth/user', wrapHandler(userRoute));
app.post('/api/auth/send-otp', wrapHandler(sendOtpRoute));
app.post('/api/auth/verify-otp', wrapHandler(verifyOtpRoute));
app.post('/api/auth/update-profile', wrapHandler(updateProfileRoute));

// Admin routes
app.get('/api/admin/stats', wrapHandler(adminStatsRoute));
app.get('/api/admin/users', wrapHandler(adminUsersRoute));
app.get('/api/admin/users/:userId', (req, res) => {
  // Create a new query object with userId
  const newQuery = {};
  for (let key in req.query) {
    newQuery[key] = req.query[key];
  }
  newQuery.userId = req.params.userId;
  req.query = newQuery;
  console.log('Server.js - Setting userId:', req.params.userId);
  console.log('Server.js - New query object:', req.query);
  wrapHandler(adminUserDetailRoute)(req, res);
});
app.put('/api/admin/users/:userId', (req, res) => {
  req.query = Object.assign({}, req.query, { userId: req.params.userId });
  wrapHandler(adminUserDetailRoute)(req, res);
});
app.delete('/api/admin/users/:userId', (req, res) => {
  req.query = Object.assign({}, req.query, { userId: req.params.userId });
  wrapHandler(adminUserDetailRoute)(req, res);
});
app.get('/api/admin/feedback', wrapHandler(adminFeedbackRoute));
app.put('/api/admin/feedback/:id', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(adminFeedbackDetailRoute)(req, res);
});
app.delete('/api/admin/feedback/:id', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(adminFeedbackDetailRoute)(req, res);
});

// Goals routes
app.get('/api/goals', wrapHandler(goalsRoute));
app.post('/api/goals', wrapHandler(goalsRoute));
app.get('/api/goals/:id', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(goalDetailRoute)(req, res);
});
app.put('/api/goals/:id', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(goalDetailRoute)(req, res);
});
app.delete('/api/goals/:id', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(goalDetailRoute)(req, res);
});
// Analytics summary route MUST come before :id routes to avoid route conflicts
app.get('/api/goals/analytics/summary', wrapHandler(goalAnalyticsSummaryRoute));

app.put('/api/goals/:id/progress', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(goalProgressRoute)(req, res);
});
// Workaround endpoint for Vercel
app.put('/api/goals-progress', wrapHandler(require('./api/goals-progress')));
app.get('/api/goals/:id/analytics', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(goalAnalyticsRoute)(req, res);
});

// Feedback routes
app.get('/api/feedback', wrapHandler(feedbackRoute));
app.post('/api/feedback', wrapHandler(feedbackRoute));

// Schedule routes
app.post('/api/schedule/generate', wrapHandler(scheduleGenerateRoute));
app.get('/api/schedule', wrapHandler(scheduleRoute));
app.post('/api/schedule', wrapHandler(scheduleRoute));
app.put('/api/schedule/:id', (req, res) => {
  req.query.id = req.params.id;
  wrapHandler(scheduleRoute)(req, res);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});