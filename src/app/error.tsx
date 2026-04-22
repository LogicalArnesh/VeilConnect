
'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RotateCcw, Home } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';

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
    <AuthLayout>
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-destructive/10 p-4 rounded-full">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">System Exception</h2>
          <p className="text-sm text-muted-foreground">
            The operational interface has encountered a client-side error. 
            No sensitive data has been compromised.
          </p>
        </div>

        <div className="bg-secondary/30 p-4 rounded-lg border border-border/50 text-left">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Error Digest</p>
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

        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          VeilConnect Security Protocol 4.0.1
        </p>
      </div>
    </AuthLayout>
  );
}
