'use client';

import { useState } from 'react';
import { useLoadDesigns, UserDesign } from '@/hooks/useUserDesign';
import { ConfiguratorState } from '@/types/design';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderOpen, Calendar, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface LoadDesignDialogProps {
  onLoad: (state: ConfiguratorState) => void;
  trigger?: React.ReactNode;
}

export function LoadDesignDialog({ onLoad, trigger }: LoadDesignDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  
  const { data: designs, isLoading, isError, refetch } = useLoadDesigns(email);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    setSearched(true);
    refetch();
  };

  const handleLoad = (design: UserDesign) => {
    try {
      onLoad(design.designData);
      toast.success('Design loaded successfully!');
      setOpen(false);
    } catch (error) {
      console.error('Error loading design:', error);
      toast.error('Failed to load design data');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Load Design</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Load Saved Design</DialogTitle>
          <DialogDescription>
            Enter your email address to find your saved designs.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2 py-4">
          <div className="grid gap-2 flex-1">
            <Label htmlFor="load-email" className="sr-only">Email</Label>
            <Input
              id="load-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              data-testid="load-email-input"
            />
          </div>
          <Button type="submit" disabled={isLoading} data-testid="search-designs-button">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </form>

        <div className="flex-1 overflow-hidden min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full text-destructive">
              Failed to load designs. Please try again.
            </div>
          ) : searched && designs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <FolderOpen className="h-12 w-12 opacity-20" />
              <p>No designs found for this email.</p>
            </div>
          ) : searched && designs && designs.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4" data-testid="design-list">
              <div className="space-y-3">
                {designs.map((design) => (
                  <div
                    key={design.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => handleLoad(design)}
                    data-testid="design-item"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {design.designData.configuration.showerTypeName || 'Custom Shower'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {design.designData.configuration.plumbingConfig || 'Standard'}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(design.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span>
                          {Object.keys(design.designData.selectedProducts).length} items
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <FolderOpen className="h-12 w-12 opacity-20" />
              <p>Enter your email to search for designs</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
