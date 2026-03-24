import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

function validateMongoUri(uri) {
  const hasTemplatePlaceholder = uri.includes('<') || uri.includes('>') || uri.includes('cluster-url');

  if (hasTemplatePlaceholder) {
    throw new Error(
      'Invalid MONGODB_URI: replace template placeholders in .env.local (username/password/cluster-url), then restart the dev server.'
    );
  }
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in environment variables');
  }

  validateMongoUri(MONGODB_URI);

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined })
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
