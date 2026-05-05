import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/primitives';

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="font-serif text-3xl tracking-tight">Welcome back.</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">Sign in to your PeopleFlow workspace.</p>
      </div>

      <form className="mt-8 space-y-4 rounded-lg border border-border/70 bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-[12px] text-muted-foreground hover:text-foreground">
              Forgot?
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
        </div>

        {/*
          TODO: Wire to Supabase auth.signInWithPassword. Demo mode bypasses
          this entirely (see middleware + lib/auth/session).
        */}
        <Button asChild className="w-full" variant="accent">
          <Link href="/dashboard">Sign in</Link>
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
          <div className="relative flex justify-center"><span className="bg-card px-2 text-[11px] text-muted-foreground">or</span></div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Continue with Google</Link>
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        New to PeopleFlow?{' '}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}
