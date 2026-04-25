
"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Send, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const ts = searchParams.get('ts');

  const timestamp = ts ? new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }) + ' (IST)' : 'N/A';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-secondary/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center border-2 border-secondary shadow-lg shadow-secondary/10">
              <CheckCircle2 className="h-10 w-10 text-secondary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Mission Success</CardTitle>
          <p className="text-sm text-muted-foreground font-medium">Your confession has been securely logged.</p>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Submission ID</p>
              <p className="text-lg font-mono font-bold text-primary tracking-wider">{sid}</p>
            </div>
            <div className="space-y-1 border-t pt-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                <Clock className="h-3 w-3" /> Timestamp
              </p>
              <p className="text-xs font-medium text-foreground">{timestamp}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full h-12 uppercase font-bold tracking-widest bg-secondary hover:bg-secondary/90">
              <Link href="/"><Send className="mr-2 h-4 w-4" /> Send Another</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 uppercase font-bold tracking-widest border-primary/20 hover:text-primary">
              <Link href="/login"><ShieldCheck className="mr-2 h-4 w-4" /> Team Portal</Link>
            </Button>
          </div>

          <p className="text-[9px] text-center text-muted-foreground uppercase font-bold tracking-tighter opacity-60">
            This receipt is for your reference only. Your confession remains fully anonymous.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfessionSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
