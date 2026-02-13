import db from '../db.js';

/**
 * User model (plain object / factory, no classes) plus persistence helpers.
 */

/**
 * Creates a new user object.
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.password - Plain password (to be hashed later)
 * @param {string} [data.name] - Optional display name
 * @returns {Object} User object
 */
import bcrypt from 'bcryptjs';

/**
 * Asynchronously creates a new user object with hashed password and a salt.
 * @param {Object} param0
 * @param {string} param0.email
 * @param {string} param0.password
 * @param {string} [param0.name]
 * @returns {Promise<Object>} Promise of user object
 */
export async function createUser({ email, password, name }) {
  let hashedPassword = '';
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }
  return {
    id: null, // to be set when persisting
    email: email?.trim().toLowerCase() || '',
    password: hashedPassword,
    name: (name && name.trim()) || null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Verifies user credentials (email and plain password).
 * @param {string} email - User email
 * @param {string} password - Plain password to check
 * @returns {Promise<Object|null>} Resolves with the user object (without password) if credentials match, or null otherwise.
 */
export async function verifyUserCredentials(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;
  // Exclude password before returning user object
  const { password: _, ...rest } = user;
  return rest;
}

/**
 * Validates that required user fields are present and valid.
 * @param {Object} user - User object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateUser(user) {
  const errors = [];
  if (!user.email || !user.email.trim()) errors.push('Email is required');
  if (!user.password || user.password.length < 6) errors.push('Password is required');
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Look up a user by email in SQLite.
 * @param {string} email
 * @returns {Object|null}
 */
export function findUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.trim().toLowerCase()) || null;
}

/**
 * Persist a new user in SQLite.
 * @param {{ email: string, password: string, name?: string }} data
 * @returns {Promise<Object>} Saved user (including id)
 */
export async function createUserInDb({ email, password, name }) {
  const user = await createUser({ email, password, name });

  const stmt = db.prepare(`
    INSERT INTO users (email, password, name, createdAt)
    VALUES (?, ?, ?, ?)
  `);

  const info = stmt.run(
    user.email,
    user.password,
    user.name,
    user.createdAt
  );

  return { ...user, id: info.lastInsertRowid };
}
