/**
 * Finance Capital Florida database migrations.
 *
 * The migration is deliberately idempotent: it can run against a fresh
 * PostgreSQL database or the database inherited from the original app.
 *
 * Run this on the Render API service at startup. The advisory lock prevents
 * two instances from changing the schema at the same time.
 */

import { query } from './db.js';

const MIGRATION_LOCK = 731942061;

async function addColumns(table, columns) {
  for (const [name, definition] of columns) {
    await query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${name} ${definition}`);
  }
}

async function index(sql) {
  await query(sql).catch((err) => {
    console.warn('migration index:', err.message);
  });
}

export async function runMigrations() {
  console.log('[db] Finance Capital Florida migrations starting');

  await query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK]);

  try {
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // -----------------------------------------------------------------------
    // Core identity tables. These make a brand-new Render/Postgres database
    // usable without requiring a hidden/manual SQL bootstrap.
    // -----------------------------------------------------------------------
    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_locked BOOLEAN NOT NULL DEFAULT false,
        phone TEXT,
        address TEXT,
        date_of_birth DATE,
        country TEXT NOT NULL DEFAULT 'GB',
        kyc_status TEXT NOT NULL DEFAULT 'pending',
        account_status TEXT NOT NULL DEFAULT 'active',
        transaction_pin_hash TEXT,
        avatar_url TEXT,
        session_version INTEGER NOT NULL DEFAULT 1,
        notify_login BOOLEAN NOT NULL DEFAULT true,
        notify_transfers BOOLEAN NOT NULL DEFAULT true,
        notify_deposits BOOLEAN NOT NULL DEFAULT true,
        notify_marketing BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login TIMESTAMPTZ
      )
    `);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique
      ON profiles (LOWER(email))
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        account_number TEXT,
        account_name TEXT,
        account_type TEXT NOT NULL DEFAULT 'current',
        routing_number TEXT,
        currency TEXT NOT NULL DEFAULT 'GBP',
        balance NUMERIC(24,2) NOT NULL DEFAULT 0,
        available_balance NUMERIC(24,2) NOT NULL DEFAULT 0,
        daily_limit NUMERIC(24,2) NOT NULL DEFAULT 20000,
        transaction_limit NUMERIC(24,2) NOT NULL DEFAULT 5000,
        monthly_limit NUMERIC(24,2) NOT NULL DEFAULT 100000,
        status TEXT NOT NULL DEFAULT 'active',
        is_locked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        amount NUMERIC(24,2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'GBP',
        status TEXT NOT NULL DEFAULT 'completed',
        description TEXT,
        reference TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS account_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        currency TEXT NOT NULL,
        account_name TEXT,
        account_type TEXT DEFAULT 'current',
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ
      )
    `);

    // -----------------------------------------------------------------------
    // Bring an existing/older schema up to the complete application contract.
    // -----------------------------------------------------------------------
    await addColumns('profiles', [
      ['email', 'TEXT'],
      ['password_hash', 'TEXT'],
      ['full_name', 'TEXT'],
      ['role', `TEXT NOT NULL DEFAULT 'user'`],
      ['is_locked', `BOOLEAN NOT NULL DEFAULT false`],
      ['phone', 'TEXT'],
      ['address', 'TEXT'],
      ['date_of_birth', 'DATE'],
      ['country', `TEXT NOT NULL DEFAULT 'GB'`],
      ['kyc_status', `TEXT NOT NULL DEFAULT 'pending'`],
      ['account_status', `TEXT NOT NULL DEFAULT 'active'`],
      ['transaction_pin_hash', 'TEXT'],
      ['avatar_url', 'TEXT'],
      ['session_version', `INTEGER NOT NULL DEFAULT 1`],
      ['notify_login', `BOOLEAN NOT NULL DEFAULT true`],
      ['notify_transfers', `BOOLEAN NOT NULL DEFAULT true`],
      ['notify_deposits', `BOOLEAN NOT NULL DEFAULT true`],
      ['notify_marketing', `BOOLEAN NOT NULL DEFAULT false`],
      ['created_at', `TIMESTAMPTZ NOT NULL DEFAULT now()`],
      ['last_login', 'TIMESTAMPTZ'],
    ]);

    await addColumns('accounts', [
      ['user_id', 'UUID'],
      ['account_number', 'TEXT'],
      ['account_name', 'TEXT'],
      ['account_type', `TEXT NOT NULL DEFAULT 'current'`],
      ['routing_number', 'TEXT'],
      ['currency', `TEXT NOT NULL DEFAULT 'GBP'`],
      ['balance', `NUMERIC(24,2) NOT NULL DEFAULT 0`],
      ['available_balance', `NUMERIC(24,2) NOT NULL DEFAULT 0`],
      ['daily_limit', `NUMERIC(24,2) NOT NULL DEFAULT 20000`],
      ['transaction_limit', `NUMERIC(24,2) NOT NULL DEFAULT 5000`],
      ['monthly_limit', `NUMERIC(24,2) NOT NULL DEFAULT 100000`],
      ['status', `TEXT NOT NULL DEFAULT 'active'`],
      ['is_locked', `BOOLEAN NOT NULL DEFAULT false`],
      ['created_at', `TIMESTAMPTZ NOT NULL DEFAULT now()`],
    ]);

    await addColumns('transactions', [
      ['account_id', 'UUID'],
      ['user_id', 'UUID'],
      ['type', 'TEXT'],
      ['amount', `NUMERIC(24,2) NOT NULL DEFAULT 0`],
      ['currency', `TEXT NOT NULL DEFAULT 'GBP'`],
      ['status', `TEXT NOT NULL DEFAULT 'completed'`],
      ['description', 'TEXT'],
      ['reference', 'TEXT'],
      ['metadata', 'JSONB'],
      ['created_at', `TIMESTAMPTZ NOT NULL DEFAULT now()`],
    ]);

    await addColumns('activity_log', [
      ['user_id', 'UUID'],
      ['action', 'TEXT'],
      ['description', 'TEXT'],
      ['metadata', 'JSONB'],
      ['created_at', `TIMESTAMPTZ NOT NULL DEFAULT now()`],
    ]);

    await addColumns('account_requests', [
      ['requester_id', 'UUID'],
      ['currency', 'TEXT'],
      ['account_name', 'TEXT'],
      ['account_type', `TEXT DEFAULT 'current'`],
      ['status', `TEXT NOT NULL DEFAULT 'pending'`],
      ['admin_note', 'TEXT'],
      ['created_at', `TIMESTAMPTZ NOT NULL DEFAULT now()`],
      ['reviewed_at', 'TIMESTAMPTZ'],
    ]);

    // Normalize nulls created by older schemas before relying on the columns.
    await query(`UPDATE profiles SET role = 'user' WHERE role IS NULL`);
    await query(`UPDATE profiles SET country = 'GB' WHERE country IS NULL OR country = ''`);
    await query(`UPDATE profiles SET kyc_status = 'pending' WHERE kyc_status IS NULL`);
    await query(`UPDATE profiles SET account_status = 'active' WHERE account_status IS NULL`);
    await query(`UPDATE profiles SET session_version = 1 WHERE session_version IS NULL`);
    await query(`UPDATE accounts SET balance = 0 WHERE balance IS NULL`);
    // Existing deployments created accounts before available_balance existed.\n    // In this application available_balance represents the spendable ledger amount,\n    // so bring it into sync once during migration.\n    await query(`UPDATE accounts SET available_balance = balance WHERE available_balance IS NULL OR available_balance = 0`);
    await query(`UPDATE accounts SET available_balance = COALESCE(balance, 0) WHERE available_balance IS NULL`);
    await query(`UPDATE accounts SET account_type = 'current' WHERE account_type IS NULL OR account_type = ''`);
    await query(`UPDATE accounts SET status = 'active' WHERE status IS NULL OR status = ''`);
    await query(`UPDATE transactions SET status = 'completed' WHERE status IS NULL OR status = ''`);

    // -----------------------------------------------------------------------
    // OTP, password recovery, sessions and security.
    // -----------------------------------------------------------------------
    await query(`
      CREATE TABLE IF NOT EXISTS login_otps (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        user_agent TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        revoked_at TIMESTAMPTZ
      )
    `);

    // -----------------------------------------------------------------------
    // Customer requests and ledger-supporting tables.
    // -----------------------------------------------------------------------
    await query(`
      CREATE TABLE IF NOT EXISTS deposit_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        amount NUMERIC(24,2) NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        admin_note TEXT,
        reference TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        amount NUMERIC(24,2) NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL,
        destination TEXT,
        reference TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        read_at TIMESTAMPTZ
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_type TEXT NOT NULL DEFAULT 'admin',
        actor_id UUID NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id UUID,
        before_data JSONB,
        after_data JSONB,
        reason TEXT,
        ip_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS crypto_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        asset TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        balance NUMERIC(24,8) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        admin_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS crypto_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        crypto_account_id UUID NOT NULL REFERENCES crypto_accounts(id) ON DELETE CASCADE,
        transaction_type TEXT NOT NULL,
        amount NUMERIC(24,8) NOT NULL,
        asset TEXT NOT NULL,
        counterparty_address TEXT,
        reference TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // -----------------------------------------------------------------------
    // Backwards-compatible account number generator and integrity indexes.
    // -----------------------------------------------------------------------
    await query(`
      CREATE OR REPLACE FUNCTION generate_account_number()
      RETURNS TEXT AS $$
      DECLARE
        num TEXT;
        exists_count INT;
      BEGIN
        LOOP
          num := lpad(floor(random()*1e12)::TEXT, 12, '0');
          SELECT COUNT(*) INTO exists_count FROM accounts WHERE account_number = num;
          EXIT WHEN exists_count = 0;
        END LOOP;
        RETURN num;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await index(`CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_account_number_unique ON accounts(account_number) WHERE account_number IS NOT NULL`);
    await index(`CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique_ci ON profiles(LOWER(email))`);
    await index(`CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_transactions_account_created ON transactions(account_id, created_at DESC)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_account_requests_status ON account_requests(status)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_account_requests_requester ON account_requests(requester_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_login_otps_user ON login_otps(user_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_login_otps_expiry ON login_otps(expires_at)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_password_reset_expiry ON password_reset_tokens(expires_at)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(user_id) WHERE revoked_at IS NULL`);
    await index(`CREATE INDEX IF NOT EXISTS idx_deposit_customer ON deposit_requests(customer_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_deposit_status ON deposit_requests(status)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_withdrawal_customer ON withdrawal_requests(customer_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false`);
    await index(`CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)`);
    await index(`CREATE INDEX IF NOT EXISTS idx_crypto_customer ON crypto_accounts(customer_id)`);
    await index(`CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_wallet ON crypto_accounts(wallet_address)`);

    // Backfill routing/account metadata for older accounts.
    await query(`UPDATE accounts SET routing_number = '04-00-26' WHERE currency = 'GBP' AND COALESCE(routing_number, '') = ''`);
    await query(`UPDATE accounts SET routing_number = '026009593' WHERE currency = 'USD' AND COALESCE(routing_number, '') = ''`);
    await query(`UPDATE accounts SET routing_number = '20041000' WHERE currency = 'EUR' AND COALESCE(routing_number, '') = ''`);

    console.log('[db] Finance Capital Florida migrations complete');
  } finally {
    await query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK]).catch(() => {});
  }
}
