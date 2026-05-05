'use client';

/**
 * Time Tracking — weekly timesheet grid + manager approval queue.
 *
 * In production: replace the in-memory `timeEntries` with Supabase RSC reads.
 * The "Export for payroll" button should POST to a server action that writes
 * to `payroll_exports` and `payroll_export_lines` and returns a CSV in the
 * format expected by the configured payroll provider.
 */

import { useMemo, useState } from 'react';
import { Calendar, Download, Check, X, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { timeEntries, type TimeEntry } from '@/lib/demo-data';
import { initials } from '@/lib/utils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_DATES = ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'];

const STATUS_META: Record<TimeEntry['status'], { label: string; tone: 'secondary' | 'warning' | 'success' | 'destructive' }> = {
  draft: { label: 'Draft', tone: 'secondary' },
  submitted: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'destructive' },
};

type EmployeeRow = {
  employeeId: string;
  employeeName: string;
  hoursByDate: Record<string, number>;
  total: number;
  status: TimeEntry['status'];
  overtimeFlag: boolean;
};

export default function TimeTrackingPage() {
  const [tab, setTab] = useState<'timesheet' | 'queue'>('timesheet');

  const rows = useMemo<EmployeeRow[]>(() => {
    const byEmployee = new Map<string, EmployeeRow>();
    for (const e of timeEntries) {
      if (!byEmployee.has(e.employeeId)) {
        byEmployee.set(e.employeeId, {
          employeeId: e.employeeId,
          employeeName: e.employeeName,
          hoursByDate: {},
          total: 0,
          status: e.status,
          overtimeFlag: false,
        });
      }
      const row = byEmployee.get(e.employeeId)!;
      row.hoursByDate[e.date] = (row.hoursByDate[e.date] ?? 0) + e.hours;
      row.total += e.hours;
      // Promote to most-advanced status across the week (rare in real life, fine for demo)
      const order: TimeEntry['status'][] = ['draft', 'submitted', 'approved', 'rejected'];
      if (order.indexOf(e.status) > order.indexOf(row.status)) row.status = e.status;
      if (row.total > 40) row.overtimeFlag = true;
    }
    return Array.from(byEmployee.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, []);

  const queue = rows.filter((r) => r.status === 'submitted');

  const totalSubmitted = rows.reduce((s, r) => s + (r.status === 'submitted' ? r.total : 0), 0);
  const totalApproved = rows.reduce((s, r) => s + (r.status === 'approved' ? r.total : 0), 0);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 pb-16 pt-8">
      <PageHeader
        title="Time tracking"
        description="Hourly and non-exempt timesheets for the current pay period. Approved hours flow into the next payroll export."
      >
        <Button variant="outline" size="sm">
          <Calendar className="h-3.5 w-3.5" />
          Week of May 4
        </Button>
        <Button size="sm" variant="accent">
          <Download className="h-3.5 w-3.5" />
          Export for payroll
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile label="Tracked employees" value={rows.length} />
        <SummaryTile
          label="Awaiting approval"
          value={queue.length}
          tone={queue.length > 0 ? 'warning' : undefined}
        />
        <SummaryTile label="Hours pending" value={totalSubmitted.toFixed(1)} sub="Submitted, not yet approved" />
        <SummaryTile label="Hours approved" value={totalApproved.toFixed(1)} sub="Ready for next export" />
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        <TabButton active={tab === 'timesheet'} onClick={() => setTab('timesheet')}>
          Timesheets
        </TabButton>
        <TabButton active={tab === 'queue'} onClick={() => setTab('queue')}>
          Approval queue {queue.length > 0 && <span className="num text-accent">({queue.length})</span>}
        </TabButton>
      </div>

      {tab === 'timesheet' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[24%]">Employee</TableHead>
                {DAY_LABELS.map((d, i) => (
                  <TableHead key={d} className="text-center">
                    <div>{d}</div>
                    <div className="num text-[10px] font-normal text-muted-foreground">
                      {DAY_DATES[i].slice(5)}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.employeeId} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">{initials(r.employeeName)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{r.employeeName}</span>
                    </div>
                  </TableCell>
                  {DAY_DATES.map((d) => {
                    const h = r.hoursByDate[d];
                    return (
                      <TableCell key={d} className="text-center">
                        {h ? (
                          <span className="num text-sm text-foreground">{h.toFixed(1)}</span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`num text-sm font-medium ${
                          r.overtimeFlag ? 'text-warning' : 'text-foreground'
                        }`}
                      >
                        {r.total.toFixed(1)}
                      </span>
                      {r.overtimeFlag && (
                        <span title="Overtime threshold reached" className="text-warning">
                          <Clock className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {queue.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No timesheets are awaiting approval. Nice work.
              </div>
            ) : (
              queue.map((r) => (
                <div
                  key={r.employeeId}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(r.employeeName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{r.employeeName}</span>
                      {r.overtimeFlag && <Badge variant="warning">Overtime</Badge>}
                    </div>
                    <div className="num text-xs text-muted-foreground">
                      {r.total.toFixed(1)} hrs · week of May 4 · {Object.keys(r.hoursByDate).length} day(s)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button size="sm" variant="accent">
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'warning';
}) {
  return (
    <Card>
      <CardContent className="px-5 pb-4 pt-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div
          className={`num mt-1.5 text-2xl font-semibold tracking-tight ${
            tone === 'warning' ? 'text-warning' : 'text-foreground'
          }`}
        >
          {value}
        </div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" aria-hidden />}
    </button>
  );
}
