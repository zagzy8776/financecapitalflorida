import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatMoney } from '../lib/api';
import { CURRENCIES, currencyMeta } from '../lib/currencies';
import { maskAccountNumber, maskBalance, titleCase, formatRelativeDay } from '../lib/format';
import { useBalanceVisibility, useScrolled } from '../hooks/useBalanceVisibility';
import {
  Alert, Button, EmptyState, IconButton, Input, Modal, SectionHeading,
  Select, SkeletonList, SkipLink, StatusBadge,
} from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { cx } from '../lib/designTokens';
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Clock, CreditCard, Eye, EyeOff,
  Home, Menu, Plus, Send, Wallet, TrendingUp, Coins, type LucideIcon,
} from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';

interface Account {
  id: string;
  account_number: string;
  account_name: string;
  currency: string;
  balance: string;
  status: string;
  is_locked: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  description?: string;
  reference?: string;
  status?: string;
  created_at: string;
  account_number?: string;
}

function isIncoming(tx: Transaction) {
  const ty = (tx.type || '').toLowerCase();
  if (['deposit', 'transfer_in', 'credit', 'admin_credit'].includes(ty)) return true;
  if (['withdrawal', 'transfer_out', 'debit', 'admin_debit'].includes(ty)) return false;
  return parseFloat(tx.amount) > 0;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { hideBalances, toggle } = useBalanceVisibility();
  const scrolled = useScrolled();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(/\s+/)[0] || 'Client';

  const load = useCallback(async () => {
    setError('');
    try {
      const { accounts: rows } = await api.getAccounts();
      setAccounts(rows || []);
      if (rows?.length) {
        try {
          const txRes = await api.getTransactions(rows[0].id);
          setRecentTx((txRes.transactions || []).slice(0, 6));
        } catch {
          /* silent */
        }
      }
    } catch (e: any) {
      setError(e?.message || 'We could not load your accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalByCurrency = useMemo(
    () =>
      accounts.reduce((acc, a) => {
        acc[a.currency] = (acc[a.currency] || 0) + parseFloat(a.balance || '0');
        return acc;
      }, {} as Record<string, number>),
    [accounts],
  );

  const countByCurrency = useMemo(
    () =>
      accounts.reduce((acc, a) => {
        acc[a.currency] = (acc[a.currency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [accounts],
  );

  const openNewAccount = (currency?: string) => {
    const available = CURRENCIES.filter((c) => !countByCurrency[c.code]);
    if (available.length === 0) return;
    setNewCurrency(currency || available[0].code);
    setNewName('');
    setCreateError('');
    setShowNew(true);
  };

  const availableCurrencies = CURRENCIES.filter((c) => !countByCurrency[c.code]);

  const createAccount = async () => {
    setCreating(true);
    setCreateError('');
    try {
      await api.createAccount({
        currency: newCurrency,
        account_name: newName.trim() || undefined,
      });
      setShowNew(false);
      setNewName('');
      await load();
    } catch (e: any) {
      setCreateError(e?.message || 'The account could not be created.');
    } finally {
      setCreating(false);
    }
  };

  const primaryCurrency = accounts[0]?.currency || 'USD';
  const primaryBalance = totalByCurrency[primaryCurrency] || 0;

  const quickActions = [
    { icon: Send, label: 'Send', onClick: () => navigate('/transfers') },
    { icon: ArrowDownLeft, label: 'Deposit', onClick: () => navigate('/deposits') },
    { icon: Coins, label: 'Crypto', onClick: () => navigate('/crypto') },
    { icon: Plus, label: 'New account', onClick: () => openNewAccount(), disabled: availableCurrencies.length === 0 },
  ];

  return (
    <div className="finance-dashboard min-h-screen flex flex-col bg-[#f4f6f8]">
      <SkipLink />

      {/* ── Top bar ── */}
      <header
        className={cx(
          'fixed top-0 inset-x-0 z-header border-b transition-all duration-200',
          scrolled
            ? 'bg-[#0c1b33]/98 border-[#1a2d48] shadow-lg shadow-black/15 backdrop-blur-xl'
            : 'bg-[#0c1b33] border-transparent',
        )}
      >
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <Link
              to="/dashboard"
              aria-label="Finance Capital Florida home"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
            >
              <BrandLogo size={32} withWordmark light />
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link
                to="/profile"
                aria-label="Profile"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a05a] to-[#b68a45] flex items-center justify-center text-[#0c1b33] text-sm font-bold shadow-md shadow-amber-900/20 ring-2 ring-white/10"
              >
                {user?.full_name
                  ?.split(/\s+/)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '?'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(5rem+env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
      >
        {/* ── Greeting + total balance ── */}
        <section className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[13px] font-medium text-[#6b7c90]">
                {greeting}, {firstName}
              </p>
              <h1 className="mt-0.5 font-display text-[1.35rem] sm:text-2xl font-bold tracking-[-0.02em] text-[#0c1b33]">
                Your overview
              </h1>
            </div>
            <IconButton
              label={hideBalances ? 'Show balances' : 'Hide balances'}
              onClick={toggle}
              className="!bg-white !border !border-[#e2e8f0] !text-[#536277] hover:!bg-[#f8fafc] shadow-sm"
            >
              {hideBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </IconButton>
          </div>

          {/* Primary balance card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0c1b33] text-white shadow-[0_12px_40px_rgba(12,27,51,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_10%,rgba(182,138,69,0.22),transparent_55%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.03)_100%)]" />
            <div className="relative px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8b8cc]">
                Available balance · {primaryCurrency}
              </p>
              <p className="mt-2 text-[2rem] sm:text-[2.35rem] font-bold tracking-[-0.03em] tabular-nums leading-none">
                {maskBalance(formatMoney(primaryBalance, primaryCurrency), hideBalances)}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-[#d4dde8] ring-1 ring-white/10">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-[#d4dde8] ring-1 ring-white/10">
                  {Object.keys(totalByCurrency).length || 0} currenc
                  {Object.keys(totalByCurrency).length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5">
            <Alert tone="error" onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* ── Quick actions ── */}
        <section className="mb-7" aria-label="Quick actions">
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {quickActions.map(({ icon: Icon, label, onClick, disabled }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={cx(
                  'flex flex-col items-center gap-2 rounded-2xl border border-[#e6ebf1] bg-white px-2 py-3.5 sm:py-4',
                  'shadow-[0_1px_3px_rgba(12,27,51,0.04)] transition-all duration-150',
                  'hover:border-[#d4b06a]/50 hover:shadow-[0_4px_16px_rgba(12,27,51,0.08)]',
                  'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b68a45]/50',
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c1b33] text-white">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#0c1b33]">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Portfolio by currency ── */}
        <section className="mb-7" aria-labelledby="portfolio-heading">
          <SectionHeading id="portfolio-heading" title="Portfolio" icon={TrendingUp} />
          <div className="grid gap-3 sm:grid-cols-3">
            {CURRENCIES.map(({ code, label, flag }) => {
              const total = totalByCurrency[code] || 0;
              const count = countByCurrency[code] || 0;
              const meta = currencyMeta(code);
              return (
                <div
                  key={code}
                  className={cx(
                    'group relative rounded-2xl border border-[#e6ebf1] bg-white p-4',
                    'shadow-[0_1px_3px_rgba(12,27,51,0.04)] transition-all duration-150',
                    count > 0 && 'hover:border-[#d4b06a]/40 hover:shadow-[0_6px_20px_rgba(12,27,51,0.07)]',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f3f7] text-sm font-bold text-[#3d4f63] ring-1 ring-[#e2e8f0]">
                      {flag || code.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-[#6b7c90] truncate">{label}</p>
                      <p className="text-[1.05rem] font-bold tracking-tight tabular-nums text-[#0c1b33]">
                        {maskBalance(formatMoney(total, code), hideBalances)}
                      </p>
                    </div>
                    {count > 0 ? (
                      <span className="text-[11px] font-medium text-[#8a97a7] shrink-0">
                        {count} acct{count !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openNewAccount(code)}
                        className="text-[12px] font-semibold text-[#b68a45] hover:text-[#9c7138] shrink-0 transition"
                      >
                        Open →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Your accounts ── */}
        <section className="mb-7" aria-labelledby="accounts-heading">
          <SectionHeading
            id="accounts-heading"
            title="Your accounts"
            icon={Wallet}
            action={
              accounts.length > 0 ? (
                <span className="text-[12px] font-medium text-[#8a97a7]">{accounts.length} total</span>
              ) : undefined
            }
          />
          {loading ? (
            <SkeletonList count={3} />
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No accounts yet"
              description="Open your first account in sterling, dollars or euros."
              action={
                <Button onClick={() => openNewAccount()} leftIcon={<Plus className="w-4 h-4" />}>
                  Open your first account
                </Button>
              }
              hint="You can hold all three currencies at the same time."
            />
          ) : (
            <div className="space-y-2.5">
              {accounts.map((a) => (
                <AccountCard key={a.id} account={a} hideBalances={hideBalances} />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent activity ── */}
        {recentTx.length > 0 && (
          <section className="mb-6" aria-labelledby="activity-heading">
            <SectionHeading
              id="activity-heading"
              title="Recent activity"
              icon={Clock}
              action={
                accounts[0] ? (
                  <Link
                    to={`/account/${accounts[0].id}`}
                    className="text-[12px] font-semibold text-[#b68a45] hover:text-[#9c7138] transition"
                  >
                    View all →
                  </Link>
                ) : undefined
              }
            />
            <div className="overflow-hidden rounded-2xl border border-[#e6ebf1] bg-white shadow-[0_1px_3px_rgba(12,27,51,0.04)]">
              {recentTx.map((tx, i) => {
                const credit = isIncoming(tx);
                return (
                  <div
                    key={tx.id}
                    className={cx(
                      'flex items-center justify-between gap-3 px-4 py-3.5',
                      i !== recentTx.length - 1 && 'border-b border-[#f0f3f7]',
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cx(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          credit ? 'bg-emerald-50 text-emerald-600' : 'bg-[#f0f3f7] text-[#536277]',
                        )}
                      >
                        {credit ? (
                          <ArrowDownLeft className="h-4 w-4" strokeWidth={2.25} />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0c1b33] truncate">
                          {tx.description || titleCase((tx.type || '').replace(/_/g, ' '))}
                        </p>
                        <p className="text-[11px] text-[#8a97a7] mt-0.5">{formatRelativeDay(tx.created_at)}</p>
                      </div>
                    </div>
                    <p
                      className={cx(
                        'text-sm font-bold tabular-nums shrink-0',
                        credit ? 'text-emerald-600' : 'text-[#0c1b33]',
                      )}
                    >
                      {credit ? '+' : '−'}
                      {formatMoney(Math.abs(parseFloat(tx.amount)), tx.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="pt-4 pb-2 text-center">
          <p className="text-[11px] text-[#a0aab8]">
            © {new Date().getFullYear()} Finance Capital Florida
          </p>
        </footer>
      </main>

      {/* ── Bottom nav (structure preserved) ── */}
      <nav aria-label="Primary" className="finance-bottom-nav fixed bottom-0 inset-x-0 z-header">
        <div className="finance-bottom-nav-inner">
          <NavItem icon={Home} label="Home" active />
          <NavItem icon={CreditCard} label="Deposits" onClick={() => navigate('/deposits')} />
          <NavItem icon={ArrowLeftRight} label="Transfer" onClick={() => navigate('/transfers')} />
          <NavItem icon={Wallet} label="Crypto" onClick={() => navigate('/crypto')} />
          <NavItem icon={Menu} label="More" onClick={() => navigate('/profile')} />
        </div>
      </nav>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Open a new account"
        description="Choose a currency for your new account."
      >
        <div className="space-y-5">
          {createError && (
            <Alert tone="error" onDismiss={() => setCreateError('')}>
              {createError}
            </Alert>
          )}
          {availableCurrencies.length === 0 ? (
            <p className="text-sm text-slate-500">You already have accounts in all available currencies.</p>
          ) : (
            <>
              <Select label="Currency" value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)}>
                {availableCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Account name (optional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Everyday Checking"
                maxLength={80}
                hint="Leave blank and we will name it after the currency."
              />
            </>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={() => setShowNew(false)}>
            Cancel
          </Button>
          <Button onClick={createAccount} loading={creating} loadingLabel="Creating…" fullWidth>
            Create account
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('finance-bottom-nav-item', active && 'is-active')}
      aria-current={active ? 'page' : undefined}
    >
      <span className="finance-bottom-nav-icon">
        <Icon className="w-5 h-5" />
      </span>
      <span>{label}</span>
      {active && <span className="finance-bottom-nav-dot" aria-hidden="true" />}
    </button>
  );
}

function AccountCard({ account, hideBalances }: { account: Account; hideBalances: boolean }) {
  const meta = currencyMeta(account.currency);
  return (
    <Link
      to={`/account/${account.id}`}
      className={cx(
        'group flex items-center justify-between gap-4 rounded-2xl border border-[#e6ebf1] bg-white px-4 py-4',
        'shadow-[0_1px_3px_rgba(12,27,51,0.04)] transition-all duration-150',
        'hover:border-[#d4b06a]/45 hover:shadow-[0_6px_20px_rgba(12,27,51,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b68a45]/50',
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a05a] to-[#b68a45] text-[#0c1b33] text-lg font-bold shadow-md shadow-amber-900/10">
          {meta.symbol}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[#0c1b33] truncate group-hover:text-[#7d5730] transition">
            {titleCase(account.account_name || `${account.currency} Account`)}
          </p>
          <p className="mt-0.5 font-mono text-[12px] text-[#8a97a7] tracking-wide">
            {maskAccountNumber(account.account_number)}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold tabular-nums text-[#0c1b33] text-[15px]">
          {maskBalance(formatMoney(account.balance, account.currency), hideBalances)}
        </p>
        <div className="mt-1.5 flex justify-end">
          <StatusBadge status={account.status} locked={account.is_locked} />
        </div>
      </div>
    </Link>
  );
}
