'use client';

/**
 * Onboarding — pending-start employees with checklist progress.
 *
 * In production: replace the in-memory queries with Supabase RSC reads against
 * `employees` (status = 'pending_start') joined with `onboarding_tasks`. RLS
 * already restricts visibility to HR + the employee's manager chain.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Plus,
  Laptop,
  FileText,
  GraduationCap,
  Users,
  KeyRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  getUpcomingOnboarding,
  onboardingTasks,
  getOnboardingProgress,
  type OnboardingTask,
} from '@/lib/demo-data';
import { initials, formatDate } from '@/lib/utils';

const CATEGORY_ICON: Record<OnboardingTask['category'], React.ComponentType<{ className?: string }>> = {
  paperwork: FileText,
  equipment: Laptop,
  accounts: KeyRound,
  training: GraduationCap,
  intro: Users,
};

const STATUS_META: Record<
  OnboardingTask['status'],
  { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  done: { icon: CheckCircle2, tone: 'text-success', label: 'Done' },
  in_progress: { icon: Clock, tone: 'text-warning', label: 'In progress' },
  todo: { icon: CircleDashed, tone: 'text-muted-foreground', label: 'To do' },
  blocked: { icon: AlertCircle, tone: 'text-destructive', label: 'Blocked' },
};

const ASSIGNEE_LABEL: Record<OnboardingTask['assigneeRole'], string> = {
  hr: 'People Ops',
  manager: 'Manager',
  it: 'IT',
  employee: 'Self',
};

export default function OnboardingPage() {
  const hires = getUpcomingOnboarding();
  const [expanded, setExpanded] = useState<string | null>(hires[0]?.id ?? null);

  const summary = useMemo(() => {
    const total = onboardingTasks.length;
    const done = onboardingTasks.filter((t) => t.status === 'done').length;
    const blocked = onboardingTasks.filter((t) => t.status === 'blocked').length;
    return { total, done, blocked, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, []);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 pb-16 pt-8">
      <PageHeader
        title="Onboarding"
        description="Track every new hire from offer-accepted to day-30. Tasks are auto-assigned from role-aware templates."
      >
        <Button variant="outline" size="sm">
          <FileText className="h-3.5 w-3.5" />
          Templates
        </Button>
        <Button size="sm" variant="accent">
          <Plus className="h-3.5 w-3.5" />
          Start onboarding
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile label="Pending starts" value={hires.length} />
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
        <SummaryTile label="Avg. time-to-productive" value="14d" sub="−2d vs. last quarter" />
      </div>

      <div className="flex flex-col gap-3">
        {hires.map((h) => {
          const tasks = onboardingTasks.filter((t) => t.employeeId === h.id);
          const progress = getOnboardingProgress(h.id);
          const isOpen = expanded === h.id;
          return (
            <Card key={h.id} className="overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : h.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/40"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback>{initials(h.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{h.fullName}</span>
                    <Badge variant="warning">Starts {formatDate(h.startDate)}</Badge>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {h.jobTitle} · {h.departmentName} · {h.locationName}
                  </div>
                </div>
                <div className="hidden w-48 shrink-0 sm:block">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Onboarding</span>
                    <span className="num text-foreground">{progress.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground num">
                    {progress.done} of {progress.total} done
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
                          <div
                            className={`flex items-center gap-1.5 text-[11px] ${STATUS_META[t.status].tone}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {STATUS_META[t.status].label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 text-xs text-muted-foreground">
                    <span>
                      Manager: <span className="text-foreground">{h.managerName ?? '—'}</span>
                    </span>
                    <Link href={`/people/${h.id}`} className="text-accent hover:underline">
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
