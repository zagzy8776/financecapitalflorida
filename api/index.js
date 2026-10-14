/**
 * Vercel Serverless Function entry point.
 *
 * Uses Neon PostgreSQL. On a cold start, the schema must be ready before
 * requests query it. Cache the migration promise so concurrent requests share
 * the same initialization.
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
        cause: err?.cause?.message,
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
    const hint =
      !process.env.DATABASE_URL && !process.env.POSTGRES_URL
        ? ' DATABASE_URL is not set in Vercel Environment Variables.'
        : ' Check Vercel logs and that the Neon connection string is correct.';
    return res.status(503).json({
      error: 'Database initialization failed. Please try again shortly.' + hint,
    });
  }

  return app(req, res);
}
