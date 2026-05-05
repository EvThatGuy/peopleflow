/**
 * Analytics — workforce reporting surface.
 *
 * Ships a real headcount-trend chart and a department-growth breakdown sourced
 * from the demo data layer. The deeper modules (turnover, retention cohorts,
 * comp summaries gated to authorized roles, custom report builder) are
 * roadmap items — flagged honestly below.
 */
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import { HeadcountChart } from '@/components/charts/headcount-chart';
import { departments, headcountTrend, employees, getOpenJobs } from '@/lib/demo-data';
import { TrendingUp, Users, Briefcase, BarChart3, Lock } from 'lucide-react';

export default function AnalyticsPage() {
  const max = Math.max(...departments.map((d) => d.headcount));

  const tiles = [
    { label: 'Total headcount', value: employees.filter((e) => e.status === 'active').length, icon: Users, hint: 'Active employees' },
    { label: 'Hiring pipeline', value: getOpenJobs().length, icon: Briefcase, hint: 'Open requisitions' },
    { label: 'Headcount delta', value: '+3', icon: TrendingUp, hint: 'Last 12 months' },
    { label: 'Review completion', value: '82%', icon: BarChart3, hint: 'Q4 2025 cycle' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analytics"
        description="Workforce reporting across headcount, hiring, time off, performance, and compensation."
      >
        <Badge variant="outline">Custom reports on roadmap</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </span>
                <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="num text-2xl font-medium tracking-tight">{t.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-7">
          <CardHeader>
            <CardTitle>Headcount trend</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <HeadcountChart data={headcountTrend} />
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-5">
          <CardHeader>
            <CardTitle>Department breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departments.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{d.name}</span>
                    <span className="num text-muted-foreground">{d.headcount}</span>
                  </div>
                  <div className="h-1.5 mt-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(d.headcount / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <div className="text-sm font-medium text-foreground">
                Compensation analytics is gated to HR + admin
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Comp summaries, pay equity reports, and salary band coverage are scoped to roles that can see compensation by RLS. Custom report builder, turnover cohorts, and retention curves are on the roadmap.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
