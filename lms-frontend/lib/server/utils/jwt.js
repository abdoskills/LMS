import jwt from 'jsonwebtoken';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const JWT_SECRET = getRequiredEnv('JWT_SECRET');
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

export function signToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
