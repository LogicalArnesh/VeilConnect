
"use client";

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowRight, Loader2, ShieldCheck, Check, Copy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo-ai-veil.png';
  const bannerUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/71/Logo-long-veil.png';
  const [copied, setCopied] = useState(false);
  
  const sid = searchParams.get('sid');
  const ts = searchParams.get('ts');
  const cno = searchParams.get('cno');

  const now = ts ? new Date(ts) : new Date();

  useEffect(() => {
    if (sid) {
      document.title = `veilconfessions_${sid}`;
    }
  }, [sid]);

  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'long'
  });
  
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' IST';

  const copySid = () => {
    if (sid) {
      navigator.clipboard.writeText(sid);
      setCopied(true);
      toast({ title: "Key Copied", description: "Submission ID copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 print:p-0 print:bg-white" data-unhackable="true">
      <div className="max-w-[420px] w-full space-y-6 print:max-w-full">
        {/* Restaurant style receipt */}
        <Card ref={receiptRef} className="bg-white text-black rounded-none shadow-2xl border-none font-mono text-[11px] relative overflow-hidden print:shadow-none print:w-full print:border-none print:m-0">
          <div className="h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zy4=')] bg-repeat-x print:hidden"></div>
          
          <CardHeader className="text-center pt-10 pb-6 border-b-2 border-dashed border-gray-300">
            <div className="flex justify-center mb-6">
              <div className="relative h-24 w-24 bg-white rounded-2xl overflow-hidden p-2 border border-gray-100">
                  <Image 
                    src={logoUrl} 
                    alt="VeiL Logo" 
                    fill
                    className="object-contain" 
                    unoptimized
                  />
              </div>
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase">VeiLConfeSsions</h2>
            <p className="opacity-70 text-[9px] font-bold tracking-[0.2em] mt-1">SUBMISSION SECTOR COMMAND</p>
            <p className="opacity-50 text-[8px] mt-2">AUTH TOKEN: V-{(Math.random()*90000 + 10000).toFixed(0)}</p>
          </CardHeader>
          
          <CardContent className="p-10 space-y-8">
            <div className="text-center space-y-2">
              <p className="font-black text-xs uppercase tracking-[0.3em] text-green-600">SUBMISSION SUCCESSFUL</p>
              <div className="flex justify-center gap-1 opacity-20">
                {[...Array(20)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-black rounded-full" />)}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold opacity-60 uppercase tracking-tighter">LOG INDEX:</span>
                <span className="font-black text-sm">VeiL#{cno || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold opacity-60">SECURITY:</span>
                <div className="flex items-center gap-1 text-green-600">
                   <span className="font-black">AES-256 SYNCED</span>
                </div>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold opacity-60">DATE:</span>
                <span className="font-bold">{dateStr}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold opacity-60">TIME (IST):</span>
                <span className="font-bold">{timeStr}</span>
              </div>
              <div className="pt-4 flex flex-col items-center gap-3">
                <span className="font-black text-[9px] opacity-40 uppercase tracking-widest">SUBMISSION KEY</span>
                <div className="flex gap-2 w-full">
                  <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex-1 text-center rounded flex items-center justify-center">
                    <span className="font-black text-base tracking-tighter text-primary">{sid}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded border-gray-200 print:hidden"
                    onClick={copySid}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-8 text-center space-y-6">
              <div className="flex justify-center flex-col items-center gap-2">
                 <div className="flex gap-[2px] h-10 items-end opacity-90">
                    {[1,4,2,5,1,3,2,1,4,1,2,5,1,2,3,1,2,5,1,4,2,5,1,3].map((h, i) => (
                      <div key={i} className="bg-black w-[2px]" style={{height: `${100-h*10}%`}}></div>
                    ))}
                 </div>
                 <span className="text-[7px] font-bold opacity-30">VEIL-INTEL-SYNC-NODE-01</span>
              </div>
              
              <div className="bg-gray-100/50 p-4 rounded-lg space-y-4">
                <div className="flex justify-center">
                  <img src={bannerUrl} alt="VeiL Banner" className="w-full max-w-[200px] h-auto opacity-80" />
                </div>
                <p className="text-[9px] leading-relaxed font-bold italic opacity-70">
                  RETAIN THIS RECEIPT: Your submission is now encrypted and queued for command review. All data is handled under Sector 01 security protocols.
                </p>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-200 pt-8 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <ShieldCheck className="h-3 w-3" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px]">Submission Verified</p>
              </div>
              <div className="text-[8px] opacity-40 leading-tight font-bold">
                (C) {new Date().getFullYear()} VeiLConnect INTELLIGENCE.<br/>
                AUTHORIZED PERSONNEL ONLY.
              </div>
            </div>
          </CardContent>

          <div className="h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0id2hpdGUiLz48L3N2Zy4=')] bg-repeat-x print:hidden"></div>
        </Card>

        <div className="space-y-4 print:hidden px-4">
          <Button onClick={() => window.print()} className="w-full h-16 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-glow-red transition-all active:scale-[0.98]">
            <Download className="mr-3 h-6 w-6" /> Save Receipt (PDF)
          </Button>
          <Button asChild variant="outline" className="w-full h-16 glass-card rounded-2xl font-black uppercase tracking-widest text-[11px] text-foreground border-white/20 hover:bg-white/10">
            <Link href="/"><ArrowRight className="mr-3 h-6 w-6" /> New Transmission</Link>
          </Button>
        </div>

        <div className="text-center print:hidden pb-10">
          <Link href="/confession-status" className="text-[10px] font-black uppercase text-primary hover:underline tracking-widest opacity-60 hover:opacity-100">Interrogate Status</Link>
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
