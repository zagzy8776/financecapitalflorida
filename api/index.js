/**
 * Vercel Serverless Function entry point.
 *
 * The application uses Aiven PostgreSQL. On a cold start, the schema must be
 * ready before an auth/account request is allowed to query it. Cache the
 * migration promise so concurrent requests share the same initialization.
 */
import app from '../server/src/index.js';
import { runMigrations } from '../server/src/migrations.js';

let migrationPromise;

function ensureMigrations() {
  if (!migrationPromise) {
    migrationPromise = runMigrations().catch((err) => {
      migrationPromise = undefined;
      console.error('[db] Vercel migration failed:', {
        code: err?.code,
        message: err?.message,
        detail: err?.detail,
      });
      throw err;
    });
  }
  return migrationPromise;
}

export default async function handler(req, res) {
  try {
    await ensureMigrations();
  } catch (err) {
    return res.status(503).json({
      error: 'Database initialization failed. Please try again shortly.',
    });
  }

  return app(req, res);
}
