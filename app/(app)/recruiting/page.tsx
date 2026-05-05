/**
 * Recruiting / ATS — listing of open jobs and candidate pipeline.
 */
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { jobs, candidates } from '@/lib/demo-data';
import { Briefcase, Users, MapPin, ArrowUpRight } from 'lucide-react';

const stages = [
  { id: 'applied', label: 'Applied' },
  { id: 'screen', label: 'Screen' },
  { id: 'interviewing', label: 'Interview' },
  { id: 'final_round', label: 'Final round' },
  { id: 'offer_extended', label: 'Offer' },
] as const;

export default function RecruitingPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Recruiting"
        description="Open requisitions and candidate pipeline. Convert hired candidates straight into onboarding profiles."
      >
        <Button>Post a job</Button>
      </PageHeader>

      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Open requisitions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((j) => (
            <Link key={j.id} href={`/recruiting/${j.id}`}>
              <Card className="hover:border-accent/40 transition-colors h-full">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="h-9 w-9 rounded-sm bg-accent/10 text-accent flex items-center justify-center">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <Badge variant={j.status === 'open' ? 'success' : 'secondary'}>{j.status}</Badge>
                  </div>
                  <div className="text-sm font-medium text-foreground">{j.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{j.departmentName}</div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {j.locationName}
                    </span>
                    <span className="num inline-flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {candidates.filter((c) => c.jobId === j.id).length} candidates
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Candidate pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stages.map((s) => {
            const list = candidates.filter((c) => c.stage === s.id);
            return (
              <Card key={s.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <span className="num text-xs text-foreground">{list.length}</span>
                  </div>
                  <div className="space-y-2">
                    {list.length === 0 && (
                      <div className="text-xs text-muted-foreground italic">No candidates</div>
                    )}
                    {list.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs p-2 rounded-sm bg-muted/40 border border-border"
                      >
                        <div className="text-foreground font-medium truncate">{c.fullName}</div>
                        <div className="text-muted-foreground truncate mt-0.5">{c.jobTitle}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <ArrowUpRight className="h-4 w-4 text-accent mt-0.5" />
            <div>
              <div className="text-sm font-medium text-foreground">
                On the roadmap for this module
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Drag-and-drop pipeline editing, interview scorecards, calendar-integrated scheduling, offer letter generation, and one-click conversion of a hired candidate into an onboarding profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
