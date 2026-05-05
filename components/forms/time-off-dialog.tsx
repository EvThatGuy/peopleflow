'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/primitives';
import { Select } from '@/components/ui/select';

export function RequestTimeOffDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent">
          <Plus className="h-4 w-4" /> Request time off
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New time off request</DialogTitle>
          <DialogDescription>Submit for manager approval. Balances update on approval.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="kind">Type</Label>
            <Select id="kind" defaultValue="vacation">
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="bereavement">Bereavement</option>
              <option value="parental">Parental</option>
              <option value="unpaid">Unpaid</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start">Start date</Label>
              <Input id="start" type="date" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end">End date</Label>
              <Input id="end" type="date" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" rows={3} placeholder="Anything your manager should know" />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          {/* TODO: POST /api/time-off — currently a no-op for the prototype */}
          <Button variant="accent" onClick={() => setOpen(false)}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
