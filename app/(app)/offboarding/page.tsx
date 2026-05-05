'use client';

/**
 * Offboarding — departing employees with task progress and last-day metadata.
 *
 * In production: replace the in-memory queries with Supabase RSC reads against
 * `employees` (status = 'offboarding') joined with `offboarding_tasks`. The
 * "Final paycheck" line should reflect actual `payroll_exports` records once
 * the export is generated.
 */

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Plus,
  KeyRound,
  Laptop,
  FileText,
  BookOpen,
  CreditCard,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  employees,
  offboardingTasks,
  offboardingMeta,
  type OffboardingTask,
} from '@/lib/demo-data';
import { initials, formatDate } from '@/lib/utils';

const CATEGORY_ICON: Record<OffboardingTask['category'], React.ComponentType<{ className?: string }>> = {
  paperwork: FileText,
  knowledge: BookOpen,
  equipment: Laptop,
  access: KeyRound,
  final: CreditCard,
};

const STATUS_META: Record<
  OffboardingTask['status'],
  { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  done: { icon: CheckCircle2, tone: 'text-success', label: 'Done' },
  in_progress: { icon: Clock, tone: 'text-warning', label: 'In progress' },
  todo: { icon: CircleDashed, tone: 'text-muted-foreground', label: 'To do' },
  blocked: { icon: AlertCircle, tone: 'text-destructive', label: 'Blocked' },
};

const ASSIGNEE_LABEL: Record<OffboardingTask['assigneeRole'], string> = {
  hr: 'People Ops',
  manager: 'Manager',
  it: 'IT',
  employee: 'Self',
};

export default function OffboardingPage() {
  const departing = employees.filter((e) => e.status === 'offboarding');
  const [expanded, setExpanded] = useState<string | null>(departing[0]?.id ?? null);

  const summary = useMemo(() => {
    const total = offboardingTasks.length;
    const done = offboardingTasks.filter((t) => t.status === 'done').length;
    const blocked = offboardingTasks.filter((t) => t.status === 'blocked').length;
    return { total, done, blocked, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, []);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 pb-16 pt-8">
      <PageHeader
        title="Offboarding"
        description="Track departing employees through equipment return, access revocation, knowledge transfer, and final pay."
      >
        <Button variant="outline" size="sm">
          <FileText className="h-3.5 w-3.5" />
          Templates
        </Button>
        <Button size="sm" variant="accent">
          <Plus className="h-3.5 w-3.5" />
          Start offboarding
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile label="In progress" value={departing.length} />
        <SummaryTile
          label="Tasks complete"
          value={`${summary.done} / ${summary.total}`}
          sub={`${summary.pct}% across cohort`}
        />
        <SummaryTile
          label="Blocked tasks"
          value={summary.blocked}
          tone={summary.blocked > 0 ? 'warning' : undefined}
        />
        <SummaryTile label="Avg. checklist time" value="9d" sub="Last-day to fully closed" />
      </div>

      {departing.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No active offboarding workflows.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {departing.map((e) => {
          const tasks = offboardingTasks.filter((t) => t.employeeId === e.id);
          const meta = offboardingMeta[e.id];
          const done = tasks.filter((t) => t.status === 'done').length;
          const pct = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
          const isOpen = expanded === e.id;

          return (
            <Card key={e.id} className="overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : e.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/40"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback>{initials(e.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{e.fullName}</span>
                    {meta && (
                      <Badge variant="warning">
                        <Calendar className="mr-1 h-3 w-3" />
                        Last day {formatDate(meta.lastDay)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {e.jobTitle} · {e.departmentName} · {meta?.reason ?? '—'}
                  </div>
                </div>
                <div className="hidden w-48 shrink-0 sm:block">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Checklist</span>
                    <span className="num text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground num">
                    {done} of {tasks.length} done
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-border bg-muted/30">
                  <div className="divide-y divide-border">
                    {tasks.map((t) => {
                      const Icon = CATEGORY_ICON[t.category];
                      const StatusIcon = STATUS_META[t.status].icon;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-card"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-foreground">{t.title}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {ASSIGNEE_LABEL[t.assigneeRole]} · Due {formatDate(t.dueDate)}
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[11px] ${STATUS_META[t.status].tone}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {STATUS_META[t.status].label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 text-xs text-muted-foreground">
                    <span>
                      Manager: <span className="text-foreground">{e.managerName ?? '—'}</span>
                      {meta?.rehireEligible && (
                        <>
                          {' · '}
                          <span className="text-success">Rehire eligible</span>
                        </>
                      )}
                    </span>
                    <Link href={`/people/${e.id}`} className="text-accent hover:underline">
                      Open profile →
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
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
