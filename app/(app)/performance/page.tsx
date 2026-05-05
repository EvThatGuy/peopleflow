'use client';

/**
 * Performance — review cycle progress + active goals.
 *
 * In production: replace `performanceReviews` and `goals` with Supabase RSC
 * reads. The cycle picker should query distinct `cycle` values from the
 * `performance_reviews` table.
 */

import { useMemo, useState } from 'react';
import { TrendingUp, Target, Plus, Star, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  performanceReviews,
  goals,
  type PerformanceReview,
  type Goal,
} from '@/lib/demo-data';
import { initials, formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<PerformanceReview['status'], { label: string; tone: 'secondary' | 'warning' | 'accent' | 'success' }> = {
  not_started: { label: 'Not started', tone: 'secondary' },
  self_review: { label: 'Self-review', tone: 'warning' },
  manager_review: { label: 'Manager review', tone: 'accent' },
  calibration: { label: 'Calibration', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
};

const GOAL_TONE: Record<Goal['status'], { label: string; tone: 'success' | 'warning' | 'destructive' | 'accent'; bar: string }> = {
  on_track: { label: 'On track', tone: 'success', bar: 'bg-success' },
  at_risk: { label: 'At risk', tone: 'warning', bar: 'bg-warning' },
  off_track: { label: 'Off track', tone: 'destructive', bar: 'bg-destructive' },
  completed: { label: 'Completed', tone: 'accent', bar: 'bg-accent' },
};

const GOAL_CATEGORY_LABEL: Record<Goal['category'], string> = {
  business: 'Business',
  craft: 'Craft',
  leadership: 'Leadership',
  culture: 'Culture',
};

export default function PerformancePage() {
  const cycle = 'Q1 2026';
  const [tab, setTab] = useState<'reviews' | 'goals'>('reviews');

  const cycleReviews = useMemo(
    () => performanceReviews.filter((r) => r.cycle === cycle),
    [cycle],
  );

  const summary = useMemo(() => {
    const total = cycleReviews.length;
    const completed = cycleReviews.filter((r) => r.status === 'completed').length;
    const inProgress = cycleReviews.filter((r) => r.status !== 'completed' && r.status !== 'not_started').length;
    const avgRating = (() => {
      const rated = cycleReviews.filter((r) => r.rating !== null);
      if (rated.length === 0) return null;
      return rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length;
    })();
    return { total, completed, inProgress, avgRating };
  }, [cycleReviews]);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 pb-16 pt-8">
      <PageHeader
        title="Performance"
        description="Quarterly reviews, goals, and 1:1 feedback. Calibrated across managers."
      >
        <Button variant="outline" size="sm">
          <Target className="h-3.5 w-3.5" />
          Add goal
        </Button>
        <Button size="sm" variant="accent">
          <Plus className="h-3.5 w-3.5" />
          Open review cycle
        </Button>
      </PageHeader>

      {/* Cycle summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile label={`${cycle} cycle`} value={`${summary.completed} / ${summary.total}`} sub="Reviews completed" />
        <SummaryTile label="In progress" value={summary.inProgress} sub="Self & manager phases" />
        <SummaryTile
          label="Avg. rating"
          value={summary.avgRating !== null ? summary.avgRating.toFixed(1) : '—'}
          sub="Of completed reviews"
        />
        <SummaryTile label="Active goals" value={goals.length} sub={`${goals.filter((g) => g.status === 'on_track').length} on track`} />
      </div>

      {/* Tab switch */}
      <div className="flex items-center gap-1 border-b border-border">
        <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')}>
          Reviews
        </TabButton>
        <TabButton active={tab === 'goals'} onClick={() => setTab('goals')}>
          Goals
        </TabButton>
      </div>

      {tab === 'reviews' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycleReviews.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">{initials(r.employeeName)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{r.employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.reviewerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.cycle}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_LABEL[r.status].tone}>{STATUS_LABEL[r.status].label}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.rating ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < r.rating! ? 'fill-warning text-warning' : 'text-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="num text-xs text-muted-foreground">{r.ratingLabel}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="num text-right text-xs text-muted-foreground">
                    {formatDate(r.dueDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((g) => {
            const tone = GOAL_TONE[g.status];
            return (
              <Card key={g.id}>
                <CardContent className="px-5 pb-5 pt-5">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                      {g.status === 'completed' ? (
                        <Trophy className="h-4 w-4 text-accent" />
                      ) : (
                        <Target className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{g.title}</span>
                        <Badge variant="outline">{GOAL_CATEGORY_LABEL[g.category]}</Badge>
                        <Badge variant={tone.tone}>{tone.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.description}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${tone.bar} transition-all`}
                              style={{ width: `${g.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="num text-xs text-foreground">{g.progress}%</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          Owner: <span className="text-foreground">{g.employeeName}</span>
                        </span>
                        <span className="num">Due {formatDate(g.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" aria-hidden />
      )}
    </button>
  );
}
