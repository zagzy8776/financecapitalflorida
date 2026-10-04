import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Alert, Button, Input } from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is invalid or incomplete. Request a new one from the sign-in page.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword({ token, new_password: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err?.message || 'Could not reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <BrandLogo size={36} withWordmark />
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5e8ed] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(12,27,51,0.06)]">
          <div className="flex items-start gap-3 mb-6">
            <span className="w-11 h-11 rounded-xl bg-[#0c1b33] text-white flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-[#0c1b33] tracking-tight">Choose a new password</h1>
              <p className="mt-1 text-sm text-[#6b7c90] leading-relaxed">
                Create a strong password for your Finance Capital Florida account. You will use it the next
                time you sign in.
              </p>
            </div>
          </div>

          {!token && (
            <Alert tone="error">
              Missing reset token. Open the link from your email, or{' '}
              <Link to="/forgot-password" className="underline font-medium">
                request a new link
              </Link>
              .
            </Alert>
          )}

          {done ? (
            <div className="space-y-4">
              <Alert tone="success">Password updated. Redirecting you to sign in…</Alert>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <ShieldCheck className="w-4 h-4" /> Your account is secured with the new password.
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              {error && (
                <Alert tone="error" onDismiss={() => setError('')}>
                  {error}
                </Alert>
              )}
              <Input
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
              />
              <Input
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat new password"
                required
              />
              <Button type="submit" loading={busy} fullWidth disabled={!token}>
                Update password
              </Button>
              <p className="text-center text-sm text-[#6b7c90]">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 font-medium text-[#0c1b33] hover:text-[#b68a45]"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
