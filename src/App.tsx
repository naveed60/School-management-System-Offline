import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  completeSetup,
  createBackup,
  currentSession,
  getAppInfo,
  getSetupStatus,
  isTauriRuntime,
  login,
  logout,
  restoreBackup,
  type AppInfo,
  type Session,
  type SetupStatus,
} from './lib/tauri'

function App() {
  const native = isTauriRuntime()
  const setup = useQuery<SetupStatus>({
    queryKey: ['setup-status'],
    queryFn: getSetupStatus,
    enabled: native,
    retry: false,
  })
  const session = useQuery<Session | null>({
    queryKey: ['session'],
    queryFn: currentSession,
    enabled: native && setup.data?.setupComplete === true,
    retry: false,
  })

  if (!native) return <LandingPage />
  if (setup.isPending) return <RuntimeGate title="Preparing your school workspace" copy="Opening the local database and checking its schema…" />
  if (setup.isError) return <RuntimeGate title="Workspace unavailable" copy={setup.error instanceof Error ? setup.error.message : 'The local database could not be opened.'} />
  if (!setup.data?.setupComplete) return <SetupWizard onComplete={async () => { await setup.refetch(); await session.refetch() }} />
  if (session.isPending) return <RuntimeGate title="Checking your session" copy="Loading your local account…" />
  if (session.isError) return <RuntimeGate title="Session unavailable" copy={session.error instanceof Error ? session.error.message : 'Could not read the local session.'} />
  if (!session.data) return <LoginScreen onLoggedIn={() => { void session.refetch() }} />
  return <Workspace session={session.data} onLogout={async () => { await logout(); await session.refetch() }} />
}

function LandingPage() {
  const appInfo = useQuery<AppInfo>({
    queryKey: ['app-info'],
    queryFn: getAppInfo,
    enabled: isTauriRuntime(),
    retry: false,
  })

  const runtimeLabel = !isTauriRuntime()
    ? 'Browser preview'
    : appInfo.isPending
      ? 'Connecting to desktop'
      : appInfo.isError
        ? 'Desktop bridge unavailable'
        : `Desktop v${appInfo.data?.appVersion ?? '0.1.0'}`

  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfdff] text-[#102a43]">
      <header className="relative z-20 border-b border-[#e8f0f7] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-3" aria-label="SchoolFlow home">
            <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#0d4f82] text-white shadow-lg shadow-[#0d4f82]/20">
              <BookIcon />
            </span>
            <span>
              <span className="block text-[15px] font-extrabold tracking-tight text-[#102a43]">SchoolFlow</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d8aa3]">Offline workspace</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#6d8aa3] lg:flex" aria-label="Primary navigation">
            <a className="transition-colors hover:text-[#0d4f82]" href="#overview">Overview</a>
            <a className="transition-colors hover:text-[#0d4f82]" href="#modules">Modules</a>
            <a className="transition-colors hover:text-[#0d4f82]" href="#security">Security</a>
            <a className="transition-colors hover:text-[#0d4f82]" href="#support">Support</a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#d8eee2] bg-[#f2fbf5] px-3 py-2 text-xs font-bold text-[#328456] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#4ac477] shadow-[0_0_0_4px_rgba(74,196,119,0.13)]" />
              Works offline
            </span>
            <a href="#modules" className="rounded-xl bg-[#0d4f82] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0d4f82]/20 transition hover:-translate-y-0.5 hover:bg-[#0a416c]">
              Explore workspace
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section id="overview" className="relative isolate">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden">
            <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#fff3c9]/60 blur-3xl" />
            <div className="absolute right-0 top-10 h-[520px] w-[520px] rounded-full bg-[#e7f4ff] blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:px-12 lg:pb-28 lg:pt-20">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9eaf6] bg-white px-3 py-2 text-xs font-bold text-[#3c7198] shadow-sm">
                <SparkIcon />
                Calm tools for busy school teams
              </div>
              <h1 className="max-w-[620px] text-[clamp(2.7rem,6vw,5.25rem)] font-black leading-[0.98] tracking-[-0.055em] text-[#102a43]">
                Make every school day feel <span className="relative inline-block text-[#0d70ac]">lighter.<span className="absolute -bottom-1 left-1 h-2 w-[92%] -rotate-2 rounded-full bg-[#ffd166]/70" /></span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-[#6d8aa3] sm:text-lg">
                One beautiful, offline-first workspace for student records, attendance, fees and reports—designed to keep your team focused on people, not paperwork.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#modules" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0d4f82] px-5 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-[#0d4f82]/20 transition hover:-translate-y-1 hover:bg-[#0a416c]">
                  See what&apos;s inside
                  <ArrowIcon className="transition-transform group-hover:translate-x-1" />
                </a>
                <a href="#security" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8e7f2] bg-white px-5 py-3.5 text-sm font-extrabold text-[#275777] shadow-sm transition hover:-translate-y-1 hover:border-[#b9d4e6]">
                  <ShieldIcon />
                  Built for privacy
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-[#6d8aa3]">
                <span className="inline-flex items-center gap-2"><CheckIcon /> No internet required</span>
                <span className="inline-flex items-center gap-2"><CheckIcon /> Fast on everyday hardware</span>
              </div>
            </div>

            <div className="hero-visual relative mx-auto h-[430px] w-full max-w-[650px] sm:h-[500px] lg:h-[560px]" aria-label="Students learning together in a bright modern classroom">
              <div className="hero-blob absolute inset-x-0 top-6 h-[360px] rounded-[46%_54%_48%_52%/42%_39%_61%_58%] bg-[#e8f5ff] sm:h-[420px] lg:top-8 lg:h-[470px]" />
              <img className="hero-scene absolute inset-0 h-full w-full rounded-[42%_58%_45%_55%/38%_44%_56%_62%] object-cover object-[68%_center] shadow-[0_26px_60px_rgba(38,93,130,0.15)]" src="/images/school-study-hero.png" alt="Students learning together in a bright modern classroom" />
              <div className="pointer-events-none absolute inset-0 rounded-[42%_58%_45%_55%/38%_44%_56%_62%] bg-gradient-to-r from-[#e8f5ff]/80 via-transparent to-transparent" />
              <div className="absolute left-[5%] top-[13%] h-4 w-4 rounded-full bg-[#ffd166] shadow-[0_0_0_8px_rgba(255,209,102,0.2)]" />
              <div className="absolute right-[8%] top-[17%] flex flex-col gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#91bfe0]" /><span className="h-2.5 w-2.5 rounded-full bg-[#91bfe0]" /><span className="h-2.5 w-2.5 rounded-full bg-[#91bfe0]" /></div>
            </div>
          </div>
        </section>

        <section id="modules" className="border-y border-[#e8f0f7] bg-white"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#4b9ccc]">One workspace, every workflow</p><h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.04em] text-[#102a43] sm:text-4xl">The details are handled, so your people can shine.</h2></div><p className="max-w-sm text-sm leading-6 text-[#7891a5]">Simple enough for a busy morning. Powerful enough to keep years of school history organized.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><FeatureCard icon={<UsersIcon />} title="Student records" copy="Admissions, guardians, documents and enrollment history in one clear view." accent="blue" /><FeatureCard icon={<CalendarIcon />} title="Attendance" copy="Fast daily marking, leave tracking and reliable class-level insights." accent="yellow" /><FeatureCard icon={<WalletIcon />} title="Fees & reports" copy="Receipts, balances and polished reports that make every number easy to trust." accent="green" /><FeatureCard icon={<SettingsIcon />} title="Made for your school" copy="Roles, settings, backups and workflows that adapt as your school grows." accent="purple" /></div></div></section>

        <section id="security" className="bg-[#f4f9fd]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-12 lg:py-20"><div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dff2ff] text-[#0d70ac]"><ShieldIcon /></div><h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#102a43] sm:text-4xl">Your school data stays close.</h2><p className="mt-4 max-w-md text-sm leading-7 text-[#7891a5]">SchoolFlow is designed for dependable offline work, with a clear backup path and a secure native desktop boundary.</p></div><div className="grid gap-3 sm:grid-cols-2"><SecurityItem title="Offline by default" copy="Keep teaching and administering even when the connection drops." /><SecurityItem title="Role-aware access" copy="Give each team member exactly the tools they need." /><SecurityItem title="Backup-ready" copy="Create portable, verifiable backups before the busy moments." /><SecurityItem title="Built to stay fast" copy="A focused desktop app that feels responsive on everyday hardware." /></div></div></section>

        <section id="support" className="bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#4b9ccc]">Foundation status</p><p className="mt-2 text-sm font-semibold text-[#6d8aa3]">The workspace is ready for its database and first-run setup.</p></div><div className="inline-flex items-center gap-3 self-start rounded-2xl border border-[#e0edf5] bg-[#f9fcff] px-4 py-3 text-xs font-bold text-[#52738d] md:self-auto"><span className={`h-2.5 w-2.5 rounded-full ${appInfo.isError ? 'bg-[#e88c7c]' : 'bg-[#4ac477]'}`} />{runtimeLabel}</div></div></section>
      </main>

      <footer className="border-t border-[#e8f0f7] bg-[#fbfdff]"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-xs font-semibold text-[#91a8b9] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>© 2026 SchoolFlow. Built for calmer school days.</span><span>React · Tauri · Rust · SQLite</span></div></footer>
    </div>
  )
}

function RuntimeGate({ title, copy }: { title: string; copy: string }) {
  return <div className="grid min-h-screen place-items-center bg-[#f4f9fd] px-6 text-[#102a43]"><div className="w-full max-w-md rounded-3xl border border-[#dcebf5] bg-white p-8 text-center shadow-[0_20px_60px_rgba(42,86,115,0.1)]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0d4f82] text-white"><BookIcon /></span><h1 className="mt-5 text-2xl font-black">{title}</h1><p className="mt-2 text-sm leading-6 text-[#6d8aa3]">{copy}</p></div></div>
}

function SetupWizard({ onComplete }: { onComplete: () => Promise<void> }) {
  const [form, setForm] = useState({ schoolName: '', country: 'Pakistan', timezone: 'Asia/Karachi', currency: 'PKR', adminName: '', adminEmail: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const fieldError = (key: keyof typeof form, values = form) => {
    if (key === 'schoolName' && values.schoolName.trim().length < 2) return 'Enter your school name (at least 2 characters).'
    if (key === 'country' && !values.country.trim()) return 'Country is required.'
    if (key === 'currency' && !/^[A-Za-z]{3}$/.test(values.currency.trim())) return 'Use a 3-letter currency code, for example PKR.'
    if (key === 'adminName' && values.adminName.trim().length < 2) return 'Enter the administrator’s name (at least 2 characters).'
    if (key === 'adminEmail' && !/^\S+@\S+\.\S+$/.test(values.adminEmail.trim())) return 'Enter a valid email address.'
    if (key === 'password' && values.password.length < 10) return 'Use at least 10 characters.'
    return undefined
  }
  const validate = (values = form) => {
    const next = (Object.keys(values) as Array<keyof typeof form>).reduce<Partial<Record<keyof typeof form, string>>>((errors, key) => { const message = fieldError(key, values); if (message) errors[key] = message; return errors }, {})
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }
  const validateField = (key: keyof typeof form) => setFieldErrors((current) => ({ ...current, [key]: fieldError(key) }))
  const change = (key: keyof typeof form, value: string) => { update(key, value); if (fieldErrors[key]) setFieldErrors((current) => ({ ...current, [key]: undefined })) }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); if (!validate()) return; setBusy(true)
    try { await completeSetup(form); await onComplete() } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)) } finally { setBusy(false) }
  }
  return <AuthShell eyebrow="First-run setup" title="Set up your school workspace" copy="Everything stays on this device. Create the first administrator account to get started.">
    <form className="space-y-4" onSubmit={submit} noValidate>
      <Field label="School name" value={form.schoolName} onChange={(value) => change('schoolName', value)} onBlur={() => validateField('schoolName')} error={fieldErrors.schoolName} placeholder="Green Valley School" required />
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Country" value={form.country} onChange={(value) => change('country', value)} onBlur={() => validateField('country')} error={fieldErrors.country} required /><Field label="Currency" value={form.currency} onChange={(value) => change('currency', value.toUpperCase())} onBlur={() => validateField('currency')} error={fieldErrors.currency} maxLength={3} required /></div>
      <Field label="Administrator name" value={form.adminName} onChange={(value) => change('adminName', value)} onBlur={() => validateField('adminName')} error={fieldErrors.adminName} placeholder="Ayesha Khan" required />
      <Field label="Administrator email" type="email" value={form.adminEmail} onChange={(value) => change('adminEmail', value)} onBlur={() => validateField('adminEmail')} error={fieldErrors.adminEmail} placeholder="admin@school.edu" required />
      <Field label="Password" type="password" value={form.password} onChange={(value) => change('password', value)} onBlur={() => validateField('password')} error={fieldErrors.password} placeholder="At least 10 characters" minLength={10} required />
      {error && <Notice tone="error">{error}</Notice>}
      <button disabled={busy} className="w-full rounded-xl bg-[#0d4f82] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0a416c] disabled:cursor-wait disabled:opacity-60">{busy ? 'Creating workspace…' : 'Create workspace'}</button>
    </form>
  </AuthShell>
}

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const validate = () => { const next: { email?: string; password?: string } = {}; if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.'; if (!password) next.password = 'Enter your password.'; setFieldErrors(next); return Object.keys(next).length === 0 }
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(''); if (!validate()) return; setBusy(true); try { await login({ email, password }); onLoggedIn() } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)) } finally { setBusy(false) } }
  return <AuthShell eyebrow="Welcome back" title="Sign in to SchoolFlow" copy="Use the administrator account created during first-run setup.">
    <form className="space-y-4" onSubmit={submit} noValidate><Field label="Email" type="email" value={email} onChange={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: undefined })) }} onBlur={() => setFieldErrors((current) => ({ ...current, email: /^\S+@\S+\.\S+$/.test(email.trim()) ? undefined : 'Enter a valid email address.' }))} error={fieldErrors.email} autoComplete="username" required /><Field label="Password" type="password" value={password} onChange={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })) }} onBlur={() => setFieldErrors((current) => ({ ...current, password: password ? undefined : 'Enter your password.' }))} error={fieldErrors.password} autoComplete="current-password" required />{error && <Notice tone="error">{error}</Notice>}<button disabled={busy} className="w-full rounded-xl bg-[#0d4f82] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0a416c] disabled:cursor-wait disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button></form>
  </AuthShell>
}

function AuthShell({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_15%_20%,#fff5cf_0,transparent_28%),radial-gradient(circle_at_90%_10%,#e5f4ff_0,transparent_34%),#f8fbfe] px-5 py-10 text-[#102a43]"><div className="w-full max-w-lg rounded-[28px] border border-[#dcebf5] bg-white p-6 shadow-[0_24px_70px_rgba(42,86,115,0.12)] sm:p-9"><div className="mb-8 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0d4f82] text-white"><BookIcon /></span><span><span className="block text-sm font-black">SchoolFlow</span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d8aa3]">Offline workspace</span></span></div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4b9ccc]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">{title}</h1><p className="mt-3 mb-7 text-sm leading-6 text-[#6d8aa3]">{copy}</p>{children}</div></div>
}

function Field({ label, value, onChange, onBlur, error, type = 'text', placeholder, required, minLength, maxLength, autoComplete }: { label: string; value: string; onChange: (value: string) => void; onBlur?: () => void; error?: string; type?: string; placeholder?: string; required?: boolean; minLength?: number; maxLength?: number; autoComplete?: string }) {
  const inputId = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const errorId = `${inputId}-error`
  return <label className="block text-sm font-bold text-[#315a76]" htmlFor={inputId}><span className="mb-1.5 block">{label}</span><input id={inputId} className={`w-full rounded-xl border bg-[#fbfdff] px-3.5 py-3 text-sm font-medium outline-none transition placeholder:text-[#a1b5c4] focus:ring-4 ${error ? 'border-[#df8b80] focus:border-[#c9675b] focus:ring-[#fff0ed]' : 'border-[#dcebf5] focus:border-[#4b9ccc] focus:ring-[#dff2ff]'}`} type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder={placeholder} required={required} minLength={minLength} maxLength={maxLength} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />{error && <span id={errorId} className="mt-1.5 block text-xs font-semibold text-[#b25146]" role="alert">{error}</span>}</label>
}

function Notice({ children, tone }: { children: React.ReactNode; tone: 'error' | 'success' }) {
  return <div className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${tone === 'error' ? 'border-[#f2cfc9] bg-[#fff5f3] text-[#a94f43]' : 'border-[#cfead8] bg-[#f2fbf5] text-[#328456]'}`}>{children}</div>
}

function Workspace({ session, onLogout }: { session: Session; onLogout: () => Promise<void> }) {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [backupPassphrase, setBackupPassphrase] = useState(''); const [backupPath, setBackupPath] = useState(''); const [restorePath, setRestorePath] = useState(''); const [restorePassphrase, setRestorePassphrase] = useState(''); const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null); const [busy, setBusy] = useState(false)
  const navigation = [['Dashboard', <GaugeIcon />], ['Students', <UsersIcon />], ['Teachers', <TeacherIcon />], ['Parents', <ParentsIcon />], ['Attendance', <CalendarIcon />], ['Fees & accounts', <WalletIcon />], ['Reports', <ChartIcon />], ['Settings', <SettingsIcon />]] as const
  async function backup() { setNotice(null); setBusy(true); try { const result = await createBackup({ path: backupPath || undefined, passphrase: backupPassphrase }); setNotice({ tone: 'success', text: `Backup created at ${result.path} (${Math.round(result.bytes / 1024)} KB).` }) } catch (caught) { setNotice({ tone: 'error', text: caught instanceof Error ? caught.message : String(caught) }) } finally { setBusy(false) } }
  async function restore() { setNotice(null); setBusy(true); try { const result = await restoreBackup({ path: restorePath, passphrase: restorePassphrase }); setNotice({ tone: 'success', text: `Restored schema ${result.schemaVersion}. You will be signed out so the restored accounts can be used.` }); await onLogout() } catch (caught) { setNotice({ tone: 'error', text: caught instanceof Error ? caught.message : String(caught) }) } finally { setBusy(false) } }
  return <div className="min-h-screen bg-[#f2f6fa] text-[#102a43]">
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#0b315b] text-white shadow-2xl transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-16 items-center gap-3 bg-[#0d4f82] px-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><BookIcon /></span><div><p className="text-sm font-black">SchoolFlow</p><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#b8d9ed]">Admin workspace</p></div><button onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" aria-label="Close navigation"><CloseIcon /></button></div>
      <div className="border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#c9e8ff] text-sm font-black text-[#0d4f82]">{session.displayName.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-extrabold">{session.displayName}</p><p className="truncate text-[10px] text-[#9fc0d8]">{session.role}</p></div></div></div>
      <nav className="space-y-1 p-3" aria-label="Workspace navigation">{navigation.map(([label, icon]) => <button key={label} onClick={() => { setActiveNav(label); setSidebarOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${activeNav === label ? 'bg-[#0d70ac] text-white shadow-lg shadow-[#051f3b]/30' : 'text-[#b8d0e3] hover:bg-white/10 hover:text-white'}`}>{icon}<span>{label}</span>{label !== 'Settings' && <ChevronIcon className="ml-auto" />}</button>)}</nav>
      <div className="absolute bottom-0 w-full border-t border-white/10 p-4"><div className="rounded-xl bg-[#08294d] p-3"><div className="flex items-center gap-2 text-[10px] font-bold text-[#b8d0e3]"><span className="h-2 w-2 rounded-full bg-[#4ac477] shadow-[0_0_0_4px_rgba(74,196,119,0.13)]" /> Works offline</div><p className="mt-2 text-[10px] leading-4 text-[#86a9c3]">Your records stay on this device.</p></div></div>
    </aside>
    {sidebarOpen && <button className="fixed inset-0 z-30 bg-[#051f3b]/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#dce7ef] bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-[#315a76] hover:bg-[#f2f6fa] lg:hidden" aria-label="Open navigation"><MenuIcon /></button><div className="relative hidden w-72 md:block"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9bb0bf]" /><input className="h-10 w-full rounded-xl bg-[#f4f8fb] pl-10 pr-3 text-xs font-medium text-[#315a76] outline-none placeholder:text-[#9bb0bf] focus:ring-4 focus:ring-[#e5f3fb]" placeholder="Search students, classes…" /></div><div className="truncate md:hidden"><p className="text-sm font-black">{activeNav}</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a95aa]">SchoolFlow</p></div></div><div className="flex items-center gap-2 sm:gap-4"><span className="hidden items-center gap-2 rounded-full border border-[#d8eee2] bg-[#f2fbf5] px-3 py-2 text-[10px] font-extrabold text-[#328456] sm:flex"><span className="h-2 w-2 rounded-full bg-[#4ac477]" /> Local only</span><button className="relative rounded-xl p-2 text-[#6d8aa3] hover:bg-[#f2f6fa]" aria-label="Notifications"><BellIcon /><span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ef8f79] px-1 text-[9px] font-black text-white">3</span></button><div className="hidden text-right sm:block"><p className="text-xs font-extrabold">{session.displayName}</p><p className="text-[10px] text-[#7a95aa]">Administrator</p></div><button onClick={() => void onLogout()} className="rounded-xl border border-[#dce7ef] px-3 py-2 text-[10px] font-extrabold text-[#315a76] hover:bg-[#f2f6fa]">Sign out</button></div></header>
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8"><div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold text-[#8aa1b2]"><span>Home</span><ChevronIcon /><span className="font-bold text-[#0d70ac]">{activeNav}</span></div><h1 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">{activeNav === 'Dashboard' ? 'Admin dashboard' : activeNav}</h1><p className="mt-1 text-xs text-[#7a95aa]">A calm overview of your school’s day, kept close and ready offline.</p></div><button className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0d4f82] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-[#0d4f82]/15 hover:bg-[#0a416c]"><span className="text-base leading-none">+</span> Add new record</button></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Students" value="1,248" change="+8.4%" copy="from last term" icon={<UsersIcon />} tone="blue" /><MetricCard title="Teachers" value="86" change="+3.2%" copy="active staff" icon={<TeacherIcon />} tone="green" /><MetricCard title="Attendance" value="94.6%" change="+2.1%" copy="this week" icon={<CalendarIcon />} tone="yellow" /><MetricCard title="Fees collected" value="PKR 2.4M" change="82%" copy="of term target" icon={<WalletIcon />} tone="purple" /></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-12"><Panel title="Earnings" subtitle="Collections compared with fee targets" className="xl:col-span-7"><div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs"><LegendDot color="bg-[#3f7df3]" label="Total collections" value="PKR 750k" /><LegendDot color="bg-[#ef6f61]" label="Fees outstanding" value="PKR 150k" /><span className="ml-auto text-[#8aa1b2]">This academic year <ChevronDownIcon /></span></div><EarningsChart /></Panel><Panel title="Expenses" subtitle="Monthly operating costs" className="xl:col-span-3"><ExpensesChart /></Panel><Panel title="Students" subtitle="Enrollment by group" className="xl:col-span-2"><StudentDonut /></Panel></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-12"><Panel title="Academic calendar" subtitle="August 2026" className="xl:col-span-4"><CalendarWidget /></Panel><Panel title="School activity" subtitle="Last 30 days" className="xl:col-span-4"><ActivityWidget /></Panel><Panel title="Notice board" subtitle="Recent updates" className="xl:col-span-4"><NoticeBoard /></Panel></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SocialCard label="Students enrolled" value="1,248" color="bg-[#0d70ac]" icon={<UsersIcon />} /><SocialCard label="Classes running" value="42" color="bg-[#3a9c62]" icon={<BookIcon />} /><SocialCard label="Pending tasks" value="18" color="bg-[#bc8610]" icon={<ChartIcon />} /><SocialCard label="Local backups" value="7" color="bg-[#7654b7]" icon={<ShieldIcon />} /></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2"><Panel title="Create encrypted backup" subtitle="Verified local recovery point"><div className="grid gap-3 md:grid-cols-2"><Field label="Passphrase" type="password" value={backupPassphrase} onChange={setBackupPassphrase} placeholder="At least 10 characters" minLength={10} /><Field label="Destination path (optional)" value={backupPath} onChange={setBackupPath} placeholder="Default: app data/backups" /></div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-[11px] leading-5 text-[#7a95aa]">Encrypted and checksum-verified before it is saved.</p><button disabled={busy} onClick={() => void backup()} className="shrink-0 rounded-xl bg-[#0d4f82] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{busy ? 'Working…' : 'Create backup'}</button></div></Panel><Panel title="Restore backup" subtitle="Replaces the current database after verification"><div className="grid gap-3 md:grid-cols-2"><Field label="Backup file path" value={restorePath} onChange={setRestorePath} placeholder="/path/to/schoolflow.schoolbackup" /><Field label="Passphrase" type="password" value={restorePassphrase} onChange={setRestorePassphrase} placeholder="Backup passphrase" /></div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-[11px] leading-5 text-[#7a95aa]">You will be signed out after a successful restore.</p><button disabled={busy || !restorePath} onClick={() => void restore()} className="shrink-0 rounded-xl border border-[#dce7ef] px-4 py-2.5 text-xs font-extrabold text-[#315a76] disabled:opacity-50">{busy ? 'Working…' : 'Restore backup'}</button></div></Panel></div>{notice && <div className="mt-4"><Notice tone={notice.tone}>{notice.text}</Notice></div>}</main></div>
  </div>
}

function Panel({ title, subtitle, className = '', children }: { title: string; subtitle: string; className?: string; children: React.ReactNode }) { return <section className={`rounded-2xl border border-[#dce7ef] bg-white p-5 shadow-[0_6px_20px_rgba(42,86,115,0.04)] ${className}`}><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-black text-[#102a43]">{title}</h2><p className="mt-1 text-[11px] text-[#8aa1b2]">{subtitle}</p></div><button className="rounded-lg px-2 py-1 text-lg leading-none text-[#a7b8c4] hover:bg-[#f2f6fa]" aria-label={`More ${title} options`}>•••</button></div>{children}</section> }
function MetricCard({ title, value, change, copy, icon, tone }: { title: string; value: string; change: string; copy: string; icon: React.ReactNode; tone: 'blue' | 'green' | 'yellow' | 'purple' }) { const tones = { blue: 'bg-[#e5f3fb] text-[#0d70ac]', green: 'bg-[#e4f6eb] text-[#3a9c62]', yellow: 'bg-[#fff4d3] text-[#bc8610]', purple: 'bg-[#eee8ff] text-[#7654b7]' }; return <article className="flex items-center justify-between rounded-2xl border border-[#dce7ef] bg-white p-4 shadow-[0_6px_20px_rgba(42,86,115,0.04)]"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${tones[tone]}`}>{icon}</span><div className="ml-4 min-w-0 text-right"><p className="text-[11px] font-semibold text-[#8aa1b2]">{title}</p><p className="mt-1 truncate text-xl font-black tracking-[-0.03em] text-[#102a43]">{value}</p><p className="mt-1 text-[10px] font-bold text-[#3a9c62]">{change} <span className="font-medium text-[#9aafbd]">{copy}</span></p></div></article> }
function LegendDot({ color, label, value }: { color: string; label: string; value: string }) { return <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color} shadow-[0_2px_5px_rgba(42,86,115,0.2)]`} /><span className="text-[#8aa1b2]">{label}</span><strong className="text-[#315a76]">{value}</strong></span> }
function EarningsChart() { return <div className="h-52"><svg className="h-full w-full" viewBox="0 0 760 220" preserveAspectRatio="none" role="img" aria-label="Earnings trend chart"><g stroke="#e5edf3" strokeDasharray="4 6"><path d="M34 25H744" /><path d="M34 75H744" /><path d="M34 125H744" /><path d="M34 175H744" /></g><path d="M34 180 C100 135 115 165 170 140 S255 60 320 100 S390 160 450 108 S535 45 590 94 S675 58 744 73 L744 180 Z" fill="#cfe4ff" /><path d="M34 180 C100 160 115 75 170 125 S255 150 320 112 S390 155 450 96 S535 122 590 114 S675 72 744 103 L744 180 Z" fill="#ef6f61" /><path d="M34 180 C100 135 115 165 170 140 S255 60 320 100 S390 160 450 108 S535 45 590 94 S675 58 744 73" fill="none" stroke="#3f7df3" strokeWidth="4" strokeLinecap="round" /><path d="M34 180 C100 160 115 75 170 125 S255 150 320 112 S390 155 450 96 S535 122 590 114 S675 72 744 103" fill="none" stroke="#ef6f61" strokeWidth="4" strokeLinecap="round" /><g fill="#8aa1b2" fontSize="11" textAnchor="middle"><text x="76" y="205">Mon</text><text x="184" y="205">Tue</text><text x="292" y="205">Wed</text><text x="400" y="205">Thu</text><text x="508" y="205">Fri</text><text x="616" y="205">Sat</text><text x="724" y="205">Sun</text></g></svg></div> }
function ExpensesChart() { return <div className="flex h-52 items-end justify-around gap-3 px-2 pb-5 pt-6"><div className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-[#315a76]">PKR 150k</span><span className="w-full rounded-t-lg bg-[#46cdbf]" style={{ height: '78%' }} /><span className="text-[10px] text-[#8aa1b2]">May</span></div><div className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-[#315a76]">PKR 100k</span><span className="w-full rounded-t-lg bg-[#3f7df3]" style={{ height: '56%' }} /><span className="text-[10px] text-[#8aa1b2]">Jun</span></div><div className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-[#315a76]">PKR 75k</span><span className="w-full rounded-t-lg bg-[#f4b83f]" style={{ height: '41%' }} /><span className="text-[10px] text-[#8aa1b2]">Jul</span></div></div> }
function StudentDonut() { return <div className="flex flex-col items-center"><div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: 'conic-gradient(#3f7df3 0 58%, #f4b83f 58% 100%)' }}><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><strong className="text-xl font-black">1,248</strong><span className="text-[9px] text-[#8aa1b2]">students</span></div></div><div className="mt-4 flex w-full justify-between text-[10px]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#3f7df3]" />Girls <strong className="ml-1 text-[#315a76]">724</strong></span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f4b83f]" />Boys <strong className="ml-1 text-[#315a76]">524</strong></span></div></div> }
function CalendarWidget() { const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; const numbers = Array.from({ length: 35 }, (_, index) => index - 1); return <div><div className="mb-3 flex items-center justify-between"><button className="rounded-lg px-2 text-[#6d8aa3] hover:bg-[#f2f6fa]">‹</button><strong className="text-xs">August 2026</strong><button className="rounded-lg px-2 text-[#6d8aa3] hover:bg-[#f2f6fa]">›</button></div><div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#8aa1b2]">{days.map((day, index) => <span key={`${day}-${index}`} className="py-1">{day}</span>)}{numbers.map((number, index) => <span key={index} className={`grid h-7 place-items-center rounded-lg ${number === 18 ? 'bg-[#0d70ac] font-black text-white' : number === 28 ? 'bg-[#fff4d3] text-[#bc8610]' : number < 1 || number > 31 ? 'text-[#c7d3dc]' : 'text-[#52738d]'}`}>{number < 1 ? 30 + number : number > 31 ? number - 31 : number}</span>)}</div><div className="mt-4 rounded-xl bg-[#f4f8fb] p-3"><p className="text-[10px] font-extrabold text-[#315a76]">Today’s focus</p><p className="mt-1 text-[10px] text-[#8aa1b2]">Review attendance · 09:30</p></div></div> }
function ActivityWidget() { return <div><div className="h-2 overflow-hidden rounded-full bg-[#edf2f6]"><div className="flex h-full"><span className="w-[48%] bg-[#46cdbf]" /><span className="w-[27%] bg-[#3f7df3]" /><span className="w-[16%] bg-[#f4b83f]" /><span className="w-[9%] bg-[#ef6f61]" /></div></div><p className="mt-4 text-2xl font-black">2,590 <span className="text-xs font-semibold text-[#3a9c62]">+12.4%</span></p><div className="mt-3 space-y-1">{[['Direct', '12,890', '50%', '#46cdbf'], ['Search', '7,245', '27%', '#3f7df3'], ['Referrals', '4,256', '16%', '#f4b83f'], ['Social', '500', '7%', '#ef6f61']].map(([label, value, percent, color]) => <div key={label} className="flex items-center gap-2 border-b border-dashed border-[#e5edf3] py-2.5 text-[11px]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="font-bold text-[#315a76]">{label}</span><strong className="ml-auto text-[#52738d]">{value}</strong><span className="w-8 text-right text-[#8aa1b2]">{percent}</span></div>)}</div></div> }
function NoticeBoard() { return <div className="space-y-3">{[['Today', 'Parent orientation moved to the main hall.', '#e5f8f0', '#3a9c62'], ['Yesterday', 'Grade 8 results are ready to review.', '#fff4d3', '#bc8610'], ['18 Aug', 'New admissions queue has 12 applications.', '#e8f1ff', '#3f7df3']].map(([date, text, background, color]) => <article key={text} className="border-b border-[#edf2f6] pb-3 last:border-0 last:pb-0"><span className="inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold" style={{ backgroundColor: background, color }}>{date}</span><p className="mt-2 text-[11px] font-bold leading-5 text-[#315a76]">{text}</p><p className="mt-1 text-[10px] text-[#9aafbd]">School office · local update</p></article>)}</div> }
function SocialCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) { return <article className={`${color} flex items-center gap-3 rounded-xl p-4 text-white shadow-lg shadow-[#0d4f82]/10`}><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">{icon}</span><div><p className="text-[10px] font-bold text-white/75">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div></article> }

function FeatureCard({ icon, title, copy, accent }: { icon: React.ReactNode; title: string; copy: string; accent: 'blue' | 'yellow' | 'green' | 'purple' }) { const accents = { blue: 'bg-[#e9f6ff] text-[#0d70ac]', yellow: 'bg-[#fff6d7] text-[#bc8610]', green: 'bg-[#ebf9ef] text-[#3a9c62]', purple: 'bg-[#f2edff] text-[#7654b7]' }; return <article className="rounded-2xl border border-[#e5eef5] bg-white p-5 shadow-[0_8px_24px_rgba(42,86,115,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(42,86,115,0.1)]"><span className={`grid h-11 w-11 place-items-center rounded-xl ${accents[accent]}`}>{icon}</span><h3 className="mt-5 text-base font-extrabold text-[#102a43]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#7891a5]">{copy}</p><span className="mt-4 inline-flex text-xs font-extrabold text-[#4b9ccc]">Explore module <ArrowIcon className="ml-1.5" /></span></article> }
function SecurityItem({ title, copy }: { title: string; copy: string }) { return <article className="rounded-2xl border border-[#e0edf5] bg-white p-5"><div className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf8ef] text-[#3a9c62]"><CheckIcon /></span><div><h3 className="text-sm font-extrabold text-[#315a76]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#7891a5]">{copy}</p></div></div></article> }

function BookIcon() { return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 6h8M8 10h6" /></svg> }
function SparkIcon() { return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 1.75 6.25L20 10l-6.25 1.75L12 18l-1.75-6.25L4 10l6.25-1.75L12 2Zm7 13 .75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15Z" /></svg> }
function ArrowIcon({ className = '' }: { className?: string }) { return <svg className={className} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg> }
function CheckIcon() { return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg> }
function ShieldIcon() { return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg> }
function UsersIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> }
function CalendarIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m8 15 2 2 4-4" /></svg> }
function WalletIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6" /><path d="M16 15h.01" /></svg> }
function SettingsIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4V19a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1A2 2 0 1 1 3 14.7l.1-.1A2 2 0 0 0 1.7 11H1.5a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4L3 3.5A2 2 0 1 1 5.8.7l.1.1A2 2 0 0 0 9.3-.6V-1a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1A2 2 0 1 1 19.6 3l-.1.1A2 2 0 0 0 20.9 6h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.5 3.4Z" transform="translate(1 1) scale(.92)" /></svg> }
function GaugeIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.93 19a10 10 0 1 1 14.14 0" /><path d="m12 13 4-4" /><path d="M12 21v-2" /></svg> }
function TeacherIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4v7M19.5 7.5 16 9l-3.5-1.5L16 6l3.5 1.5ZM19 21v-4a3 3 0 0 0-3-3h-1" /></svg> }
function ParentsIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 21a5.5 5.5 0 0 1 11 0M14 21a4 4 0 0 1 7.5-2" /></svg> }
function ChartIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></svg> }
function ChevronIcon({ className = '' }: { className?: string }) { return <svg className={className} aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg> }
function ChevronDownIcon() { return <svg className="ml-1 inline-block" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg> }
function CloseIcon() { return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg> }
function MenuIcon() { return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg> }
function SearchIcon({ className = '' }: { className?: string }) { return <svg className={className} aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg> }
function BellIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg> }

export default App
