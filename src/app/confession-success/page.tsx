
"use client";

import React, { Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Info, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 print:p-0">
      <div className="max-w-[400px] w-full space-y-6">
        {/* Restaurant style receipt */}
        <Card ref={receiptRef} className="bg-white text-black rounded-none shadow-xl border-none font-mono text-[12px] relative overflow-hidden print:shadow-none print:w-full">
          {/* Jagged edge effect (top) */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zy4=')] bg-repeat-x"></div>
          
          <CardHeader className="text-center pt-10 pb-4 border-b-2 border-dashed border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="relative h-16 w-16 grayscale opacity-80">
                {logo && <Image src={logo.imageUrl} alt="Logo" fill className="object-contain" />}
              </div>
            </div>
            <h2 className="text-lg font-black tracking-tighter uppercase">Veil Confessions</h2>
            <p className="opacity-70 text-[10px]">INTEL SECTOR 01-C</p>
            <p className="opacity-70 text-[10px]">AUTH NO: {Math.floor(Math.random()*900000 + 100000)}</p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <p className="font-bold text-sm uppercase">Submission Receipt</p>
              <p className="text-[10px] opacity-60">******************************</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>DATE:</span>
                <span className="font-bold">{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME:</span>
                <span className="font-bold">{timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span>METHOD:</span>
                <span className="font-bold">E2E ENCRYPTED</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-200 pt-4">
                <span className="font-bold">SUBMISSION ID:</span>
                <span className="font-black text-sm tracking-tighter">{sid}</span>
              </div>
            </div>

            <div className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                 {/* Simple mock barcode */}
                 <div className="flex gap-[1px] h-10 items-end">
                    {[1,3,2,4,1,5,2,1,3,1,2,4,1,2,3,1,2,4,1,3].map((h, i) => (
                      <div key={i} className="bg-black w-[2px]" style={{height: `${100-h*10}%`}}></div>
                    ))}
                 </div>
              </div>
              <p className="text-[9px] opacity-70 px-4 leading-tight italic">
                Save this receipt for interrogation of the intelligence sector. Status can be interrogated via our status portal.
              </p>
            </div>

            <div className="border-t-2 border-dashed border-gray-200 pt-6 text-center space-y-1">
              <p className="font-bold uppercase tracking-widest">Thank you for your intel</p>
              <p className="text-[9px] opacity-50">SISTEM SYNC VERIFIED</p>
            </div>
          </CardContent>

          {/* Jagged edge effect (bottom) */}
          <div className="h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0id2hpdGUiLz48L3N2Zy4=')] bg-repeat-x"></div>
        </Card>

        <div className="space-y-3 print:hidden px-4">
          <Button onClick={handlePrint} className="w-full h-12 bg-black text-white hover:bg-black/90 rounded-xl font-bold uppercase tracking-widest text-xs">
            <Download className="mr-2 h-4 w-4" /> Save Receipt (PDF)
          </Button>
          <Button asChild variant="outline" className="w-full h-12 border-gray-300 rounded-xl font-bold uppercase tracking-widest text-xs">
            <Link href="/"><ArrowRight className="mr-2 h-4 w-4" /> New Submission</Link>
          </Button>
        </div>

        <div className="text-center print:hidden">
          <Link href="/confession-status" className="text-[10px] font-black uppercase text-primary hover:underline">Interrogate Status Portal</Link>
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
