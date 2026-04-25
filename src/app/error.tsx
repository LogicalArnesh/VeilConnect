'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RotateCcw, Home, Mail } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('System Exception Details:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-8 border border-border rounded-2xl shadow-2xl">
        <div className="flex justify-center">
          <div className="bg-destructive/10 p-4 rounded-full">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">System Exception</h2>
          <p className="text-sm text-muted-foreground">
            The operational interface has encountered an error. 
            Sensitive data remains secure.
          </p>
        </div>

        <div className="bg-secondary/30 p-4 rounded-lg border border-border/50 text-left">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Error Trace</p>
          <p className="text-xs font-mono text-destructive break-all">
            {error.message || 'An unexpected runtime exception occurred.'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()} 
            className="w-full h-11"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-establish Connection
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full h-11"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Command Base
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            VeilConnect Security Protocol 4.0.5
          </p>
          <a href="mailto:veilconfessions@gmail.com" className="text-[10px] font-bold text-primary flex items-center justify-center gap-1 hover:underline">
            <Mail className="h-3 w-3" /> veilconfessions@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}