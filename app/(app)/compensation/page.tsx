/**
 * Compensation — salary roll-up for HR roles.
 *
 * Server component. Gated by `can.viewCompensation(role)` — non-HR roles see
 * a redirect to /dashboard. In production, RLS on `compensation_records`
 * already prevents non-HR roles from reading rows; this is the friendly UX
 * layer on top.
 *
 * In production: replace the `employees` import with a Supabase RSC query
 * joining `employees` + `compensation_records` (current effective row) +
 * `departments` + `job_titles`.
 */

import { redirect } from 'next/navigation';
import { Lock, Download, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireSession } from '@/lib/auth/session';
import { can } from '@/lib/auth/roles';
import { employees, departments } from '@/lib/demo-data';
import { initials, formatCurrency } from '@/lib/utils';

export default async function CompensationPage() {
  const session = await requireSession();
  if (!can.viewCompensation(session.role)) {
    redirect('/dashboard');
  }

  const compRows = employees
    .filter((e) => e.compensation && e.status === 'active')
    .sort((a, b) => (b.compensation?.base ?? 0) - (a.compensation?.base ?? 0));

  const totalAnnualized = compRows.reduce((s, e) => s + (e.compensation?.base ?? 0), 0);
  const median = (() => {
    const sorted = [...compRows].sort((a, b) => (a.compensation?.base ?? 0) - (b.compensation?.base ?? 0));
    const mid = Math.floor(sorted.length / 2);
    return sorted[mid]?.compensation?.base ?? 0;
  })();

  // Department roll-up
  const byDept = departments
    .filter((d) => d.headcount > 0)
    .map((d) => {
      const rows = compRows.filter((e) => e.departmentId === d.id);
      const total = rows.reduce((s, e) => s + (e.compensation?.base ?? 0), 0);
      const avg = rows.length > 0 ? total / rows.length : 0;
      return { dept: d.name, headcount: rows.length, total, avg };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 pb-16 pt-8">
      <PageHeader
        title="Compensation"
        description="Active salary records. Visible only to HR roles. All access is logged to the audit trail."
      >
        <Badge variant="destructive">
          <Lock className="mr-1 h-3 w-3" />
          HR only
        </Badge>
        <Button size="sm" variant="outline">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile label="Active employees" value={compRows.length} />
        <SummaryTile label="Annualized total" value={formatCurrency(totalAnnualized)} sub="Base salary only" />
        <SummaryTile label="Median base" value={formatCurrency(median)} />
        <SummaryTile label="Avg merit increase" value="3.8%" sub="Trailing 12 months" />
      </div>

      {/* Department breakdown */}
      <Card>
        <CardContent className="px-6 pb-5 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">By department</div>
              <div className="text-xs text-muted-foreground">Annualized base total + average</div>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-3">
            {byDept.map((d) => {
              const pct = (d.total / totalAnnualized) * 100;
              return (
                <div key={d.dept}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-foreground">{d.dept}</span>
                    <span className="text-muted-foreground">
                      <span className="num text-foreground">{d.headcount}</span> people · avg{' '}
                      <span className="num text-foreground">{formatCurrency(d.avg)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="num w-24 text-right text-xs text-foreground">
                      {formatCurrency(d.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Individual records */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Pay basis</TableHead>
              <TableHead className="text-right">Base</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compRows.map((e) => (
              <TableRow key={e.id} className="hover:bg-muted/40">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">{initials(e.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{e.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.jobTitle}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.departmentName}</TableCell>
                <TableCell className="num text-xs text-muted-foreground">{e.jobLevel}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {e.compensation!.payBasis === 'salary' ? 'Salary' : 'Hourly'} ·{' '}
                    {e.compensation!.payFrequency}
                  </Badge>
                </TableCell>
                <TableCell className="num text-right text-sm font-medium text-foreground">
                  {formatCurrency(e.compensation!.base)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Every read of this page is recorded in <span className="text-foreground">audit_logs</span>.
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="px-5 pb-4 pt-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="num mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
