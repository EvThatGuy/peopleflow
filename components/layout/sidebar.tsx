'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Network,
  ClipboardCheck,
  UserMinus,
  Calendar,
  Clock,
  Wallet,
  Briefcase,
  TrendingUp,
  FileText,
  GitBranch,
  Sparkles,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { AppRole } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: AppRole[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/assistant', label: 'AI Assistant', icon: Sparkles },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/people', label: 'Directory', icon: Users },
      { href: '/org-chart', label: 'Org chart', icon: Network },
      {
        href: '/onboarding',
        label: 'Onboarding',
        icon: ClipboardCheck,
        roles: ['super_admin', 'company_admin', 'hr_manager', 'manager'],
      },
      {
        href: '/offboarding',
        label: 'Offboarding',
        icon: UserMinus,
        roles: ['super_admin', 'company_admin', 'hr_manager', 'manager'],
      },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { href: '/time-off', label: 'Time off', icon: Calendar },
      { href: '/time-tracking', label: 'Time tracking', icon: Clock },
      {
        href: '/compensation',
        label: 'Compensation',
        icon: Wallet,
        roles: ['super_admin', 'company_admin', 'hr_manager'],
      },
    ],
  },
  {
    label: 'Talent',
    items: [
      {
        href: '/recruiting',
        label: 'Recruiting',
        icon: Briefcase,
        roles: ['super_admin', 'company_admin', 'hr_manager', 'manager'],
      },
      { href: '/performance', label: 'Performance', icon: TrendingUp },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/documents', label: 'Documents', icon: FileText },
      {
        href: '/workflows',
        label: 'Workflows',
        icon: GitBranch,
        roles: ['super_admin', 'company_admin', 'hr_manager', 'manager'],
      },
      {
        href: '/analytics',
        label: 'Analytics',
        icon: BarChart3,
        roles: ['super_admin', 'company_admin', 'hr_manager'],
      },
      {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        roles: ['super_admin', 'company_admin', 'hr_manager'],
      },
    ],
  },
];

export function Sidebar({
  role,
  organizationName,
}: {
  role: AppRole;
  organizationName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent text-[11px] font-semibold tracking-tight text-sidebar-accent-foreground">
          PF
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">PeopleFlow</span>
          <span className="text-[11px] text-sidebar-foreground/55">{organizationName}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV.map((group) => {
          const visible = group.items.filter((it) => !it.roles || it.roles.includes(role));
          if (!visible.length) return null;
          return (
            <div key={group.label} className="mb-5">
              <div className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/45">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
                          active
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-md bg-white/5 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-sidebar-foreground/55">
            Demo workspace
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-sidebar-foreground/75">
            Sample data for {organizationName}. All actions are read-only.
          </p>
        </div>
      </div>
    </aside>
  );
}
