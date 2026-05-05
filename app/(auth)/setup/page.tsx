import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/primitives';
import { Select } from '@/components/ui/select';

export default function CompanyOnboardingPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-accent">Step 2 of 2</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Set up your workspace.</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">A few details and you're in.</p>
      </div>

      <form className="mt-8 space-y-4 rounded-lg border border-border/70 bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label htmlFor="legal-name">Legal company name</Label>
          <Input id="legal-name" placeholder="Acme Inc." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="size">Team size</Label>
          <Select id="size" defaultValue="11-50">
            <option value="1-10">1–10</option>
            <option value="11-50">11–50</option>
            <option value="51-200">51–200</option>
            <option value="201-500">201–500</option>
            <option value="500+">500+</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Primary country</Label>
          <Select id="country" defaultValue="US">
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Your role</Label>
          <Select id="role" defaultValue="hr">
            <option value="founder">Founder / CEO</option>
            <option value="hr">Head of People / HR</option>
            <option value="ops">Operations</option>
            <option value="finance">Finance</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <Button asChild className="w-full" variant="accent">
          <Link href="/dashboard">Open workspace</Link>
        </Button>
      </form>
    </div>
  );
}
