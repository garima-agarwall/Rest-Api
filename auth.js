import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'abctesttoken'; // Consider changing this in production

/**
 * Generate a JWT for a user. The token payload includes the user id and email.
 * @param {{ id: number, email: string }} user - User object with id and email
 * @param {string} [expiresIn='7d'] - Token expiration (e.g. '7d', '24h', '60s')
 * @returns {string} Signed JWT
 */
export function generateToken(user, expiresIn = '7d') {
  const payload = {
    id: user.id,
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT and return the decoded payload (id and email).
 * @param {string} token - JWT string (typically from Authorization header)
 * @returns {{ id: number, email: string, iat?: number, exp?: number }} Decoded payload
 * @throws {jwt.JsonWebTokenError} If token is invalid or malformed
 * @throws {jwt.TokenExpiredError} If token has expired
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  try {
    const user = verifyToken(token);
    req.user = user; // Attach user info to request object for downstream use
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Provide a default export alongside named exports for compatibility
export default {
  generateToken,
  verifyToken,
  authenticateToken,
};