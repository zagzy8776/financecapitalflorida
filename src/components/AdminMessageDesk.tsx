import { useEffect, useState } from 'react';
import { api, formatDate } from '../lib/api';
import { Button } from './ui';

type Thread = {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  status: string;
  last_body?: string;
  unread?: number;
  last_message_at: string;
};

type Msg = {
  id: string;
  sender_role: string;
  sender_name?: string;
  body: string;
  created_at: string;
};

export default function AdminMessageDesk() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [active, setActive] = useState<any>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadList = async () => {
    const data = await api.adminSupportThreads();
    setThreads(data.threads || []);
    if (!activeId && data.threads?.[0]) setActiveId(data.threads[0].id);
  };

  const loadThread = async (id: string) => {
    const data = await api.adminSupportThread(id);
    setActive(data.thread);
    setMessages(data.messages || []);
  };

  useEffect(() => {
    loadList().catch((err: any) => setError(err?.message || 'Could not load messages.'));
    const timer = window.setInterval(() => {
      loadList().catch(() => {});
      if (activeId) loadThread(activeId).catch(() => {});
    }, 6000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId).catch((err: any) => setError(err?.message || 'Could not open thread.'));
  }, [activeId]);

  const reply = async () => {
    if (!activeId || draft.trim().length < 2) return;
    setBusy(true);
    setError('');
    try {
      await api.adminReplySupport(activeId, draft.trim());
      setDraft('');
      await loadThread(activeId);
      await loadList();
    } catch (err: any) {
      setError(err?.message || 'Reply failed.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: 'open' | 'closed') => {
    if (!activeId) return;
    setBusy(true);
    try {
      await api.adminSetSupportStatus(activeId, status);
      await loadThread(activeId);
      await loadList();
    } catch (err: any) {
      setError(err?.message || 'Could not update status.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[.16em] text-[#b68a45]">Desk</p>
          <h3 className="text-sm font-semibold text-[#10243f]">Client messages</h3>
        </div>
        <ul className="max-h-[640px] overflow-y-auto">
          {threads.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">No secure messages yet.</li>}
          {threads.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setActiveId(t.id)} className={`w-full border-b border-slate-100 px-4 py-3 text-left ${activeId === t.id ? 'bg-[#fbf8f3]' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[#10243f]">{t.full_name}</p>
                  {(t.unread || 0) > 0 && <span className="rounded-full bg-[#10243f] px-1.5 text-[10px] text-white">{t.unread}</span>}
                </div>
                <p className="truncate text-xs text-slate-500">{t.last_body || 'No message yet'}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{t.reference} · {t.status}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-[560px] flex-col rounded-2xl border border-slate-200 bg-white">
        {active ? (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#10243f]">{active.full_name}</p>
                <p className="text-xs text-slate-500">{active.email} · {active.reference}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setStatus(active.status === 'closed' ? 'open' : 'closed')} loading={busy}>
                {active.status === 'closed' ? 'Reopen' : 'Close thread'}
              </Button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={m.sender_role === 'admin' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={m.sender_role === 'system' ? 'mx-auto text-center text-[11px] text-slate-400' : m.sender_role === 'admin' ? 'max-w-[80%] rounded-2xl bg-[#10243f] px-3 py-2 text-white' : 'max-w-[80%] rounded-2xl border border-slate-200 bg-white px-3 py-2'}>
                    {m.sender_role !== 'system' && <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{m.sender_role === 'admin' ? 'Bank' : active.full_name}</p>}
                    <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                    {m.sender_role !== 'system' && <p className="mt-1 text-[10px] opacity-60">{formatDate(m.created_at)}</p>}
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="px-4 text-xs text-red-600">{error}</p>}
            <div className="border-t border-slate-100 p-3">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 2000))} rows={3} placeholder="Reply as Finance Capital Florida…" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#b68a45]" />
              <div className="mt-2 flex justify-end">
                <Button onClick={reply} loading={busy} disabled={draft.trim().length < 2}>Send reply</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-slate-500">Select a client thread.</div>
        )}
      </section>
    </div>
  );
}
