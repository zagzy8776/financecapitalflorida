import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';

const HERO =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';
const SECURE =
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80';
const OFFICE =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';

const services = [
  {
    icon: Wallet,
    title: 'Multi-currency accounts',
    text: 'Hold and move USD, GBP, and EUR under one secure relationship with clear balances and full history.',
  },
  {
    icon: Globe2,
    title: 'International transfers',
    text: 'Send and receive funds with transparent status, references, and an audit trail you can trust.',
  },
  {
    icon: Building2,
    title: 'Business-ready tools',
    text: 'Built for operators and growing teams who need calm control over capital — not clutter.',
  },
  {
    icon: LockKeyhole,
    title: 'Protected access',
    text: 'Encrypted sessions, verification codes, and account-level controls keep sensitive activity private.',
  },
];

const trust = [
  'Encrypted sessions on every login',
  'Email verification at sign-in',
  'Full transaction history',
  'Account lock controls',
];

export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen bg-surface text-content-primary antialiased">
      {/* ── Header (kept structure, elevated polish) ── */}
      <header className="sticky top-0 z-50 border-b border-line-subtle/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-content items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white font-display font-bold text-sm tracking-tight shadow-soft group-hover:shadow-card transition">
              FC
            </span>
            <span className="font-display text-[15px] font-bold tracking-[-0.03em] text-navy-900">
              Finance Capital <span className="text-gold-500">Florida</span>
            </span>
          </a>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            <a href="#services" className="text-sm font-medium text-content-secondary hover:text-navy-900 transition">
              Services
            </a>
            <a href="#security" className="text-sm font-medium text-content-secondary hover:text-navy-900 transition">
              Security
            </a>
            <a href="#about" className="text-sm font-medium text-content-secondary hover:text-navy-900 transition">
              About
            </a>
          </nav>

          <div className="hidden items-center gap-2.5 sm:flex">
            <a
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50 transition"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-navy-800 transition"
            >
              Open account
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded-xl border border-line-strong p-2.5 text-navy-800 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-line-subtle bg-white px-5 py-5 lg:hidden animate-fade-in">
            <div className="flex flex-col gap-1">
              <a href="#services" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800" onClick={() => setOpen(false)}>
                Services
              </a>
              <a href="#security" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800" onClick={() => setOpen(false)}>
                Security
              </a>
              <a href="#about" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800" onClick={() => setOpen(false)}>
                About
              </a>
              <div className="mt-3 flex flex-col gap-2 border-t border-line-subtle pt-4">
                <a href="/login" className="rounded-xl border border-line-strong px-4 py-3 text-center text-sm font-semibold text-navy-900">
                  Sign in
                </a>
                <a href="/signup" className="rounded-xl bg-navy-900 px-4 py-3 text-center text-sm font-semibold text-white">
                  Open account
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/85 to-navy-900/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/30" />
        </div>

        <div className="relative mx-auto max-w-content px-5 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="max-w-2xl animate-fade-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-200 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" />
              Digital banking · Florida
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.5rem]">
              Banking that feels calm, clear, and built for real capital.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Multi-currency accounts, transparent transfers, and protected access — designed so your money and your records stay easy to understand.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-7 py-3.5 text-sm font-bold text-navy-950 shadow-amber hover:bg-gold-400 transition"
              >
                Open an account
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition"
              >
                Client sign in
              </a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-8">
              {['USD · GBP · EUR', 'Encrypted sessions', 'Full audit trail'].map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-gold-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-b border-line-subtle bg-white">
        <div className="mx-auto grid max-w-content gap-8 px-5 py-10 sm:grid-cols-3 lg:px-8">
          {[
            { n: '01', label: 'One secure relationship' },
            { n: '24/7', label: 'Digital access' },
            { n: '100%', label: 'Clear transaction history' },
          ].map((s) => (
            <div key={s.n} className="flex items-baseline gap-4">
              <span className="font-display text-2xl font-bold tracking-tight text-navy-900">{s.n}</span>
              <span className="text-sm font-medium text-content-secondary">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="mx-auto max-w-content px-5 py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">What you get</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-navy-900 sm:text-4xl">
            Everything a modern relationship needs — nothing you don’t.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-content-secondary">
            From opening multi-currency accounts to moving funds with a full record, the experience is built to feel like a serious financial institution.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="group rounded-2xl border border-line-subtle bg-white p-6 shadow-soft transition hover:border-gold-200 hover:shadow-card"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-800 group-hover:bg-gold-50 group-hover:text-gold-700 transition">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-navy-900">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-content-secondary">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="bg-navy-950 text-white">
        <div className="mx-auto grid max-w-content items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-400">Security first</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              A serious financial interface should feel calm.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">
              Sensitive activity stays behind protected authentication. Every movement leaves a clear record so you always know what happened, when, and where funds moved.
            </p>
            <ul className="mt-8 space-y-3.5">
              {trust.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-gold-400" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-navy-900 hover:bg-slate-100 transition"
            >
              Start securely
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-elevated">
              <img src={SECURE} alt="Secure financial workspace" className="h-72 w-full object-cover sm:h-96" />
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/10 bg-navy-900/95 px-5 py-4 shadow-elevated backdrop-blur sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-400">Protected</p>
              <p className="mt-1 text-sm font-medium text-white">Session encryption · OTP at sign-in</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="mx-auto max-w-content px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl border border-line-subtle shadow-card">
            <img src={OFFICE} alt="Professional workspace" className="h-64 w-full object-cover sm:h-80" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">Finance Capital Florida</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-navy-900 sm:text-4xl">
              Built for clarity. Ready for growth.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-content-secondary">
              We designed the experience around trust and readability — balances you can scan, transfers you can follow, and an interface that stays out of the way when you need to act.
            </p>
            <p className="mt-4 text-base leading-relaxed text-content-secondary">
              Whether you manage personal capital or run a growing operation, the same calm system supports accounts, deposits, withdrawals, and history in one place.
            </p>
            <a
              href="/login"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-gold-600 transition"
            >
              Access your account
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="border-t border-line-subtle bg-white">
        <div className="mx-auto max-w-content px-5 py-16 text-center lg:px-8 lg:py-20">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em] text-navy-900 sm:text-3xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-content-secondary">
            Open a relationship in minutes. Sign in anytime with verification that protects every session.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-7 py-3.5 text-sm font-bold text-white shadow-soft hover:bg-navy-800 transition"
            >
              Open an account
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-7 py-3.5 text-sm font-semibold text-navy-900 hover:bg-navy-50 transition"
            >
              Sign in
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line-subtle bg-navy-950 text-slate-400">
        <div className="mx-auto flex max-w-content flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-xs font-bold text-white">FC</span>
            <span className="text-sm font-medium text-slate-300">
              © {new Date().getFullYear()} Finance Capital Florida
            </span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="/terms" className="hover:text-white transition">Terms</a>
            <a href="/privacy" className="hover:text-white transition">Privacy</a>
            <a href="mailto:support@financecapitalflorida.com" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
