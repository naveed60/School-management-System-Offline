import { useQuery } from '@tanstack/react-query'
import { getAppInfo, isTauriRuntime, type AppInfo } from './lib/tauri'

function App() {
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

export default App
