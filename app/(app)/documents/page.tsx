'use client';

/**
 * Documents — company policies + employee documents with visibility-aware view.
 *
 * In production: replace the in-memory `documents` array with Supabase RSC
 * reads. RLS policies in 0002_rls.sql already enforce the four visibility
 * levels (employee_and_hr, hr_only, company, manager_chain) — the UI here
 * trusts the database to filter rows.
 */

import { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Lock,
  Globe,
  UserCog,
  GitBranch,
  Upload,
  MoreHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, Input } from '@/components/ui/primitives';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  documents,
  type CompanyDocument,
  type DocumentKind,
  type DocumentVisibility,
} from '@/lib/demo-data';
import { formatDate } from '@/lib/utils';

const VISIBILITY_META: Record<
  DocumentVisibility,
  { label: string; tone: 'secondary' | 'destructive' | 'accent' | 'outline'; icon: React.ComponentType<{ className?: string }> }
> = {
  company: { label: 'Company-wide', tone: 'accent', icon: Globe },
  employee_and_hr: { label: 'Employee + HR', tone: 'outline', icon: UserCog },
  hr_only: { label: 'HR only', tone: 'destructive', icon: Lock },
  manager_chain: { label: 'Manager chain', tone: 'secondary', icon: GitBranch },
};

const KIND_LABEL: Record<DocumentKind, string> = {
  offer_letter: 'Offer letter',
  handbook: 'Handbook',
  policy: 'Policy',
  tax_form: 'Tax form',
  review: 'Review',
  agreement: 'Agreement',
  identification: 'Identification',
  other: 'Other',
};

export default function DocumentsPage() {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<string>('all');
  const [vis, setVis] = useState<string>('all');

  const companyAck = useMemo(() => documents.filter((d) => d.visibility === 'company' && d.acknowledgedRequired), []);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (kind !== 'all' && d.kind !== kind) return false;
      if (vis !== 'all' && d.visibility !== vis) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !d.name.toLowerCase().includes(needle) &&
          !(d.ownerName ?? '').toLowerCase().includes(needle) &&
          !d.uploadedBy.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
  }, [q, kind, vis]);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 pb-16 pt-8">
      <PageHeader
        title="Documents"
        description="Policies, offer letters, tax forms, and reviews — all governed by row-level visibility."
      >
        <Button variant="outline" size="sm">
          <ShieldCheck className="h-3.5 w-3.5" />
          Acknowledgements
        </Button>
        <Button size="sm" variant="accent">
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </PageHeader>

      {/* Acknowledgement banner — top of mind for HR admins */}
      {companyAck.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="flex items-center gap-4 px-5 pb-4 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Required acknowledgements</div>
              <div className="text-xs text-muted-foreground">
                {companyAck.length} company-wide documents require employee sign-off.
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-right">
              {companyAck.slice(0, 1).map((d) => (
                <div key={d.id} className="text-xs text-muted-foreground">
                  <span className="num text-foreground">
                    {d.acknowledgedCount} / {d.totalRequired}
                  </span>{' '}
                  on <span className="text-foreground">{d.name}</span>
                </div>
              ))}
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                View campaign →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documents, owners, uploaders…"
            className="pl-9"
          />
        </div>
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="w-[180px]">
          <option value="all">All types</option>
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={vis} onChange={(e) => setVis(e.target.value)} className="w-[180px]">
          <option value="all">All visibility</option>
          {Object.entries(VISIBILITY_META).map(([v, m]) => (
            <option key={v} value={v}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44%]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => {
              const v = VISIBILITY_META[d.visibility];
              const VIcon = v.icon;
              return (
                <TableRow key={d.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {d.ownerName ? `${d.ownerName} · ` : ''}
                          <span className="num">{(d.sizeKb / 1000).toFixed(2)} MB</span>
                          {d.acknowledgedRequired && (
                            <>
                              {' · '}
                              <span className="text-accent">Acknowledgement required</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{KIND_LABEL[d.kind]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <VIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant={v.tone}>{v.label}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.uploadedBy}</TableCell>
                  <TableCell className="num text-right text-xs text-muted-foreground">
                    {formatDate(d.uploadedAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No documents match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <span className="num text-foreground">{filtered.length}</span> of{' '}
          <span className="num text-foreground">{documents.length}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          Visibility enforced by Postgres RLS
        </span>
      </div>
    </div>
  );
}
