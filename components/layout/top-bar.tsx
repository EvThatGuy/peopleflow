'use client';

import Link from 'next/link';
import { Search, Bell, ChevronDown, LogOut, Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initials } from '@/lib/utils';
import { roleLabels, type AppRole } from '@/lib/auth/roles';

export function TopBar({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string;
  role: AppRole;
}) {
  const display = fullName || email;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/70 bg-background/85 px-6 backdrop-blur-md">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search people, requests, jobs..."
          className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-12 text-sm placeholder:text-muted-foreground/70 shadow-soft transition-colors focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-focus"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center rounded border border-border/70 bg-muted/70 px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          /
        </kbd>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/70 hover:text-foreground"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2.5 rounded-md border border-transparent px-1.5 py-1 transition-colors hover:border-border/70 hover:bg-muted/60 focus-visible:outline-none focus-visible:border-accent">
          <Avatar className="h-7 w-7">
            <AvatarFallback>{initials(display)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight md:block">
            <div className="text-[13px] font-medium">{display}</div>
            <div className="text-[11px] text-muted-foreground">{roleLabels[role]}</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
          <div className="px-2 pb-2 text-sm">
            <div className="font-medium leading-tight">{display}</div>
            <div className="text-[12px] text-muted-foreground">{email}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <UserIcon className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <SettingsIcon className="h-4 w-4" /> Workspace settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
