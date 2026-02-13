import Database from 'better-sqlite3';

// Initialize SQLite database (file will be created if it doesn't exist)
const db = new Database('app.db');

// Create required tables if they don't exist
// Enable foreign keys and create tables separately to ensure reliable initialization
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    createdAt TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT,
    date TEXT,
    createdAt TEXT NOT NULL,
    userId INTEGER,
    image TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY,
    eventId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (eventId) REFERENCES events(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    UNIQUE(eventId, userId) -- Prevent duplicate registrations
  );
`);

// Debug: show tables present (helpful while developing)
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('DB tables:', tables.map(t => t.name));
} catch (e) {
  console.error('Failed to list DB tables:', e && e.message);
}

export default db;

