'use client';

/**
 * Workflows — generic approval queue across all kinds.
 *
 * This is the "inbox" view of the approval engine described in
 * ARCHITECTURE.md §6. Every approvable action — time off, comp changes,
 * requisitions, offboardings, document acknowledgements — lands here.
 *
 * In production: replace `workflowItems` with a Supabase RSC query against
 * `workflows` + `workflow_steps` filtered to the current user's pending
 * approvals (where `workflow_steps.assignee_id = session.userId AND
 * decision = 'pending'`).
 */

import { useMemo, useState } from 'react';
import {
  Calendar,
  DollarSign,
  Briefcase,
  UserMinus,
  FileCheck,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { workflowItems, type WorkflowItem } from '@/lib/demo-data';
import { initials, formatDate } from '@/lib/utils';

const KIND_META: Record<
  WorkflowItem['kind'],
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  time_off: { label: 'Time off', icon: Calendar, tone: 'text-accent' },
  comp_change: { label: 'Compensation', icon: DollarSign, tone: 'text-success' },
  requisition: { label: 'Requisition', icon: Briefcase, tone: 'text-foreground' },
  offboarding: { label: 'Offboarding', icon: UserMinus, tone: 'text-destructive' },
  document_ack: { label: 'Document', icon: FileCheck, tone: 'text-muted-foreground' },
};

const FILTERS: Array<{ value: 'all' | WorkflowItem['kind']; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'time_off', label: 'Time off' },
  { value: 'comp_change', label: 'Compensation' },
  { value: 'requisition', label: 'Requisitions' },
  { value: 'offboarding', label: 'Offboarding' },
  { value: 'document_ack', label: 'Documents' },
];

export default function WorkflowsPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [kind, setKind] = useState<'all' | WorkflowItem['kind']>('all');

  const filtered = useMemo(() => {
    return workflowItems.filter((w) => {
      if (tab === 'pending' && w.status !== 'pending') return false;
      if (kind !== 'all' && w.kind !== kind) return false;
      return true;
    });
  }, [tab, kind]);

  const pendingCount = workflowItems.filter((w) => w.status === 'pending').length;
  const overdueCount = workflowItems.filter((w) => {
    if (w.status !== 'pending') return false;
    return new Date(w.dueBy) < new Date('2026-05-04');
  }).length;

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 pb-16 pt-8">
      <PageHeader
        title="Approvals"
        description="Every approval — time off, comp changes, requisitions, offboardings — flows through one engine."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile label="Pending" value={pendingCount} />
        <SummaryTile
          label="Overdue"
          value={overdueCount}
          tone={overdueCount > 0 ? 'warning' : undefined}
        />
        <SummaryTile label="Approved this week" value={workflowItems.filter((w) => w.status === 'approved').length} />
        <SummaryTile label="Median time-to-decision" value="6h" sub="−2h vs. last quarter" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
          Pending {pendingCount > 0 && <span className="num text-accent">({pendingCount})</span>}
        </TabButton>
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
          All
        </TabButton>
      </div>

      {/* Kind filter chips */}
      <div className="-mt-3 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setKind(f.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              kind === f.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nothing in this view. The queue is clear.
            </div>
          ) : (
            filtered.map((w) => {
              const meta = KIND_META[w.kind];
              const Icon = meta.icon;
              const isOverdue =
                w.status === 'pending' && new Date(w.dueBy) < new Date('2026-05-04');
              return (
                <div key={w.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                    <Icon className={`h-4 w-4 ${meta.tone}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{w.subject}</span>
                      <Badge variant="outline">{meta.label}</Badge>
                      {w.amount && (
                        <span className="num text-xs text-muted-foreground">{w.amount}</span>
                      )}
                      {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      {w.status === 'approved' && <Badge variant="success">Approved</Badge>}
                      {w.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {initials(w.requester)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground">{w.requester}</span>
                      <span>→</span>
                      <span>{w.approver}</span>
                      <span>·</span>
                      <span className="num">{w.step}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 num">
                        <Clock className="h-3 w-3" />
                        Due {formatDate(w.dueBy)}
                      </span>
                    </div>
                  </div>
                  {w.status === 'pending' && (
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
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="text-xs text-muted-foreground">
        Showing <span className="num text-foreground">{filtered.length}</span> of{' '}
        <span className="num text-foreground">{workflowItems.length}</span> workflows.
        Every approval and rejection appends a row to <span className="text-foreground">audit_logs</span>.
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
