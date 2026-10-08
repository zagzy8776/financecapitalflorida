import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Shield } from 'lucide-react';
import { api, formatDate } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Msg = {
  id: string;
  sender_role: 'customer' | 'admin' | 'system';
  sender_name?: string;
  body: string;
  created_at: string;
};

export default function SecureMessageCentre() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const hidden = !user || location.pathname.startsWith('/admin') || location.pathname === '/login' || location.pathname === '/signup';

  const load = async () => {
    try {
      const data = await api.supportThread();
      setMessages(data.messages || []);
      setReference(data.thread?.reference || '');
      const fresh = (data.messages || []).filter((m: Msg) => m.sender_role === 'admin').length;
      if (!open) setUnread(fresh > 0 && (data.messages || []).at(-1)?.sender_role === 'admin' ? 1 : 0);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Secure messages are unavailable.');
    }
  };

  useEffect(() => {
    if (hidden) return;
    load();
    const timer = window.setInterval(load, open ? 5000 : 20000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, open, user?.id]);

  useEffect(() => {
    if (open) scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, open]);

  const send = async () => {
    const body = draft.trim();
    if (body.length < 2 || sending) return;
    setSending(true);
    setError('');
    try {
      await api.sendSupportMessage(body);
      setDraft('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-5 right-4 z-40 sm:right-6">
      {open && (
        <section className="mb-3 flex h-[min(560px,72vh)] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-[#d7c4a3] bg-white shadow-[0_18px_50px_rgba(16,36,63,0.18)]">
          <header className="bg-[#10243f] px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[.16em] text-[#d8b16d]">Finance Capital Florida</p>
                <h2 className="text-sm font-semibold">Secure Message Centre</h2>
                <p className="mt-0.5 text-[11px] text-slate-300">{reference || 'Private client desk'}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close messages">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="flex items-start gap-2 border-b border-slate-100 bg-[#fbf8f3] px-4 py-2 text-[11px] leading-4 text-slate-600">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b68a45]" />
            <p>Tied to your signed-in profile. Do not send passwords, PINs, or one-time codes.</p>
          </div>
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3">
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                Write to the bank about a transfer, deposit, or account question. A banker replies from the control centre.
              </div>
            )}
            {messages.map((m) => {
              const mine = m.sender_role === 'customer';
              const system = m.sender_role === 'system';
              if (system) {
                return <p key={m.id} className="text-center text-[11px] text-slate-400">{m.body}</p>;
              }
              return (
                <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={mine ? 'max-w-[85%] rounded-2xl rounded-br-md bg-[#10243f] px-3 py-2 text-white' : 'max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-[#10243f]'}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{mine ? 'You' : 'Banker'}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-5">{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-60">{formatDate(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {error && <p className="px-3 py-1 text-xs text-red-600">{error}</p>}
          <form
            className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              rows={2}
              placeholder="Message the bank…"
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-[#10243f] outline-none focus:border-[#b68a45]"
            />
            <button type="submit" disabled={sending || draft.trim().length < 2} className="grid h-11 w-11 place-items-center rounded-xl bg-[#10243f] text-white disabled:opacity-40" aria-label="Send secure message">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setUnread(0); }}
        className="ml-auto flex items-center gap-2 rounded-full bg-[#10243f] px-4 py-3 text-sm font-semibold text-white shadow-lg"
      >
        <MessageSquare className="h-4 w-4 text-[#d8b16d]" />
        Message us
        {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#d8b16d] px-1 text-[10px] text-[#10243f]">1</span>}
      </button>
    </div>
  );
}
