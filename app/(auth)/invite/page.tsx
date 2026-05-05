import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/primitives';

export default function InvitePage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-accent">Invitation</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Join Northwind Logistics.</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Marina Vasquez invited you as an Employee. Set a password to accept.
        </p>
      </div>

      <form className="mt-8 space-y-4 rounded-lg border border-border/70 bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" placeholder="Your name" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" />
        </div>
        <Button asChild className="w-full" variant="accent">
          <Link href="/dashboard">Accept invite</Link>
        </Button>
      </form>
    </div>
  );
}
