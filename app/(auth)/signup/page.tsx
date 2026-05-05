import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/primitives';

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="font-serif text-3xl tracking-tight">Create your workspace.</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">14-day free trial. No credit card required.</p>
      </div>

      <form className="mt-8 space-y-4 rounded-lg border border-border/70 bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" placeholder="Marina Vasquez" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" placeholder="Acme Inc." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" />
        </div>

        {/* TODO: Wire to Supabase auth.signUp + create organization + first membership. */}
        <Button asChild className="w-full" variant="accent">
          <Link href="/setup">Continue</Link>
        </Button>

        <p className="text-[11px] text-muted-foreground">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
