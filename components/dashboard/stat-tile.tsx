import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatTile({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: { direction: 'up' | 'down' | 'neutral'; value: string };
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-md border border-border/70 bg-card p-5 shadow-soft transition-shadow hover:shadow-card',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="num text-3xl font-semibold tracking-tight">{value}</span>
        {delta ? (
          <span
            className={cn(
              'num text-[11px] font-medium',
              delta.direction === 'up' && 'text-success',
              delta.direction === 'down' && 'text-destructive',
              delta.direction === 'neutral' && 'text-muted-foreground',
            )}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-[12px] text-muted-foreground">{hint}</p> : null}
      {href ? (
        <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      ) : null}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
