/**
 * ModuleStub — used for the 12 modules whose schema, RLS, and seed data are
 * shipped in the database layer but whose pages are roadmap items. Keeps the
 * navigation real (so reviewers can see the full surface area) while being
 * honest about what is and is not built end-to-end.
 */
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/primitives';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Item = { label: string; status: 'shipped' | 'planned' };

export function ModuleStub({
  title,
  description,
  status,
  capabilities,
  shippedNote,
  next,
}: {
  title: string;
  description: string;
  status?: string;
  capabilities: Item[];
  shippedNote?: string;
  next?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={title} description={description}>
        <Badge variant="outline">{status ?? 'Roadmap'}</Badge>
      </PageHeader>

      {shippedNote && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-accent mb-1.5">
              Already shipped
            </div>
            <p className="text-sm text-foreground leading-relaxed">{shippedNote}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Module capabilities
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {capabilities.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {c.status === 'shipped' ? (
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="text-sm text-foreground">{c.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.status === 'shipped' ? 'Available now' : 'Roadmap'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {next && (
        <Link
          href={next.href}
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline w-fit"
        >
          {next.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
