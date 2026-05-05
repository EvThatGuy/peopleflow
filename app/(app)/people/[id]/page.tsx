import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Mail, MapPin, Calendar, ChevronLeft, FileText, Lock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireSession, can, roleLabels } from '@/lib/auth/session';
import {
  getDirectReports,
  getEmployee,
  timeOffRequests,
} from '@/lib/demo-data';
import { initials, formatCurrency, formatDate } from '@/lib/utils';

const STATUS_BADGE = {
  active: { variant: 'success', label: 'Active' },
  pending_start: { variant: 'warning', label: 'Pending start' },
  on_leave: { variant: 'secondary', label: 'On leave' },
  offboarding: { variant: 'warning', label: 'Offboarding' },
  terminated: { variant: 'destructive', label: 'Terminated' },
} as const;

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = getEmployee(id);
  if (!employee) notFound();

  const session = await requireSession();
  const isSelf = session.employeeId === employee.id;
  const canViewComp = isSelf || can.viewCompensation(session.role);
  const reports = getDirectReports(employee.id);
  const employeeTimeOff = timeOffRequests.filter((r) => r.employeeId === employee.id);
  const badge = STATUS_BADGE[employee.status];

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-16 pt-6">
      {/* breadcrumb */}
      <Link
        href="/people"
        className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All people
      </Link>

      {/* ----- Profile header ----- */}
      <div className="mt-4 rounded-lg border border-border/70 bg-card p-7 shadow-soft">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 text-lg">
              <AvatarFallback className="text-lg">{initials(employee.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight">{employee.fullName}</h1>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="mt-0.5 text-[14px] text-muted-foreground">
                {employee.jobTitle} · {employee.departmentName}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {employee.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {employee.locationName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Started {formatDate(employee.startDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm">
              <Mail className="h-3.5 w-3.5" /> Message
            </Button>
            {can.manageEmployees(session.role) && (
              <Button variant="accent" size="sm">
                Edit profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ----- Tabs ----- */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="time-off">Time off</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle className="text-[15px]">Job</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailGrid
                  rows={[
                    ['Title', employee.jobTitle],
                    ['Level', employee.jobLevel],
                    ['Department', employee.departmentName],
                    ['Location', employee.locationName],
                    ['Manager', employee.managerName ?? '—'],
                    ['Start date', formatDate(employee.startDate)],
                    ['Employment type', employee.employmentType.replace('_', '-')],
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[15px]">Compensation</CardTitle>
                {!canViewComp && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                {canViewComp && employee.compensation ? (
                  <DetailGrid
                    rows={[
                      ['Base', <span key="b" className="num">{formatCurrency(employee.compensation.base)}</span>],
                      ['Currency', employee.compensation.currency],
                      ['Pay basis', employee.compensation.payBasis],
                      ['Frequency', employee.compensation.payFrequency],
                    ]}
                  />
                ) : (
                  <div className="rounded-md border border-dashed border-border/70 px-4 py-6 text-center">
                    <Lock className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      Compensation is restricted to HR and the employee.
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      You're signed in as {roleLabels[session.role]}.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {reports.length > 0 && (
              <Card className="lg:col-span-12">
                <CardHeader>
                  <CardTitle className="text-[15px]">Direct reports</CardTitle>
                  <CardDescription>{reports.length} people report to {employee.preferredName ?? employee.fullName}</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <ul className="divide-y divide-border/60 border-t border-border/60">
                    {reports.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/people/${r.id}`}
                          className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/30"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{initials(r.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-[13px] font-medium">{r.fullName}</div>
                            <div className="text-[12px] text-muted-foreground">
                              {r.jobTitle} · {r.locationName}
                            </div>
                          </div>
                          <Badge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].label}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Documents</CardTitle>
              <CardDescription>Permission-controlled employee documents</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: 'Offer Letter', type: 'Offer', vis: 'HR + Self', date: employee.startDate, status: 'Signed' },
                    { name: 'I-9 Verification', type: 'Compliance', vis: 'HR only', date: employee.startDate, status: 'Verified' },
                    { name: 'Direct Deposit Form', type: 'Payroll', vis: 'HR + Self', date: employee.startDate, status: 'Filed' },
                    { name: 'Employee Handbook ack.', type: 'Acknowledgment', vis: 'Company', date: '2026-01-15', status: 'Acknowledged' },
                  ].map((d) => (
                    <TableRow key={d.name}>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-[13px] font-medium">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {d.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">{d.type}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{d.vis}</TableCell>
                      <TableCell className="num text-[13px] text-muted-foreground">{formatDate(d.date)}</TableCell>
                      <TableCell><Badge variant="success">{d.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIME OFF */}
        <TabsContent value="time-off">
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-[15px]">Balances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Vacation', accrued: 160, used: 56, remaining: 104 },
                  { name: 'Sick', accrued: 80, used: 8, remaining: 72 },
                ].map((b) => (
                  <div key={b.name}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-medium">{b.name}</span>
                      <span className="num text-muted-foreground">
                        <span className="text-foreground">{b.remaining}</span>h left
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(b.remaining / b.accrued) * 100}%` }} />
                    </div>
                    <div className="num mt-1 text-[11px] text-muted-foreground">
                      {b.used}h used of {b.accrued}h accrued
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle className="text-[15px]">Requests</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {employeeTimeOff.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeTimeOff.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-[13px] capitalize">{r.kind}</TableCell>
                          <TableCell className="num text-[13px] text-muted-foreground">
                            {formatDate(r.startDate)}
                            {r.startDate !== r.endDate ? ` → ${formatDate(r.endDate)}` : ''}
                          </TableCell>
                          <TableCell className="num text-[13px]">{r.hours}h</TableCell>
                          <TableCell>
                            <Badge variant={r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'destructive'}>
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="px-6 py-12 text-center text-[13px] text-muted-foreground">No requests yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Reviews & goals</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Last review', value: 'Q4 2025', hint: 'Exceeds expectations' },
                  { label: 'Active goals', value: '3', hint: '1 at risk' },
                  { label: 'Promotion readiness', value: 'Year+', hint: 'Track established' },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border border-border/70 p-4">
                    <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{s.label}</div>
                    <div className="mt-1 text-lg font-semibold tracking-tight">{s.value}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{s.hint}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Activity timeline</CardTitle>
              <CardDescription>Recent actions involving this employee</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative ml-3 space-y-4 border-l border-border/60 pl-5">
                {[
                  { at: '2026-04-30', text: 'Comp change requested by manager' },
                  { at: '2026-04-15', text: 'Acknowledged updated handbook' },
                  { at: '2026-03-31', text: 'Q1 self-review submitted' },
                  { at: '2026-02-12', text: 'Promotion to current title' },
                ].map((e) => (
                  <li key={e.at} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                    <div className="num text-[11px] text-muted-foreground">{formatDate(e.at)}</div>
                    <div className="mt-0.5 text-[13px]">{e.text}</div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailGrid({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-2 sm:block sm:border-0 sm:pb-0">
          <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{k}</dt>
          <dd className="text-[13px] sm:mt-0.5">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
