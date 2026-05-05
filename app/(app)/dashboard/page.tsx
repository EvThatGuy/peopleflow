import Link from 'next/link';
import {
  Users,
  Briefcase,
  ClipboardCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatTile } from '@/components/dashboard/stat-tile';
import { HeadcountChart } from '@/components/charts/headcount-chart';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { requireSession, roleLabels } from '@/lib/auth/session';
import {
  activityFeed,
  departments,
  employees,
  getActiveEmployees,
  getOpenJobs,
  getPendingApprovals,
  getUpcomingOnboarding,
  headcountTrend,
  timeOffRequests,
} from '@/lib/demo-data';
import { initials, relativeTime } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await requireSession();
  const active = getActiveEmployees();
  const openJobs = getOpenJobs();
  const pendingApprovals = getPendingApprovals();
  const upcomingStarts = getUpcomingOnboarding();
  const totalDeptCount = departments.reduce((s, d) => s + d.headcount, 0);
  const recentTimeOff = [...timeOffRequests]
    .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-8">
      <PageHeader
        title={`Welcome back, ${session.fullName?.split(' ')[0] ?? 'there'}.`}
        description={`Here's the state of ${session.organizationName} today. You're signed in as ${roleLabels[session.role]}.`}
        actions={
          <Button asChild variant="accent">
            <Link href="/assistant">
              <Sparkles className="h-4 w-4" /> Ask the assistant
            </Link>
          </Button>
        }
      />

      {/* ---------------- STAT TILES ---------------- */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active employees"
          value={active.length}
          delta={{ direction: 'up', value: '+2 MoM' }}
          hint={`Across ${departments.length} departments`}
          icon={Users}
          href="/people"
        />
        <StatTile
          label="Open roles"
          value={openJobs.length}
          delta={{ direction: 'up', value: '+1' }}
          hint={`${openJobs.reduce((s, j) => s + j.candidates, 0)} candidates in pipeline`}
          icon={Briefcase}
          href="/recruiting"
        />
        <StatTile
          label="Pending approvals"
          value={pendingApprovals.length}
          delta={{ direction: 'neutral', value: '2 over SLA' }}
          hint="Time off + workflows awaiting action"
          icon={ClipboardCheck}
          href="/time-off"
        />
        <StatTile
          label="Starting soon"
          value={upcomingStarts.length}
          delta={{ direction: 'up', value: 'next 30d' }}
          hint="New hires in onboarding"
          icon={Calendar}
          href="/onboarding"
        />
      </div>

      {/* ---------------- MAIN GRID ---------------- */}
      <div className="mt-7 grid gap-5 lg:grid-cols-12">
        {/* Headcount trend */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-[15px]">Headcount trend</CardTitle>
              <CardDescription>Last 12 months, all departments</CardDescription>
            </div>
            <Badge variant="success" className="num">+8 YoY</Badge>
          </CardHeader>
          <CardContent>
            <HeadcountChart data={headcountTrend} />
          </CardContent>
        </Card>

        {/* Department breakdown */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-[15px]">Department breakdown</CardTitle>
            <CardDescription>Active employees only</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3.5">
              {departments
                .slice()
                .sort((a, b) => b.headcount - a.headcount)
                .map((d) => {
                  const pct = (d.headcount / totalDeptCount) * 100;
                  return (
                    <li key={d.id}>
                      <div className="flex items-baseline justify-between text-[13px]">
                        <span className="font-medium">{d.name}</span>
                        <span className="num text-muted-foreground">
                          {d.headcount} <span className="text-[11px]">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
            </ul>
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-[15px]">Pending approvals</CardTitle>
              <CardDescription>Time off awaiting your decision</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/time-off">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {recentTimeOff.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                return (
                  <li key={r.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{initials(r.employeeName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium truncate">{r.employeeName}</span>
                        <span className="text-[12px] text-muted-foreground truncate">
                          {emp?.jobTitle}
                        </span>
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        <span className="capitalize">{r.kind}</span> · {r.startDate}
                        {r.startDate !== r.endDate ? ` → ${r.endDate}` : ''} ·{' '}
                        <span className="num">{r.hours}h</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        r.status === 'pending'
                          ? 'warning'
                          : r.status === 'approved'
                          ? 'success'
                          : r.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {r.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Compliance / alerts */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-[15px]">Compliance & alerts</CardTitle>
            <CardDescription>Things that need attention</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {[
                {
                  title: '7 employees haven\'t acknowledged the updated handbook',
                  meta: 'Q2 2026 Employee Handbook · due May 15',
                  href: '/documents',
                  level: 'warning' as const,
                },
                {
                  title: '2 onboarding tasks blocked on equipment shipment',
                  meta: 'Quinn Halverson · starts May 12',
                  href: '/onboarding',
                  level: 'warning' as const,
                },
                {
                  title: 'I-9 verification overdue for 1 new hire',
                  meta: 'Bree Anderson · 3 days past start',
                  href: '/onboarding',
                  level: 'destructive' as const,
                },
              ].map((alert, i) => (
                <li key={i}>
                  <Link
                    href={alert.href}
                    className="flex items-start gap-3 px-6 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    <span
                      className={
                        alert.level === 'destructive'
                          ? 'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive'
                          : 'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning'
                      }
                    >
                      <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium leading-snug">{alert.title}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{alert.meta}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Upcoming onboarding */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-[15px]">Upcoming onboarding</CardTitle>
              <CardDescription>New hires starting in the next 30 days</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/onboarding">
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {upcomingStarts.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(e.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{e.fullName}</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {e.jobTitle} · {e.departmentName} · {e.locationName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[12px] font-medium">{e.startDate}</div>
                    <div className="text-[11px] text-muted-foreground">starts</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-[15px]">Recent activity</CardTitle>
            <CardDescription>Across your workspace</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {activityFeed.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-6 py-3.5">
                  <Avatar className="mt-0.5 h-7 w-7">
                    <AvatarFallback className="text-[10px]">{initials(a.who)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-snug">
                      <span className="font-medium">{a.who}</span>{' '}
                      <span className="text-muted-foreground">{a.action}</span>
                      {a.subject ? <span className="font-medium"> · {a.subject}</span> : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
