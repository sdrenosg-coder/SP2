import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import crypto from 'crypto';

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return null;
  }
}

export function generateRandomToken() {
  return crypto.randomUUID();
}
