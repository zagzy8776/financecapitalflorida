/**
 * Finance Capital Florida secure message centre.
 * First-party only: JWT customer/admin, Postgres transcript, no third-party widget.
 */
import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, adminMiddleware } from '../auth.js';
import { createNotification, createAuditLog } from '../helpers.js';
import { sendEmail, layout, escapeHtml } from '../email.js';

const router = Router();
const MAX_BODY = 2000;
let schemaReady;

function cleanBody(value) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, MAX_BODY);
}

function refOf(id) {
  return `SMC-${String(id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS support_threads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID NOT NULL,
          subject TEXT NOT NULL DEFAULT 'Secure message',
          status TEXT NOT NULL DEFAULT 'open',
          last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS support_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          thread_id UUID NOT NULL,
          sender_role TEXT NOT NULL,
          sender_id TEXT,
          sender_name TEXT,
          body TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          read_at TIMESTAMPTZ
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS idx_support_threads_customer ON support_threads(customer_id, last_message_at DESC)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_support_threads_status ON support_threads(status, last_message_at DESC)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_support_messages_thread ON support_messages(thread_id, created_at ASC)`);
    })().catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}

async function openThread(customerId) {
  const existing = await query(
    `SELECT * FROM support_threads
     WHERE customer_id = $1 AND status <> 'closed'
     ORDER BY last_message_at DESC LIMIT 1`,
    [customerId]
  );
  if (existing.rows[0]) return existing.rows[0];
  const created = await query(
    `INSERT INTO support_threads (customer_id, subject, status)
     VALUES ($1, 'Secure message', 'open')
     RETURNING *`,
    [customerId]
  );
  return created.rows[0];
}

async function messagesFor(threadId) {
  const { rows } = await query(
    `SELECT id, thread_id, sender_role, sender_name, body, created_at, read_at
     FROM support_messages WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 300`,
    [threadId]
  );
  return rows;
}

function notifyCustomer(userId, title, message, threadId) {
  createNotification(userId, 'support_message', title, message, { thread_id: threadId }).catch(() => {});
}

function mailCustomer({ to, fullName, preview }) {
  if (!to) return;
  const first = (fullName || 'Client').split(/\s+/)[0];
  const html = layout({
    title: 'New secure message',
    preheader: 'Finance Capital Florida has replied in your secure message centre.',
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">Hello ${escapeHtml(first)}, a banker has replied in your secure message centre.</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#94a3b8;">${escapeHtml(preview)}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">Sign in to read the full message. Do not share passwords or one-time codes in chat.</p>`,
  });
  sendEmail({
    to,
    subject: 'Finance Capital Florida — secure message',
    html,
    text: `A banker replied in your secure message centre. Sign in to read it.`,
  }).catch(() => {});
}

router.get('/api/support/thread', authMiddleware, async (req, res) => {
  try {
    await ensureSchema();
    const thread = await openThread(req.user.id);
    await query(
      `UPDATE support_messages SET read_at = now()
       WHERE thread_id = $1 AND sender_role = 'admin' AND read_at IS NULL`,
      [thread.id]
    );
    const messages = await messagesFor(thread.id);
    res.json({
      thread: { ...thread, reference: refOf(thread.id) },
      messages,
    });
  } catch (err) {
    console.error('support thread:', err.message);
    res.status(500).json({ error: 'Secure messages are unavailable right now.' });
  }
});

router.post('/api/support/messages', authMiddleware, async (req, res) => {
  try {
    await ensureSchema();
    const body = cleanBody(req.body?.body);
    if (body.length < 2) return res.status(400).json({ error: 'Write a short message before sending.' });
    const profile = await query(
      `SELECT id, full_name, email, is_locked FROM profiles WHERE id = $1`,
      [req.user.id]
    );
    const customer = profile.rows[0];
    if (!customer) return res.status(404).json({ error: 'Profile not found' });
    if (customer.is_locked) return res.status(403).json({ error: 'This profile is locked. Secure messaging is unavailable.' });

    const thread = await openThread(customer.id);
    const inserted = await query(
      `INSERT INTO support_messages (thread_id, sender_role, sender_id, sender_name, body)
       VALUES ($1, 'customer', $2, $3, $4) RETURNING id, thread_id, sender_role, sender_name, body, created_at, read_at`,
      [thread.id, customer.id, customer.full_name, body]
    );
    await query(
      `UPDATE support_threads SET status = 'open', last_message_at = now(), updated_at = now() WHERE id = $1`,
      [thread.id]
    );
    await query(
      `INSERT INTO activity_log (user_id, action, description) VALUES ($1, 'support_message', $2)`,
      [customer.id, `Secure message sent (${refOf(thread.id)})`]
    ).catch(() => {});

    const supportTo = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL;
    if (supportTo) {
      const html = layout({
        title: 'New client message',
        preheader: `${customer.full_name} sent a secure message.`,
        bodyHtml: `
          <p style="margin:0 0 12px;font-size:15px;color:#cbd5e1;">${escapeHtml(customer.full_name)} (${escapeHtml(customer.email)}) wrote in the secure message centre.</p>
          <p style="margin:0;font-size:14px;color:#94a3b8;">${escapeHtml(body.slice(0, 280))}</p>`,
      });
      sendEmail({
        to: supportTo,
        subject: `Secure message · ${customer.full_name}`,
        html,
      }).catch(() => {});
    }

    res.status(201).json({ message: inserted.rows[0], reference: refOf(thread.id) });
  } catch (err) {
    console.error('support send:', err.message);
    res.status(500).json({ error: 'Message could not be sent.' });
  }
});

router.get('/api/admin/support/threads', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureSchema();
    const { rows } = await query(
      `SELECT t.*, p.full_name, p.email,
              (SELECT body FROM support_messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_body,
              (SELECT COUNT(*)::int FROM support_messages m WHERE m.thread_id = t.id AND m.sender_role = 'customer' AND m.read_at IS NULL) AS unread
       FROM support_threads t
       JOIN profiles p ON p.id = t.customer_id
       ORDER BY t.last_message_at DESC
       LIMIT 100`
    );
    res.json({
      threads: rows.map((row) => ({ ...row, reference: refOf(row.id) })),
    });
  } catch (err) {
    console.error('admin support list:', err.message);
    res.status(500).json({ error: 'Could not load the message desk.' });
  }
});

router.get('/api/admin/support/threads/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureSchema();
    const thread = await query(
      `SELECT t.*, p.full_name, p.email, p.phone, p.country
       FROM support_threads t JOIN profiles p ON p.id = t.customer_id WHERE t.id = $1`,
      [req.params.id]
    );
    if (!thread.rows[0]) return res.status(404).json({ error: 'Thread not found' });
    await query(
      `UPDATE support_messages SET read_at = now()
       WHERE thread_id = $1 AND sender_role = 'customer' AND read_at IS NULL`,
      [req.params.id]
    );
    const messages = await messagesFor(req.params.id);
    res.json({ thread: { ...thread.rows[0], reference: refOf(thread.rows[0].id) }, messages });
  } catch (err) {
    console.error('admin support thread:', err.message);
    res.status(500).json({ error: 'Could not open that thread.' });
  }
});

router.post('/api/admin/support/threads/:id/messages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureSchema();
    const body = cleanBody(req.body?.body);
    if (body.length < 2) return res.status(400).json({ error: 'Write a reply before sending.' });
    const thread = await query(
      `SELECT t.*, p.email, p.full_name FROM support_threads t JOIN profiles p ON p.id = t.customer_id WHERE t.id = $1`,
      [req.params.id]
    );
    if (!thread.rows[0]) return res.status(404).json({ error: 'Thread not found' });
    if (thread.rows[0].status === 'closed') {
      return res.status(409).json({ error: 'Reopen the thread before replying.' });
    }
    const inserted = await query(
      `INSERT INTO support_messages (thread_id, sender_role, sender_id, sender_name, body)
       VALUES ($1, 'admin', $2, 'Finance Capital Florida', $3)
       RETURNING id, thread_id, sender_role, sender_name, body, created_at, read_at`,
      [req.params.id, req.user.id || 'admin-owner', body]
    );
    await query(
      `UPDATE support_threads SET status = 'pending', last_message_at = now(), updated_at = now() WHERE id = $1`,
      [req.params.id]
    );
    notifyCustomer(
      thread.rows[0].customer_id,
      'Secure message',
      'Finance Capital Florida replied in your secure message centre.',
      req.params.id
    );
    mailCustomer({
      to: thread.rows[0].email,
      fullName: thread.rows[0].full_name,
      preview: body.slice(0, 180),
    });
    createAuditLog(req.user.id, 'support_reply', 'support_thread', req.params.id, null, { preview: body.slice(0, 120) }, 'Admin secure reply', req.ip).catch(() => {});
    res.status(201).json({ message: inserted.rows[0] });
  } catch (err) {
    console.error('admin support reply:', err.message);
    res.status(500).json({ error: 'Reply could not be sent.' });
  }
});

router.post('/api/admin/support/threads/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureSchema();
    const status = req.body?.status === 'closed' ? 'closed' : 'open';
    const updated = await query(
      `UPDATE support_threads SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [req.params.id, status]
    );
    if (!updated.rows[0]) return res.status(404).json({ error: 'Thread not found' });
    await query(
      `INSERT INTO support_messages (thread_id, sender_role, sender_id, sender_name, body)
       VALUES ($1, 'system', $2, 'Finance Capital Florida', $3)`,
      [req.params.id, req.user.id || 'admin-owner', status === 'closed' ? 'This secure thread was closed by the bank.' : 'This secure thread was reopened.']
    );
    createAuditLog(req.user.id, 'support_status', 'support_thread', req.params.id, null, { status }, 'Secure thread status', req.ip).catch(() => {});
    res.json({ thread: { ...updated.rows[0], reference: refOf(updated.rows[0].id) } });
  } catch (err) {
    console.error('admin support status:', err.message);
    res.status(500).json({ error: 'Could not update the thread.' });
  }
});

export default router;
