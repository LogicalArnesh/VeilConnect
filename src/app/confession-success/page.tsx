
"use client";

import React, { Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, Download, Info, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const logo = PlaceHolderImages.find(img => img.id === 'team-logo');
  
  const sid = searchParams.get('sid');
  const ts = searchParams.get('ts');

  const now = ts ? new Date(ts) : new Date();

  useEffect(() => {
    if (sid) {
      document.title = `veilconfessions_${sid}`;
    }
    return () => {
      document.title = 'VeilConnect | VEIL CONFESSIONS';
    };
  }, [sid]);

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
      toast({ title: "Key Copied", description: "Submission ID saved to clipboard." });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-secondary/15">
      <div className="max-w-xl w-full space-y-6">
        <Card ref={receiptRef} className="glass-card rounded-[3rem] overflow-hidden shadow-2xl border-white/10 print:shadow-none print:border-none print:bg-white print:rounded-none">
          <CardHeader className="text-center pb-2 bg-gradient-to-b from-secondary/10 to-transparent p-12">
            <div className="flex justify-center mb-8">
              <div className="relative h-24 w-24 bg-background rounded-[2rem] flex items-center justify-center border-2 border-secondary shadow-glow-green p-1">
                {logo && <Image src={logo.imageUrl} alt="Logo" fill className="object-cover rounded-[1.8rem]" />}
              </div>
            </div>
            <CardTitle className="text-4xl font-black text-foreground uppercase tracking-tight">Confession Receipt</CardTitle>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-2">Official Operational Record</p>
          </CardHeader>
          
          <CardContent className="p-12 space-y-10">
            <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 space-y-8 relative overflow-hidden shadow-inner print:bg-gray-50 print:border-gray-200">
               <div className="absolute top-[-20px] right-[-20px] opacity-[0.05] pointer-events-none print:hidden">
                 <ShieldCheck className="h-64 w-64 rotate-12" />
               </div>
               
               <div className="space-y-3 relative z-10">
                <p className="text-[12px] uppercase font-black text-primary tracking-[0.2em]">Unique Submission ID</p>
                <div className="flex items-center justify-between gap-6 bg-background/50 p-6 rounded-3xl border border-white/5 print:border-gray-300">
                  <p className="text-3xl font-mono font-black text-foreground tracking-widest">{sid}</p>
                  <Button size="icon" variant="ghost" className="h-12 w-12 text-muted-foreground hover:text-primary print:hidden" onClick={copyToClipboard}>
                    <Copy className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8 relative z-10 print:border-gray-200">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase font-black text-muted-foreground tracking-widest">Date Logged</p>
                  <p className="text-lg font-bold text-foreground">{dateStr.split(',')[1]}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase font-black text-muted-foreground tracking-widest">Timestamp (IST)</p>
                  <p className="text-lg font-bold text-foreground">{timeStr}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[11px] uppercase font-black text-muted-foreground tracking-widest">Operational Cycle</p>
                  <p className="text-lg font-bold text-foreground">{dateStr.split(',')[0]}, {now.getFullYear()}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 p-6 rounded-[2rem] border border-primary/20 flex gap-5 print:hidden">
              <Info className="h-8 w-8 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[12px] font-black text-primary uppercase tracking-widest">Interrogation Protocol</p>
                <p className="text-[11px] leading-relaxed font-medium text-muted-foreground">
                  Preserve this key. You must use this Submission ID to interrogate the intelligence sector regarding the status of your confession.
                </p>
              </div>
            </div>

            <div className="space-y-4 print:hidden">
              <Button onClick={handlePrint} className="w-full h-16 uppercase font-black tracking-widest text-[13px] bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 rounded-2xl">
                <Download className="mr-3 h-6 w-6" /> Save Professional Receipt
              </Button>
              <Button asChild variant="outline" className="w-full h-16 uppercase font-black tracking-widest text-[13px] border-white/10 hover:bg-white/5 rounded-2xl">
                <Link href="/"><ArrowRight className="mr-3 h-6 w-6" /> Submit Another Confession</Link>
              </Button>
            </div>

            <div className="text-center space-y-4 pt-10 border-t border-white/5 print:border-gray-200">
              <p className="text-[11px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-60">
                &copy; {now.getFullYear()} VEIL CONFESSIONS INTELLIGENCE UNIT
              </p>
              <div className="flex items-center justify-center gap-3 text-[11px] font-black text-primary uppercase tracking-widest">
                 <Mail className="h-4 w-4" />
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

