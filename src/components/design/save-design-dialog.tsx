'use client';

import { useState } from 'react';
import { useSaveDesign } from '@/hooks/useUserDesign';
import { ConfiguratorState } from '@/types/design';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';

interface SaveDesignDialogProps {
  state: ConfiguratorState;
  trigger?: React.ReactNode;
}

export function SaveDesignDialog({ state, trigger }: SaveDesignDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const saveMutation = useSaveDesign();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email is required');
      return;
    }

    if (!state.configuration.showerTypeId) {
      toast.error('Invalid design state: missing shower type');
      return;
    }

    try {
      await saveMutation.mutateAsync({
        userEmail: email,
        userFullName: fullName,
        userPhone: phone,
        userPostalCode: postalCode,
        designData: state,
        showerTypeId: state.configuration.showerTypeId,
      });
      
      toast.success('Design saved successfully!');
      setOpen(false);
      
      // Optional: Clear form
      // setEmail('');
      // setFullName('');
      // setPhone('');
      // setPostalCode('');
    } catch (error) {
      console.error('Failed to save design:', error);
      toast.error('Failed to save design. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save Design</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Your Design</DialogTitle>
          <DialogDescription>
            Enter your details to save your design. You can load it later using your email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email (Required)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              data-testid="user-email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name (Optional)</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              data-testid="user-name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              data-testid="user-phone"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postal">Postal Code (Optional)</Label>
            <Input
              id="postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12345"
              data-testid="user-postal-code"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saveMutation.isPending} data-testid="submit-save-design">
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Design
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
