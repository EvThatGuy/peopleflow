/**
 * Org Chart
 *
 * Renders a hierarchical reporting tree rooted at the top-of-house employee
 * (the one with no manager). Each node is an employee card with avatar, name,
 * title, and department. Lines connecting nodes are drawn with CSS borders so
 * the chart prints and exports cleanly without a charting library.
 *
 * For very large orgs (1k+ employees) a virtualized canvas approach is the
 * right move — the data shape here keeps that swap straightforward.
 */
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { employees, getDirectReports, type Employee } from '@/lib/demo-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/primitives';
import { initials } from '@/lib/utils';
import { Building2, Users, Briefcase } from 'lucide-react';

function findRoot(): Employee {
  return employees.find((e) => e.managerId === null) ?? employees[0];
}

function NodeCard({ employee, depth }: { employee: Employee; depth: number }) {
  const accent = depth === 0;
  return (
    <Link
      href={`/people/${employee.id}`}
      className="group relative inline-flex flex-col items-stretch w-[220px] rounded-md border border-border bg-card hover:border-accent/40 hover:shadow-card transition-all"
    >
      {accent && (
        <div className="absolute -top-2 left-3 px-1.5 py-0.5 bg-accent text-accent-foreground text-[10px] font-medium uppercase tracking-wider rounded-sm">
          CEO
        </div>
      )}
      <div className="p-3 flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="text-[11px] font-medium bg-muted">
            {initials(employee.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
            {employee.preferredName ?? employee.fullName}
          </div>
          <div className="text-xs text-muted-foreground truncate">{employee.jobTitle}</div>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{employee.departmentName}</span>
        {(() => {
          const reports = getDirectReports(employee.id).length;
          return reports > 0 ? (
            <span className="num inline-flex items-center gap-1 text-foreground">
              <Users className="h-3 w-3" />
              {reports}
            </span>
          ) : null;
        })()}
      </div>
    </Link>
  );
}

function Subtree({ employee, depth }: { employee: Employee; depth: number }) {
  const reports = getDirectReports(employee.id);

  return (
    <div className="flex flex-col items-center">
      <NodeCard employee={employee} depth={depth} />

      {reports.length > 0 && (
        <>
          {/* Vertical connector down from parent */}
          <div className="w-px h-6 bg-border" />

          {/* Horizontal bar connecting siblings (skip if only one child) */}
          {reports.length > 1 && (
            <div className="relative w-full">
              <div className="absolute left-0 right-0 top-0 h-px bg-border" />
            </div>
          )}

          <div className="flex items-start gap-6 pt-0 relative">
            {reports.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Connector up to horizontal bar */}
                {reports.length > 1 && <div className="w-px h-6 bg-border" />}
                {reports.length === 1 && <div className="w-px h-0" />}
                <Subtree employee={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const root = findRoot();
  const totalActive = employees.filter((e) => e.status === 'active').length;
  const managers = new Set(employees.map((e) => e.managerId).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Org chart"
        description="Live reporting structure across the company. Click any card to open the employee profile."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Active employees
          </div>
          <div className="num text-2xl font-medium tracking-tight mt-1">{totalActive}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">People managers</div>
          <div className="num text-2xl font-medium tracking-tight mt-1">{managers}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg span of control</div>
          <div className="num text-2xl font-medium tracking-tight mt-1">
            {(totalActive / Math.max(managers, 1)).toFixed(1)}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Departments</div>
          <div className="num text-2xl font-medium tracking-tight mt-1">5</div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-8 overflow-auto">
        <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          Northwind Logistics — full reporting hierarchy
          <span className="ml-auto inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> Manager
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" /> Individual contributor
            </span>
          </span>
        </div>

        <div className="min-w-fit flex justify-center pb-4">
          <Subtree employee={root} depth={0} />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <Badge variant="outline" className="mr-2">
          Tip
        </Badge>
        Reporting changes are reflected here in real time. Manager changes flow through the
        approval workflow before the chart updates.
      </div>
    </div>
  );
}
