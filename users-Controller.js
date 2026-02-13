import {
  createUser,
  validateUser,
  createUserInDb,
  findUserByEmail,
  verifyUserCredentials,
} from '../models/user.js';
import { generateToken } from '../util/auth.js';

/**
 * POST /users/signup — Register a new user.
 * Persists to SQLite; returns the created user (without password in response) and a JWT token.
 */
export async function signup(req, res) {
  const { email, password, name } = req.body;
  const errors = [];

  // Validate email: present, not blank, and conforms to standard email pattern
  const emailTrimmed = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailTrimmed) {
    errors.push('Email is required');
  } else if (!emailRegex.test(emailTrimmed)) {
    errors.push('A valid email address is required');
  }

  // Validate password: present, not blank, minimum 6 chars
  const passwordValue = typeof password === 'string' ? password.trim() : '';
  if (!passwordValue) {
    errors.push('Password is required');
  } else if (passwordValue.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    // Check if user already exists (email uniqueness, checked after validating as valid email)
    const existing = findUserByEmail(emailTrimmed);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

  // Persist user to SQLite (createUser hashes password; must await)
  const saved = await createUserInDb({ email: emailTrimmed, password: passwordValue, name });
  const { password: _, ...publicUser } = saved;

    // Generate JWT token after successful signup
    const token = generateToken({ id: publicUser.id, email: publicUser.email });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: publicUser,
      token,
    });
  } catch (err) {
    // Log full error for debugging (stack traces go to console/server logs)
    console.error('Signup error:', err && err.stack ? err.stack : err);

    // Handle SQLite unique-constraint (duplicate email) explicitly
    const isSqliteUniqueError =
      err &&
      (err.code === 'SQLITE_CONSTRAINT' ||
        err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        (err.message && err.message.toLowerCase().includes('unique')));
    if (isSqliteUniqueError) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Temporarily expose error details to client to diagnose 500s.
    // You can remove `details` later if you don't want to leak internals.
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: err && err.message ? err.message : String(err),
    });
  }
}

/**
 * POST /users/login — Authenticate user (email + password).
 * Validates input, checks credentials, and returns a success message with a JWT token if valid.
 */
export async function login(req, res) {
  const { email, password } = req.body;

  const emailValue = typeof email === 'string' ? email.trim() : '';
  const passwordValue = typeof password === 'string' ? password.trim() : '';

  if (!emailValue || !passwordValue) {
    return res.status(400).json({
      success: false,
      errors: ['Email and password are required'],
    });
  }

  try {
    // Use verifyUserCredentials from @models/user.js
    const user = await verifyUserCredentials(emailValue, passwordValue);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token after successful login
    const token = generateToken({ id: user.id, email: user.email });

    // Do not include the password in the response
    const { password: _, ...publicUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: publicUser,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
