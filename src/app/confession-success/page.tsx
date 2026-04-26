"use client";

import React, { Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function SuccessContent() {
  const searchParams = useSearchParams();
  const receiptRef = useRef<HTMLDivElement>(null);
  const logo = PlaceHolderImages.find(img => img.id === 'team-logo');
  
  const sid = searchParams.get('sid');
  const ts = searchParams.get('ts');

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
    weekday: 'short'
  });
  
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' IST';

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 print:p-0 print:bg-white" data-unhackable="true">
      <div className="max-w-[400px] w-full space-y-6 print:max-w-full">
        {/* Restaurant style receipt */}
        <Card ref={receiptRef} className="bg-white text-black rounded-none shadow-xl border-none font-mono text-[11px] relative overflow-hidden print:shadow-none print:w-full print:border-none">
          {/* Jagged edge effect (top) */}
          <div className="h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zy4=')] bg-repeat-x print:hidden"></div>
          
          <CardHeader className="text-center pt-8 pb-4 border-b-2 border-dashed border-gray-300">
            <div className="flex justify-center mb-4">
              <div className="relative h-14 w-14 grayscale opacity-90">
                {logo && <Image src={logo.imageUrl} alt="Logo" fill className="object-contain" />}
              </div>
            </div>
            <h2 className="text-base font-black tracking-tighter uppercase">Veil Confessions</h2>
            <p className="opacity-70 text-[9px] font-bold">INTEL SECTOR 01-C COMMAND</p>
            <p className="opacity-70 text-[9px] font-bold tracking-widest mt-1">AUTH TOKEN: V-{(Math.random()*9000 + 1000).toFixed(0)}</p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <p className="font-black text-sm uppercase tracking-widest">Transmission Receipt</p>
              <p className="text-[10px] opacity-40">------------------------------</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>SECTOR LOG:</span>
                <span className="font-black">#FS-{(Math.random()*1000).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span className="font-bold">{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME:</span>
                <span className="font-bold">{timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span>PROTOCOL:</span>
                <span className="font-black">AES-256 E2E</span>
              </div>
              <div className="flex justify-between border-t-2 border-dashed border-gray-200 pt-4">
                <span className="font-black">SUBMISSION ID:</span>
                <span className="font-black text-xs tracking-tighter">{sid}</span>
              </div>
            </div>

            <div className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                 {/* Barcode Mock */}
                 <div className="flex gap-[1.5px] h-8 items-end opacity-80">
                    {[1,3,2,4,1,5,2,1,3,1,2,4,1,2,3,1,2,4,1,3,2,4].map((h, i) => (
                      <div key={i} className="bg-black w-[1.5px]" style={{height: `${100-h*10}%`}}></div>
                    ))}
                 </div>
              </div>
              <p className="text-[9px] opacity-70 px-4 leading-tight italic font-bold">
                NOTICE: Save this cryptogram for interrogation of the intelligence sector. Status reports are live on the interrogation portal.
              </p>
            </div>

            <div className="border-t-2 border-dashed border-gray-200 pt-6 text-center space-y-2">
              <p className="font-black uppercase tracking-[0.2em] text-[10px]">Transmission Verified</p>
              <div className="text-[8px] opacity-60 leading-tight">
                (C) {new Date().getFullYear()} VEIL CONNECT INTEL.<br/>
                AUTHORIZED PERSONNEL ONLY.
              </div>
            </div>
          </CardContent>

          {/* Jagged edge effect (bottom) */}
          <div className="h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0id2hpdGUiLz48L3N2Zy4=')] bg-repeat-x print:hidden"></div>
        </Card>

        <div className="space-y-3 print:hidden px-4">
          <Button onClick={() => window.print()} className="w-full h-14 bg-black text-white hover:bg-black/90 rounded-2xl font-black uppercase tracking-widest text-[10px]">
            <Download className="mr-3 h-5 w-5" /> Save Receipt (PDF)
          </Button>
          <Button asChild variant="outline" className="w-full h-14 border-gray-300 rounded-2xl font-black uppercase tracking-widest text-[10px]">
            <Link href="/"><ArrowRight className="mr-3 h-5 w-5" /> New Submission</Link>
          </Button>
        </div>

        <div className="text-center print:hidden">
          <Link href="/confession-status" className="text-[10px] font-black uppercase text-primary hover:underline tracking-widest">Interrogate Status Portal</Link>
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