import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type OtpChallenge } from '../context/AuthContext';
import { Alert, Button, Input, SkipLink } from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { passwordStrength, validateAuth, type FieldErrors } from '../lib/validation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Globe2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';

type SignupStep = 'credentials' | 'personal';

const TRUSTED_KEY = 'rubicon_trusted_device';
const REMEMBER_EMAIL_KEY = 'rubicon_remember_email';
const TRUST_DAYS = 30;

const COUNTRIES = [
  { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' },
  { code: 'IE', label: 'Ireland' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'SG', label: 'Singapore' },
  { code: 'OTHER', label: 'Other' },
];

function loadTrusted(): { email: string; until: number } | null {
  try {
    const raw = localStorage.getItem(TRUSTED_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.email || !data?.until || Date.now() > data.until) {
      localStorage.removeItem(TRUSTED_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveTrusted(email: string) {
  localStorage.setItem(
    TRUSTED_KEY,
    JSON.stringify({
      email: email.toLowerCase(),
      until: Date.now() + TRUST_DAYS * 24 * 60 * 60 * 1000,
    }),
  );
}

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { login, register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('GB');
  const [address, setAddress] = useState('');
  const [signupStep, setSignupStep] = useState<SignupStep>('credentials');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors<'fullName' | 'email' | 'password'>>({});
  const [confirmErr, setConfirmErr] = useState('');
  const [personalErr, setPersonalErr] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState('');

  const isSignup = mode === 'signup';
  const values = useMemo(() => ({ fullName, email, password }), [fullName, email, password]);
  const strength = useMemo(() => passwordStrength(password), [password]);

  useEffect(() => {
    if (!isSignup) {
      const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (remembered) {
        setEmail(remembered);
        setRememberDevice(true);
      }
    }
  }, [isSignup]);

  const goPersonalStep = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setConfirmErr('');
    const nextErrors = validateAuth('signup', values);
    setErrors(nextErrors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    if (password !== confirmPassword) {
      setConfirmErr('Passwords do not match.');
      return;
    }

    if (Object.keys(nextErrors).length > 0) return;
    setSignupStep('personal');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const nextErrors = validateAuth(mode, values);
    setErrors(nextErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const trusted = loadTrusted();
      const skipOtpHint =
        rememberDevice && !!trusted && trusted.email === email.trim().toLowerCase();

      const ch = await login(email.trim(), password, { trust_device: skipOtpHint });

      if (ch) {
        setChallenge(ch);
        setOtpCode('');
      } else {
        if (rememberDevice) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
          saveTrusted(email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
          localStorage.removeItem(TRUSTED_KEY);
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      setFormError(err?.message || 'We could not complete that request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalErr('');
    setFormError('');

    if (!phone.trim() || phone.trim().replace(/\D/g, '').length < 7) {
      setPersonalErr('Enter a valid phone number including country code.');
      return;
    }

    if (!dateOfBirth) {
      setPersonalErr('Enter your date of birth.');
      return;
    }

    const dob = new Date(dateOfBirth);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    if (!Number.isFinite(age) || age < 18) {
      setPersonalErr('You must be at least 18 years old to open an account.');
      return;
    }

    if (!address.trim() || address.trim().length < 8) {
      setPersonalErr('Enter your residential address.');
      return;
    }

    if (!country) {
      setPersonalErr('Select your country of residence.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim(), {
        phone: phone.trim(),
        date_of_birth: dateOfBirth,
        address: address.trim(),
        country,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err?.message || 'We could not create your login. Please try again.');
      setSignupStep('credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;

    setFormError('');
    const clean = otpCode.replace(/\s/g, '');

    if (!/^\d{6}$/.test(clean)) {
      setFormError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(challenge.challenge_id, clean);

      if (rememberDevice) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
        saveTrusted(email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
        localStorage.removeItem(TRUSTED_KEY);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err?.message || 'Incorrect or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!challenge) return;

    setResendBusy(true);
    setResendNote('');
    setFormError('');

    try {
      const next = await resendOtp(challenge.challenge_id);
      setChallenge(next);
      setResendNote('A new verification code was sent to your email.');
    } catch (err: any) {
      setFormError(err?.message || 'Could not resend the code.');
    } finally {
      setResendBusy(false);
    }
  };

  const title = challenge
    ? 'Verify your sign in'
    : isSignup
      ? signupStep === 'personal'
        ? 'Your personal details'
        : 'Create your client login'
      : 'Welcome back';

  const subtitle = challenge
    ? undefined
    : isSignup
      ? signupStep === 'personal'
        ? 'A few details help us set up your client profile securely.'
        : 'Create one secure login for your Finance Capital Florida relationship.'
      : 'Sign in securely to view your accounts, balances, and activity.';

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <SkipLink />

      <main id="main-content" className="min-h-screen lg:grid lg:grid-cols-[minmax(380px,0.88fr)_minmax(520px,1.12fr)]">
        <aside className="relative hidden overflow-hidden bg-[#10243f] text-white lg:flex lg:min-h-screen lg:flex-col lg:justify-between p-10 xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(182,138,69,.22),transparent_34%),radial-gradient(circle_at_80%_85%,rgba(255,255,255,.07),transparent_35%)]" />
          <div className="absolute -right-28 top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-16 top-36 h-48 w-48 rounded-full border border-[#b68a45]/25" />

          <div className="relative">
            <BrandLogo size={44} withWordmark light />
            <div className="mt-20 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-[#d3b06f]" />
                Secure client access
              </div>
              <h1 className="mt-6 font-['Manrope'] text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
                Your finances, clearly connected.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
                A focused client portal for viewing account balances, moving money, reviewing activity,
                and managing your relationship with Finance Capital Florida.
              </p>
            </div>
          </div>

          <div className="relative grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <BarChart3 className="h-5 w-5 text-[#d3b06f]" />
              <p className="mt-4 text-sm font-semibold">Account visibility</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Balances and activity in one place.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <Building2 className="h-5 w-5 text-[#d3b06f]" />
              <p className="mt-4 text-sm font-semibold">Client-first service</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Designed for a calm, clear experience.</p>
            </div>
          </div>

          <p className="relative mt-10 text-xs text-slate-500">
            Finance Capital Florida · Secure client portal
          </p>
        </aside>

        <section className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-5 py-6 sm:px-8 lg:hidden">
            <BrandLogo size={38} withWordmark />
            <Link
              to="/"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-[#10243f]"
            >
              Website
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-8 sm:py-12">
            <div className="w-full max-w-xl">
              <div className="mb-6 hidden lg:block">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#10243f]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to website
                </Link>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(16,36,63,.10)] sm:p-8 lg:p-10">
                {challenge ? (
                  <>
                    <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10243f] text-[#d3b06f]">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <h2 className="font-['Manrope'] text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                      {title}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      We sent a 6-digit verification code to{' '}
                      <span className="font-semibold text-slate-700">{challenge.email_hint}</span>.
                    </p>

                    <form onSubmit={handleOtpSubmit} className="mt-7 space-y-5">
                      {formError && <Alert tone="error">{formError}</Alert>}
                      {resendNote && <Alert tone="success">{resendNote}</Alert>}

                      <Input
                        label="Verification code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        required
                        leadingIcon={<KeyRound className="h-4 w-4" />}
                        className="bg-white text-slate-900 placeholder:text-slate-400"
                      />

                      <Button type="submit" loading={loading} fullWidth>
                        Verify and sign in <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>

                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendBusy}
                        className="w-full text-sm font-medium text-[#9a702f] transition-colors hover:text-[#7f5b22] disabled:opacity-50"
                      >
                        {resendBusy ? 'Sending…' : 'Resend verification code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setChallenge(null);
                          setOtpCode('');
                          setFormError('');
                        }}
                        className="w-full text-sm text-slate-500 transition-colors hover:text-slate-800"
                      >
                        Use a different email
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a702f]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#b68a45]" />
                          Client portal
                        </div>
                        <h2 className="font-['Manrope'] text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                          {title}
                        </h2>
                        {subtitle && (
                          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{subtitle}</p>
                        )}
                      </div>

                      {isSignup && (
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Step
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-700">
                            {signupStep === 'credentials' ? '01' : '02'} / 02
                          </p>
                        </div>
                      )}
                    </div>

                    {isSignup && (
                      <div className="mt-7 flex gap-2" aria-label="Sign-up progress">
                        <div className="h-1.5 flex-1 rounded-full bg-[#b68a45]" />
                        <div
                          className={`h-1.5 flex-1 rounded-full ${signupStep === 'personal' ? 'bg-[#b68a45]' : 'bg-slate-200'}`}
                        />
                      </div>
                    )}

                    {isSignup && signupStep === 'credentials' && (
                      <form onSubmit={goPersonalStep} className="mt-7 space-y-5">
                        {formError && <Alert tone="error">{formError}</Alert>}

                        <Input
                          label="Full legal name"
                          autoComplete="name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          required
                          leadingIcon={<User className="h-4 w-4" />}
                          error={touched.fullName ? errors.fullName : undefined}
                        />
                        <Input
                          label="Email address"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          leadingIcon={<Mail className="h-4 w-4" />}
                          error={touched.email ? errors.email : undefined}
                        />
                        <Input
                          label="Password"
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          required
                          revealable
                          leadingIcon={<Lock className="h-4 w-4" />}
                          error={touched.password ? errors.password : undefined}
                        />

                        {password.length > 0 && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-medium text-slate-600">Password strength</span>
                              <span className="text-xs font-semibold text-slate-500">{strength.label}</span>
                            </div>
                            <div className="mt-2 flex gap-1.5" aria-hidden="true">
                              {[0, 1, 2, 3].map((bar) => (
                                <span
                                  key={bar}
                                  className={`h-1.5 flex-1 rounded-full ${bar < strength.score ? 'bg-[#b68a45]' : 'bg-slate-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <Input
                          label="Confirm password"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          required
                          revealable
                          leadingIcon={<Lock className="h-4 w-4" />}
                          error={confirmErr || undefined}
                        />

                        <Button type="submit" fullWidth>
                          Continue <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </form>
                    )}

                    {isSignup && signupStep === 'personal' && (
                      <form onSubmit={handleSignupFinish} className="mt-7 space-y-5">
                        {(personalErr || formError) && (
                          <Alert tone="error">{personalErr || formError}</Alert>
                        )}

                        <Input
                          label="Mobile phone"
                          type="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+44 7700 900000"
                          required
                          leadingIcon={<Phone className="h-4 w-4" />}
                          hint="Include your country code."
                        />

                        <Input
                          label="Date of birth"
                          type="date"
                          autoComplete="bday"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          required
                          leadingIcon={<Calendar className="h-4 w-4" />}
                          hint="You must be 18 or older."
                        />

                        <div className="space-y-1.5">
                          <label className="block text-label text-slate-700">Country of residence<span className="ml-1 text-[#b68a45]" aria-hidden="true">*</span></label>
                          <div className="relative">
                            <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              required
                              className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#b68a45] focus:ring-2 focus:ring-[#b68a45]/20"
                            >
                              {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <Input
                          label="Residential address"
                          autoComplete="street-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street, city, postcode"
                          required
                          leadingIcon={<MapPin className="h-4 w-4" />}
                        />

                        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <p className="text-xs leading-5 text-slate-500">
                            Your details are used to create your client profile. After registration, you can
                            sign in and request the currency accounts available to you.
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setSignupStep('credentials');
                              setPersonalErr('');
                            }}
                          >
                            <ArrowLeft className="mr-1 h-4 w-4" /> Back
                          </Button>
                          <Button type="submit" loading={loading} fullWidth>
                            Create login <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    )}

                    {!isSignup && (
                      <form onSubmit={handlePasswordSubmit} className="mt-7 space-y-5">
                        {formError && <Alert tone="error">{formError}</Alert>}

                        <Input
                          label="Email address"
                          type="email"
                          autoComplete="username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          leadingIcon={<Mail className="h-4 w-4" />}
                          error={touched.email ? errors.email : undefined}
                        />

                        <Input
                          label="Password"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          revealable
                          leadingIcon={<Lock className="h-4 w-4" />}
                          error={touched.password ? errors.password : undefined}
                        />

                        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                          <label className="flex cursor-pointer items-center gap-2.5 select-none">
                            <input
                              type="checkbox"
                              checked={rememberDevice}
                              onChange={(e) => setRememberDevice(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-[#b68a45] accent-[#b68a45] focus:ring-[#b68a45]/30"
                            />
                            <span className="text-sm text-slate-600">Remember this device</span>
                          </label>
                          <Link
                            to="/forgot-password"
                            className="text-sm font-semibold text-[#9a702f] transition-colors hover:text-[#7f5b22]"
                          >
                            Forgot password?
                          </Link>
                        </div>

                        <Button type="submit" loading={loading} fullWidth>
                          Sign in securely <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </form>
                    )}

                    <div className="mt-7 flex items-start gap-2 border-t border-slate-100 pt-5">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-xs leading-5 text-slate-500">
                        Never share your password or verification code. Finance Capital Florida will not ask
                        for either by email or phone.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {!challenge && (
                <p className="mt-6 text-center text-sm text-slate-500">
                  {isSignup ? (
                    <>
                      Already have a client login?{' '}
                      <Link to="/login" className="font-semibold text-[#9a702f] hover:text-[#7f5b22]">
                        Sign in
                      </Link>
                    </>
                  ) : (
                    <>
                      New to Finance Capital Florida?{' '}
                      <Link to="/signup" className="font-semibold text-[#9a702f] hover:text-[#7f5b22]">
                        Create a login
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
