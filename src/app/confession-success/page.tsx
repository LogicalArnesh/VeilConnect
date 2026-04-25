
"use client";

import React, { Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Send, ShieldCheck, Loader2, Copy, Download, Info, Mail } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-secondary/15">
      <div className="max-w-md w-full space-y-6">
        <Card ref={receiptRef} className="glass-card rounded-[2.5rem] overflow-hidden print:shadow-none print:border-none print:bg-white">
          <CardHeader className="text-center pb-2 bg-gradient-to-b from-secondary/15 to-transparent p-10">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-background rounded-3xl flex items-center justify-center border-2 border-secondary shadow-[0_0_30px_-5px_rgba(22,163,74,0.4)]">
                <CheckCircle2 className="h-12 w-12 text-secondary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-foreground uppercase tracking-tight">Mission Receipt</CardTitle>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Official Operational Transcript</p>
          </CardHeader>
          
          <CardContent className="p-10 space-y-8">
            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6 relative overflow-hidden shadow-inner">
               <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] pointer-events-none">
                 <ShieldCheck className="h-48 w-48 rotate-12" />
               </div>
               
               <div className="space-y-2 relative z-10">
                <p className="text-[11px] uppercase font-black text-primary tracking-[0.2em]">Unique Submission Key</p>
                <div className="flex items-center justify-between gap-4 bg-background/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-2xl font-mono font-black text-foreground tracking-widest">{sid}</p>
                  <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={copyToClipboard}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-6 relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Date Logged</p>
                  <p className="text-sm font-bold text-foreground">{dateStr.split(',')[1]}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Time (IST)</p>
                  <p className="text-sm font-bold text-foreground">{timeStr}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Operational Day</p>
                  <p className="text-sm font-bold text-foreground">{dateStr.split(',')[0]}, Cycle {now.getFullYear()}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 flex gap-4">
              <Info className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-black text-primary uppercase tracking-widest">Interrogation Protocol</p>
                <p className="text-[10px] leading-relaxed font-medium text-muted-foreground">
                  Save this key. Use it to interrogate command regarding the status or impact of your mission.
                </p>
              </div>
            </div>

            <div className="space-y-3 print:hidden">
              <Button onClick={handlePrint} className="w-full h-14 uppercase font-black tracking-widest text-[12px] bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 rounded-2xl">
                <Download className="mr-3 h-5 w-5" /> Save Transcript (PDF/IMG)
              </Button>
              <Button asChild variant="outline" className="w-full h-14 uppercase font-black tracking-widest text-[12px] border-white/10 hover:bg-white/5 rounded-2xl">
                <Link href="/"><Send className="mr-3 h-5 w-5" /> Submit Another Mission</Link>
              </Button>
            </div>

            <div className="text-center space-y-3 pt-6 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.1em] opacity-50">
                &copy; {now.getFullYear()} VEIL CONFESSIONS INTELLIGENCE UNIT
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-primary">
                 <Mail className="h-3.5 w-3.5" />
                 <span>veilconfessions@gmail.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
