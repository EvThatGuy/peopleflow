import Link from 'next/link';
import { ArrowRight, Check, Lock, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MarketingPage() {
  return (
    <main className="text-foreground">
      {/* ------------ NAV ------------ */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
              PF
            </div>
            <span className="text-[15px] font-semibold tracking-tight">PeopleFlow</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#ai" className="hover:text-foreground">AI</a>
            <a href="#security" className="hover:text-foreground">Security</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="accent">
              <Link href="/dashboard">Open demo</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ------------ HERO ------------ */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.4]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/0 to-background" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground shadow-soft">
              <Sparkles className="h-3 w-3 text-accent" />
              AI-first HR platform
            </div>

            <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-[-0.02em] text-foreground sm:text-7xl">
              The HR system <em className="text-accent">your team</em>
              <br />
              actually wants to use.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              PeopleFlow is the modern operating system for people-ops. Onboarding,
              time off, performance, and payroll-ready records — without the
              enterprise complexity.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent">
                <Link href="/dashboard">
                  Try the live demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#demo">Request a walkthrough</a>
              </Button>
            </div>

            <p className="mt-5 text-[12px] text-muted-foreground">
              No setup. No credit card. Pre-loaded with a sample 25-person company.
            </p>
          </div>

          {/* dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-x-10 -top-10 h-32 bg-gradient-to-b from-accent/10 to-transparent blur-3xl" aria-hidden />
            <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-elevated">
              <div className="flex h-9 items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4">
                <span className="h-2 w-2 rounded-full bg-border" />
                <span className="h-2 w-2 rounded-full bg-border" />
                <span className="h-2 w-2 rounded-full bg-border" />
                <span className="ml-3 text-[11px] text-muted-foreground">app.peopleflow.com / dashboard</span>
              </div>
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ------------ LOGOS / PAIN ------------ */}
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-accent">The problem</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
                Enterprise HR is too heavy. Spreadsheets are too light.
              </h2>
            </div>
            <div className="md:col-span-7 space-y-5">
              {[
                {
                  q: 'You spend more time fighting your HRIS than running people-ops.',
                  a: 'Setup takes months. Every change goes through an integrator.',
                },
                {
                  q: 'Onboarding lives in a spreadsheet and three Slack threads.',
                  a: 'New hires wait days for accounts, equipment, and clarity.',
                },
                {
                  q: 'Managers don\'t know what to approve, when, or why.',
                  a: 'Time off, comp, and reviews sit in inboxes for a week.',
                },
              ].map((row) => (
                <div key={row.q} className="rounded-md border border-border/70 bg-card p-5 shadow-soft">
                  <p className="text-[15px] font-medium tracking-tight text-foreground">{row.q}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{row.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------ FEATURES ------------ */}
      <section id="product" className="border-b border-border/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-accent">One platform</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Everything people-ops needs.
              <br />
              Nothing they don't.
            </h2>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card p-7">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <f.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-[15px] font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------ AI ------------ */}
      <section id="ai" className="relative overflow-hidden border-b border-border/60 bg-sidebar text-sidebar-foreground">
        <div className="absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-accent">AI assistant</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              An HR analyst, on every desk.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-sidebar-foreground/70">
              Ask plain-English questions. Draft job descriptions. Summarize a
              candidate. Generate a review. PeopleFlow's assistant has full context
              on your org, policies, and people — privately, inside your workspace.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px]">
              {[
                'Answer policy questions with citations',
                'Generate onboarding plans from a job title',
                'Summarize an employee profile in 5 lines',
                'Explain pending approvals to a manager',
                'Draft a quarterly review from goal data',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sidebar-foreground/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.25} />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <AssistantPreview />
          </div>
        </div>
      </section>

      {/* ------------ PRICING ------------ */}
      <section id="pricing" className="border-b border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-accent">Pricing</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Simple, per-employee pricing.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Annual billing. No setup fees. Cancel anytime.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              {
                tier: 'Starter',
                price: '$8',
                tagline: 'Up to 50 employees.',
                features: ['Core HRIS', 'Time off & calendar', 'Documents & policies', 'Onboarding & offboarding'],
              },
              {
                tier: 'Growth',
                price: '$14',
                tagline: 'Up to 500 employees.',
                features: ['Everything in Starter', 'Performance & goals', 'Recruiting / ATS', 'Workflow approvals', 'AI HR assistant'],
                featured: true,
              },
              {
                tier: 'Scale',
                price: 'Custom',
                tagline: 'Custom for 500+ teams.',
                features: ['Everything in Growth', 'SSO & SCIM', 'Advanced analytics', 'Audit log retention', 'Premium support'],
              },
            ].map((p) => (
              <div
                key={p.tier}
                className={`relative rounded-lg border p-7 ${
                  p.featured
                    ? 'border-accent/60 bg-card shadow-elevated'
                    : 'border-border/70 bg-card shadow-soft'
                }`}
              >
                {p.featured ? (
                  <span className="absolute -top-2.5 left-7 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-foreground">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-[15px] font-semibold tracking-tight">{p.tier}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="num text-4xl font-semibold tracking-tight">{p.price}</span>
                  {p.price !== 'Custom' && <span className="text-[13px] text-muted-foreground">/employee/mo</span>}
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{p.tagline}</p>
                <ul className="mt-6 space-y-2 text-[13px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.25} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full" variant={p.featured ? 'accent' : 'outline'}>
                  <Link href="/signup">{p.featured ? 'Start trial' : 'Talk to sales'}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------ SECURITY ------------ */}
      <section id="security" className="border-b border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-accent">Security & compliance</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight tracking-tight">Built for trust from day one.</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                People data is the most sensitive data your company holds. We treat
                it like it.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 lg:col-span-7">
              {[
                { title: 'Tenant-isolated data', body: 'Postgres row-level security on every table. Zero cross-tenant access.' },
                { title: 'Encryption in transit & at rest', body: 'TLS 1.3 on the wire. AES-256 for stored secrets.' },
                { title: 'Granular RBAC', body: 'Six built-in roles. Compensation hidden by default.' },
                { title: 'Audit trail', body: 'Append-only log of every sensitive change. HR-readable.' },
              ].map((s) => (
                <div key={s.title} className="bg-card p-6">
                  <Lock className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  <h3 className="mt-3 text-[14px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------ CTA / DEMO FORM ------------ */}
      <section id="demo" className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-lg border border-border/70 bg-card p-10 shadow-elevated sm:p-14">
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h2 className="font-serif text-3xl leading-tight tracking-tight">Request a walkthrough.</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  Tell us about your team. We'll show you how PeopleFlow replaces
                  three tools, two spreadsheets, and one shared inbox.
                </p>
              </div>
              <form className="space-y-3">
                <input
                  type="text"
                  placeholder="Work email"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-soft focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-focus"
                />
                <input
                  type="text"
                  placeholder="Company"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-soft focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-focus"
                />
                <input
                  type="text"
                  placeholder="Team size (e.g., 80)"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-soft focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-focus"
                />
                <Button type="button" className="w-full" variant="accent">
                  Request walkthrough
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  By submitting, you agree to our terms. Wired to a stub in this demo.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ------------ FOOTER ------------ */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-[12px] text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary text-[9px] font-semibold text-primary-foreground">
              PF
            </div>
            <span>PeopleFlow {new Date().getFullYear()}. Demo platform.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: Zap,
    title: 'Single source of truth',
    body: 'Every employee, role, department, location, and reporting line — one record, used everywhere.',
  },
  {
    icon: Sparkles,
    title: 'AI that knows your org',
    body: 'Built-in assistant grounded in your policies, people, and approvals. Private to your tenant.',
  },
  {
    icon: Lock,
    title: 'Granular permissions',
    body: 'Six built-in roles plus row-level rules. Comp data is hidden unless explicitly granted.',
  },
  {
    icon: Zap,
    title: 'Workflows without code',
    body: 'Time off, comp changes, requisitions — every approval routes itself, with full audit trail.',
  },
  {
    icon: Sparkles,
    title: 'Onboarding that actually ships',
    body: 'Templates by role. Tasks for IT, manager, and the new hire. Progress that finance can see.',
  },
  {
    icon: Lock,
    title: 'Payroll-ready data',
    body: 'Compensation, timesheets, deductions. Export to Gusto, ADP, QuickBooks, or Paychex in one click.',
  },
];

function DashboardPreview() {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-12">
      {[
        { label: 'Headcount', value: '247', delta: '+12 QoQ' },
        { label: 'Open roles', value: '8', delta: '3 in final round' },
        { label: 'Pending approvals', value: '14', delta: '4 over SLA' },
        { label: 'Onboarding', value: '6', delta: 'this week' },
      ].map((s) => (
        <div key={s.label} className="rounded-md border border-border/70 bg-card p-4 sm:col-span-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{s.label}</div>
          <div className="num mt-1.5 text-2xl font-semibold tracking-tight">{s.value}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{s.delta}</div>
        </div>
      ))}
      <div className="sm:col-span-8 rounded-md border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-medium">Headcount trend</div>
          <div className="num text-[10px] text-muted-foreground">12 mo</div>
        </div>
        <svg viewBox="0 0 400 110" className="mt-3 h-24 w-full">
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 80 L33 75 L66 70 L100 65 L133 50 L166 55 L200 40 L233 35 L266 28 L300 22 L333 18 L366 12 L400 8"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
          />
          <path
            d="M0 80 L33 75 L66 70 L100 65 L133 50 L166 55 L200 40 L233 35 L266 28 L300 22 L333 18 L366 12 L400 8 L400 110 L0 110 Z"
            fill="url(#g)"
          />
        </svg>
      </div>
      <div className="sm:col-span-4 rounded-md border border-border/70 bg-card p-4">
        <div className="text-[12px] font-medium">Department mix</div>
        <ul className="mt-3 space-y-2 text-[12px]">
          {[
            ['Engineering', 38],
            ['Operations', 28],
            ['Sales', 18],
            ['People', 10],
            ['Executive', 6],
          ].map(([d, p]) => (
            <li key={d as string} className="flex items-center gap-2">
              <span className="w-20 text-muted-foreground">{d}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${p}%` }} />
              </span>
              <span className="num w-7 text-right text-muted-foreground">{p}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AssistantPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[hsl(220_45%_8%)] shadow-elevated">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[12px] text-sidebar-foreground/65">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        Assistant
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-md bg-white/[0.06] px-3.5 py-2 text-[13px] text-sidebar-foreground/90">
            What's our PTO carryover policy for engineering?
          </div>
        </div>
        <div className="max-w-[90%] space-y-2 text-[13px] leading-relaxed text-sidebar-foreground/85">
          <p>
            Engineering follows the Standard Vacation policy: <span className="text-foreground">160 hours</span> annual
            accrual, with up to <span className="text-foreground">40 hours</span> carryover into the next plan year.
            Anything above 40h is paid out at year end.
          </p>
          <p className="text-sidebar-foreground/55">
            Cited from <span className="underline decoration-dotted">Vacation & PTO Policy v3</span> · acknowledged by 24
            of 31 employees.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {['Show unacknowledged', 'Draft reminder email', 'Compare to 2024'].map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-sidebar-foreground/75"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
