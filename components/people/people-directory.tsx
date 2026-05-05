'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, Input } from '@/components/ui/primitives';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { departments, employees, locations, type Employee } from '@/lib/demo-data';
import { initials, formatDate } from '@/lib/utils';

const STATUS_BADGE: Record<Employee['status'], { variant: 'success' | 'warning' | 'secondary' | 'destructive'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  pending_start: { variant: 'warning', label: 'Pending start' },
  on_leave: { variant: 'secondary', label: 'On leave' },
  offboarding: { variant: 'warning', label: 'Offboarding' },
  terminated: { variant: 'destructive', label: 'Terminated' },
};

export function PeopleDirectory() {
  const [q, setQ] = useState('');
  const [dept, setDept] = useState<string>('all');
  const [loc, setLoc] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (dept !== 'all' && e.departmentId !== dept) return false;
      if (loc !== 'all' && e.locationId !== loc) return false;
      if (status !== 'all' && e.status !== status) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !e.fullName.toLowerCase().includes(needle) &&
          !e.email.toLowerCase().includes(needle) &&
          !e.jobTitle.toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [q, dept, loc, status]);

  return (
    <div className="space-y-5">
      {/* ----- Filter row ----- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, title, or email"
              className="pl-9"
            />
          </div>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[180px]">
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select value={loc} onChange={(e) => setLoc(e.target.value)} className="max-w-[160px]">
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[160px]">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending_start">Pending start</option>
            <option value="on_leave">On leave</option>
            <option value="offboarding">Offboarding</option>
          </Select>
        </div>
        <Button variant="accent">
          <Plus className="h-4 w-4" /> Add person
        </Button>
      </div>

      <div className="text-[12px] text-muted-foreground">
        <span className="num font-medium text-foreground">{filtered.length}</span> of{' '}
        <span className="num">{employees.length}</span> people
      </div>

      {/* ----- Table ----- */}
      <div className="overflow-hidden rounded-md border border-border/70 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => {
              const badge = STATUS_BADGE[e.status];
              return (
                <TableRow key={e.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/people/${e.id}`} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials(e.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="text-[13px] font-medium">{e.fullName}</div>
                        <div className="text-[11px] text-muted-foreground">{e.email}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px]">{e.jobTitle}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{e.departmentName}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{e.locationName}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{e.managerName ?? '—'}</TableCell>
                  <TableCell className="num text-[13px] text-muted-foreground">
                    {formatDate(e.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-[13px] text-muted-foreground">
                  No matches. Try clearing some filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
