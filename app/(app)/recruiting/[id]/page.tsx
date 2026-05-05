import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobs, candidates } from '@/lib/demo-data';
import { initials } from '@/lib/utils';
import { ArrowLeft, MapPin, Briefcase, Users } from 'lucide-react';

const stageLabels: Record<string, string> = {
  applied: 'Applied',
  screen: 'Screen',
  interviewing: 'Interview',
  final_round: 'Final round',
  offer_extended: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const list = candidates.filter((c) => c.jobId === job.id);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/recruiting"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to recruiting
      </Link>

      <PageHeader title={job.title} description={`${job.departmentName} · ${job.locationName}`}>
        <Badge variant={job.status === 'open' ? 'success' : 'secondary'}>{job.status}</Badge>
        <Button variant="outline">Edit posting</Button>
        <Button>Move candidate</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Department
                </div>
                <div className="text-sm font-medium text-foreground mt-0.5">
                  {job.departmentName}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Location
                </div>
                <div className="text-sm font-medium text-foreground mt-0.5">{job.locationName}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Candidates
                </div>
                <div className="num text-sm font-medium text-foreground mt-0.5">{list.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-0 pb-0 px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No candidates have applied yet.
                  </TableCell>
                </TableRow>
              )}
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarFallback className="text-[10px] bg-muted">
                          {initials(c.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm text-foreground">{c.fullName}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{stageLabels[c.stage] ?? c.stage}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="num text-sm">{c.rating ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="num text-xs text-muted-foreground">{c.appliedAt}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Move
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
