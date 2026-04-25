"use client";

import React, { Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Send, ShieldCheck, Loader2, Copy, Check, Download, Info } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const sid = searchParams.get('sid');
  const ts = searchParams.get('ts');

  const now = ts ? new Date(ts) : new Date();
  
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });
  
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' IST';

  const copyToClipboard = () => {
    if (sid) {
      navigator.clipboard.writeText(sid);
      toast({ title: "ID Copied", description: "Submission ID saved to clipboard." });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-secondary/5">
      <div className="max-w-md w-full space-y-6">
        <Card ref={receiptRef} className="border-secondary/20 shadow-2xl overflow-hidden print:shadow-none print:border-none">
          <CardHeader className="text-center pb-2 bg-gradient-to-b from-secondary/10 to-transparent">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center border-2 border-secondary shadow-lg shadow-secondary/10">
                <CheckCircle2 className="h-10 w-10 text-secondary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Mission Receipt</CardTitle>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">VeilConnect Official Transcript</p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            <div className="bg-muted/30 rounded-2xl p-6 border border-border space-y-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-5">
                 <ShieldCheck className="h-24 w-24 rotate-12" />
               </div>
               
               <div className="space-y-1 relative z-10">
                <p className="text-[10px] uppercase font-black text-primary tracking-widest">Submission Key</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xl font-mono font-black text-foreground tracking-wider">{sid}</p>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Date</p>
                  <p className="text-xs font-bold text-foreground">{dateStr.split(',')[1]}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Time</p>
                  <p className="text-xs font-bold text-foreground">{timeStr}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Day & Year</p>
                  <p className="text-xs font-bold text-foreground">{dateStr.split(',')[0]}, {now.getFullYear()}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[10px] leading-relaxed font-medium">
                <span className="font-bold text-primary uppercase block mb-1">Interrogation Protocol</span>
                Using this Submission ID, you may interrogate command regarding the status or impact of your confession.
              </p>
            </div>

            <div className="space-y-3 print:hidden">
              <Button onClick={handlePrint} className="w-full h-12 uppercase font-bold tracking-widest bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20">
                <Download className="mr-2 h-4 w-4" /> Save Receipt (PDF/IMG)
              </Button>
              <Button asChild variant="outline" className="w-full h-12 uppercase font-bold tracking-widest border-primary/20 hover:text-primary hover:bg-primary/5">
                <Link href="/"><Send className="mr-2 h-4 w-4" /> Send Another</Link>
              </Button>
            </div>

            <div className="text-center space-y-2 pt-4 border-t print:block">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">
                &copy; {now.getFullYear()} VEIL CONFESSIONS INTELLIGENCE UNIT
              </p>
              <p className="text-[9px] text-muted-foreground font-medium">
                Contact: <span className="text-primary">veilconfessions@gmail.com</span>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center print:hidden">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Team Authentication Portal
          </Link>
        </div>
      </div>
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