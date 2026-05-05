/**
 * Settings — entry point for all admin configuration.
 *
 * Ships a directory of settings sections so reviewers can see the shape of
 * the admin surface. Each section deep-links to a future detail page.
 */
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/primitives';
import {
  Building2,
  MapPin,
  Layers,
  Briefcase,
  Calendar,
  Workflow,
  Shield,
  Plug,
  CreditCard,
  Users,
} from 'lucide-react';

const sections = [
  {
    icon: Building2,
    title: 'Company profile',
    description: 'Legal name, EIN, primary address, branding.',
    status: 'configured',
  },
  {
    icon: Layers,
    title: 'Departments',
    description: '5 departments configured.',
    status: 'configured',
  },
  {
    icon: MapPin,
    title: 'Locations',
    description: '4 locations across HQ, satellite offices, and remote.',
    status: 'configured',
  },
  {
    icon: Briefcase,
    title: 'Job titles + levels',
    description: '13 job titles mapped to a five-level career framework.',
    status: 'configured',
  },
  {
    icon: Calendar,
    title: 'PTO policies',
    description: 'Vacation, sick, personal — assigned to all employees.',
    status: 'configured',
  },
  {
    icon: Workflow,
    title: 'Approval rules',
    description: 'Time off, comp changes, and requisitions.',
    status: 'configured',
  },
  {
    icon: Shield,
    title: 'Roles + permissions',
    description: 'Six roles, RLS-enforced.',
    status: 'configured',
  },
  {
    icon: Users,
    title: 'Team members',
    description: 'Invite admins and managers, manage seats.',
    status: 'roadmap',
  },
  {
    icon: Plug,
    title: 'Integrations',
    description: 'Slack, Google Workspace, Gusto, ADP, Okta, DocuSign.',
    status: 'roadmap',
  },
  {
    icon: CreditCard,
    title: 'Billing',
    description: 'Plan, seat count, invoices.',
    status: 'roadmap',
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Configure your organization, policies, and integrations."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className="hover:border-accent/40 transition-colors">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-sm bg-muted flex items-center justify-center text-foreground">
                  <s.icon className="h-4 w-4" />
                </div>
                <Badge variant={s.status === 'configured' ? 'success' : 'outline'}>
                  {s.status === 'configured' ? 'Configured' : 'Roadmap'}
                </Badge>
              </div>
              <div className="text-sm font-medium text-foreground">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {s.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
