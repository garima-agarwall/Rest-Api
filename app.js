import express from 'express';  
import usersRoutes from './routes/users.js';
import eventsRoutes from './routes/events.js';
import './db.js'; // Ensure DB is initialized on app start
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON request bodies
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// Also accept URL-encoded form bodies (useful when Postman sends form-data or x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Mount user-related routes under /users
app.use('/users', usersRoutes);
app.use('/events', eventsRoutes);

// Debug: show registered routes for quick troubleshooting
try {
  // express.Router stores layers in .stack in Express 4/5; this is only for debugging
  const listStack = (r) => (r && r.stack ? r.stack.map(s => s.route ? (s.route.path || s.route) : s.name) : []);
  console.log('usersRoutes stack:', listStack(usersRoutes));
  console.log('eventsRoutes stack:', listStack(eventsRoutes));
} catch (e) {
  console.log('Failed to inspect router stacks:', e && e.message);
}

// Basic health route (optional, useful for quick checks)
app.get('/', (_req, res) => {
  res.send('REST API Demo is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});