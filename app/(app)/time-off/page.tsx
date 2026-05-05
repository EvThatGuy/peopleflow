import { Calendar, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RequestTimeOffDialog } from '@/components/forms/time-off-dialog';
import { requireSession, can, roleLabels } from '@/lib/auth/session';
import { timeOffRequests, getEmployee } from '@/lib/demo-data';
import { initials, formatDate } from '@/lib/utils';

const HOLIDAYS = [
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-07-03', name: 'Independence Day (observed)' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-11-26', name: 'Thanksgiving' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

export default async function TimeOffPage() {
  const session = await requireSession();
  const canApprove = can.approveTimeOff(session.role);

  const myRequests = timeOffRequests.filter((r) => r.employeeId === session.employeeId);
  const pending = timeOffRequests.filter((r) => r.status === 'pending');

  return (
    <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-8">
      <PageHeader
        title="Time off"
        description="Submit and review time off requests. Balances accrue on a per-policy basis."
        actions={<RequestTimeOffDialog />}
      />

      {/* ---- BALANCES ---- */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          { name: 'Vacation', accrued: 160, used: 56 },
          { name: 'Sick', accrued: 80, used: 8 },
          { name: 'Personal', accrued: 24, used: 0 },
        ].map((b) => {
          const remaining = b.accrued - b.used;
          return (
            <Card key={b.name}>
              <CardContent className="pt-6">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  {b.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="num text-3xl font-semibold tracking-tight">{remaining}</span>
                  <span className="text-[12px] text-muted-foreground">hours remaining</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(remaining / b.accrued) * 100}%` }}
                  />
                </div>
                <div className="num mt-2 text-[11px] text-muted-foreground">
                  {b.used}h used of {b.accrued}h accrued
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---- APPROVAL QUEUE (manager+) ---- */}
      {canApprove && (
        <Card className="mt-7">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-[15px]">Approval queue</CardTitle>
              <CardDescription>
                {pending.length} pending {pending.length === 1 ? 'request' : 'requests'} ·{' '}
                <span className="text-foreground">{roleLabels[session.role]}</span> view
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {pending.map((r) => {
                const emp = getEmployee(r.employeeId);
                return (
                  <li key={r.id} className="flex items-center gap-4 px-6 py-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{initials(r.employeeName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-medium">{r.employeeName}</span>
                        <Badge variant="secondary" className="capitalize">{r.kind}</Badge>
                      </div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">
                        <span className="num">
                          {formatDate(r.startDate)}
                          {r.startDate !== r.endDate ? ` → ${formatDate(r.endDate)}` : ''}
                        </span>
                        {' · '}
                        <span className="num">{r.hours}h</span>
                        {emp ? ` · ${emp.jobTitle}` : ''}
                      </div>
                      {r.note ? (
                        <p className="mt-1.5 max-w-2xl text-[12px] italic leading-relaxed text-muted-foreground">
                          "{r.note}"
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline">
                        <X className="h-3.5 w-3.5" /> Decline
                      </Button>
                      <Button size="sm" variant="accent">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </div>
                  </li>
                );
              })}
              {pending.length === 0 && (
                <li className="px-6 py-12 text-center text-[13px] text-muted-foreground">
                  Nothing pending. Inbox zero.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ---- MY REQUESTS + HOLIDAYS ---- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-[15px]">My requests</CardTitle>
            <CardDescription>Your time off, past and upcoming</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {myRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-[13px] capitalize">{r.kind}</TableCell>
                      <TableCell className="num text-[13px] text-muted-foreground">
                        {formatDate(r.startDate)}
                        {r.startDate !== r.endDate ? ` → ${formatDate(r.endDate)}` : ''}
                      </TableCell>
                      <TableCell className="num text-[13px]">{r.hours}h</TableCell>
                      <TableCell className="num text-[13px] text-muted-foreground">
                        {formatDate(r.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === 'pending'
                              ? 'warning'
                              : r.status === 'approved'
                              ? 'success'
                              : 'destructive'
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="px-6 py-12 text-center text-[13px] text-muted-foreground">
                You haven't submitted any requests yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-[15px]">Company holidays</CardTitle>
            <CardDescription>Observed in {new Date().getFullYear()}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {HOLIDAYS.map((h) => (
                <li key={h.date} className="flex items-center gap-3 px-6 py-3">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1 text-[13px]">{h.name}</div>
                  <div className="num text-[12px] text-muted-foreground">{formatDate(h.date)}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
