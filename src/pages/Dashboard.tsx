import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatMoney } from '../lib/api';
import { CURRENCIES, currencyMeta } from '../lib/currencies';
import { maskAccountNumber, maskBalance, titleCase, formatRelativeDay } from '../lib/format';
import { useBalanceVisibility } from '../hooks/useBalanceVisibility';
import {
  Alert, Button, EmptyState, IconButton, Input, Modal, SectionHeading,
  Select, SkeletonList, SkipLink, StatusBadge,
} from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { cx } from '../lib/designTokens';
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Clock, CreditCard, Eye, EyeOff,
  Home, LogOut, Menu, Plus, Search, Send, Wallet, Coins, ChevronRight,
  MessageCircle, X, type LucideIcon,
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

function last4(num?: string) {
  if (!num) return '····';
  const d = String(num).replace(/\D/g, '');
  return d.slice(-4).padStart(4, '·') || '····';
}

export default function Dashboard() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { hideBalances, toggle } = useBalanceVisibility();

  const fullName = user?.full_name || 'Client';

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

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        (a.account_name || '').toLowerCase().includes(q) ||
        (a.currency || '').toLowerCase().includes(q) ||
        (a.account_number || '').includes(q),
    );
  }, [accounts, search]);

  const handleLogout = () => {
    try {
      if (typeof logout === 'function') logout();
      else {
        localStorage.removeItem('token');
        localStorage.removeItem('fc_token');
      }
    } catch {
      /* silent */
    }
    navigate('/login');
  };

  return (
    <div className="fc-boa min-h-screen flex flex-col bg-[#f0f2f5] text-[#0c1b33]">
      <SkipLink />

      <header className="sticky top-0 z-50 bg-white border-b border-[#e5e8ed]">
        <div className="mx-auto max-w-lg px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex flex-col items-center gap-0.5 text-[#0c1b33] min-w-[44px] min-h-[44px] justify-center"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" strokeWidth={1.75} />
            <span className="text-[10px] font-medium leading-none">Menu</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="relative flex flex-col items-center gap-0.5 text-[#0c1b33] min-w-[44px] min-h-[44px] justify-center"
              aria-label="Inbox"
            >
              <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
              <span className="text-[10px] font-medium leading-none">Inbox</span>
            </button>
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <NotificationBell />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-col items-center gap-0.5 text-[#0c1b33] min-w-[44px] min-h-[44px] justify-center"
              aria-label="Log out"
            >
              <LogOut className="w-6 h-6" strokeWidth={1.75} />
              <span className="text-[10px] font-medium leading-none">Log Out</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 flex">
          <button
            type="button"
            className="flex-1 py-3 text-center text-[15px] font-semibold text-[#0c1b33] border-b-[3px] border-[#b68a45]"
          >
            Accounts
          </button>
          <button
            type="button"
            onClick={() => {
              document.getElementById('activity-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-1 py-3 text-center text-[15px] font-medium text-[#6b7c90] border-b-[3px] border-transparent hover:text-[#0c1b33] transition"
          >
            Activity
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[78%] max-w-[300px] bg-white shadow-2xl flex flex-col">
            <div className="px-5 pt-6 pb-4 border-b border-[#e5e8ed] flex items-center justify-between">
              <BrandLogo size={32} withWordmark />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close" className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-2">
              {[
                { label: 'Accounts', to: '/dashboard' },
                { label: 'Transfers', to: '/transfers' },
                { label: 'Deposits', to: '/deposits' },
                { label: 'Crypto', to: '/crypto' },
                { label: 'Profile & Settings', to: '/profile' },
              ].map((item) => (
                <button
                  key={item.to}
                  type="button"
                  className="w-full text-left px-5 py-3.5 text-[15px] font-medium text-[#0c1b33] hover:bg-[#f5f7fa]"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.to);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-[#e5e8ed]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl bg-[#0c1b33] text-white py-3 text-sm font-semibold"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1 mx-auto w-full max-w-lg px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a97a7]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="How can we help?"
              className="w-full h-11 rounded-full bg-[#e8eaee] border-0 pl-10 pr-4 text-[14px] text-[#0c1b33] placeholder:text-[#8a97a7] focus:outline-none focus:ring-2 focus:ring-[#b68a45]/40"
            />
          </div>
          <button
            type="button"
            onClick={toggle}
            className="relative shrink-0 w-11 h-11 rounded-full bg-[#0c1b33] text-white flex items-center justify-center shadow-md"
            aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
            title={hideBalances ? 'Show balances' : 'Hide balances'}
          >
            {hideBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert tone="error" onDismiss={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#e5e8ed] shadow-[0_2px_8px_rgba(12,27,51,0.04)] mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#fafbfc] transition"
          >
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-[#0c1b33] truncate">Hello, {fullName}</p>
              <p className="text-[12px] text-[#6b7c90] mt-0.5">Finance Capital Florida client</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8a97a7] shrink-0" />
          </button>
          <div className="h-px bg-[#eef0f3]" />
          <button
            type="button"
            onClick={() => navigate('/transfers')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#fafbfc] transition"
          >
            <span className="w-8 h-8 rounded-full bg-[#f5f0e6] text-[#b68a45] flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[#0c1b33]">Transfers</p>
              <p className="text-[12px] text-[#6b7c90]">Send money across your accounts</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8a97a7] shrink-0" />
          </button>
          <div className="h-px bg-[#eef0f3]" />
          <button
            type="button"
            onClick={() => navigate('/deposits')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#fafbfc] transition"
          >
            <span className="w-8 h-8 rounded-full bg-[#eef6f3] text-[#16805a] flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[#0c1b33]">Deposits</p>
              <p className="text-[12px] text-[#6b7c90]">Request funds into your accounts</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8a97a7] shrink-0" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e8ed] shadow-[0_2px_12px_rgba(12,27,51,0.06)] overflow-hidden mb-4">
          <div className="bg-[#0c1b33] px-4 py-3.5 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#b68a45] text-[#0c1b33] text-xs font-bold flex items-center justify-center">
              FC
            </span>
            <p className="text-white text-[17px] font-bold tracking-tight">
              Finance Capital <span className="text-[#d3b06f]">Florida</span>
            </p>
          </div>

          {loading ? (
            <div className="p-4">
              <SkeletonList count={2} />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Wallet}
                title={search ? 'No matching accounts' : 'No accounts yet'}
                description={
                  search
                    ? 'Try a different search term.'
                    : 'Open your first account in sterling, dollars or euros.'
                }
                action={
                  !search && availableCurrencies.length > 0 ? (
                    <Button onClick={() => openNewAccount()} leftIcon={<Plus className="w-4 h-4" />}>
                      Open your first account
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-[#eef0f3]">
              {filteredAccounts.map((a) => {
                const name = titleCase(a.account_name || `${a.currency} Account`);
                return (
                  <li key={a.id}>
                    <div className="px-4 py-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-[#6b7c90] leading-snug">
                          {name} – {last4(a.account_number)}
                        </p>
                        <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-[#0c1b33] leading-none">
                          {maskBalance(formatMoney(a.balance, a.currency), hideBalances)}
                        </p>
                        {a.is_locked && (
                          <div className="mt-2">
                            <StatusBadge status={a.status} locked={a.is_locked} />
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/account/${a.id}`}
                        className="shrink-0 mt-1 inline-flex items-center justify-center h-9 px-4 rounded-full border border-[#cfd5de] bg-white text-[13px] font-semibold text-[#0c1b33] hover:border-[#b68a45] hover:text-[#7d5730] transition"
                      >
                        VIEW
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-[#eef0f3] px-4 py-3.5 text-center">
            <button
              type="button"
              onClick={() => openNewAccount()}
              disabled={availableCurrencies.length === 0}
              className="text-[14px] font-bold tracking-wide text-[#0c1b33] hover:text-[#b68a45] disabled:opacity-40 disabled:pointer-events-none transition uppercase"
            >
              Open new account
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e8ed] shadow-[0_2px_8px_rgba(12,27,51,0.04)] overflow-hidden mb-5 flex">
          <div className="w-[38%] bg-gradient-to-br from-[#0c1b33] to-[#1a2d48] p-4 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d3b06f]">Multi-currency</p>
            <p className="mt-1 text-white text-[15px] font-bold leading-snug">Hold USD, GBP &amp; EUR in one place</p>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center">
            <p className="text-[15px] font-bold text-[#0c1b33]">Stay in control</p>
            <p className="text-[12px] text-[#6b7c90] mt-1 leading-snug">
              Transfers, deposits and full history — designed to stay clear.
            </p>
            <button
              type="button"
              onClick={() => navigate('/transfers')}
              className="mt-3 self-start h-9 px-4 rounded-md bg-[#b68a45] text-white text-[13px] font-bold hover:bg-[#9c7138] transition"
            >
              Transfer now
            </button>
          </div>
        </div>

        {recentTx.length > 0 && (
          <section id="activity-section" className="mb-4">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h2 className="text-[15px] font-bold text-[#0c1b33]">Recent activity</h2>
              {accounts[0] && (
                <Link
                  to={`/account/${accounts[0].id}`}
                  className="text-[12px] font-semibold text-[#b68a45] hover:text-[#9c7138]"
                >
                  View all
                </Link>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e8ed] overflow-hidden divide-y divide-[#eef0f3]">
              {recentTx.map((tx) => {
                const credit = isIncoming(tx);
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
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

        <p className="text-center text-[11px] text-[#a0aab8] py-2">
          © {new Date().getFullYear()} Finance Capital Florida
        </p>
      </main>

      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#e5e8ed] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-lg grid grid-cols-5 h-[64px]">
          <BottomItem icon={Home} label="Accounts" active />
          <BottomItem icon={ArrowLeftRight} label="Transfer" onClick={() => navigate('/transfers')} />
          <BottomItem icon={CreditCard} label="Deposit" onClick={() => navigate('/deposits')} />
          <BottomItem icon={Coins} label="Crypto" onClick={() => navigate('/crypto')} />
          <BottomItem icon={Wallet} label="More" onClick={() => navigate('/profile')} />
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

function BottomItem({
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
      className={cx(
        'flex flex-col items-center justify-center gap-1 min-h-[44px]',
        active ? 'text-[#0c1b33]' : 'text-[#6b7c90]',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={cx('w-[22px] h-[22px]', active && 'text-[#b68a45]')} strokeWidth={active ? 2.25 : 1.75} />
      <span className={cx('text-[10px] leading-none', active ? 'font-bold' : 'font-medium')}>{label}</span>
    </button>
  );
}
