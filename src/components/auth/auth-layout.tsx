
"use client";

import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const logo = PlaceHolderImages.find(img => img.id === 'team-logo');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-6 rounded-full overflow-hidden border-2 border-primary/20 bg-card p-1">
             {logo && (
                <Image
                  src={logo.imageUrl}
                  alt="VEIL CONFESSIONS Logo"
                  fill
                  className="object-cover rounded-full"
                  data-ai-hint={logo.imageHint}
                />
             )}
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground font-headline uppercase">
            VEIL <span className="text-primary">CONFESSIONS</span>
          </h1>
          <p className="mt-2 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
            Secure Team Collaboration Platform
          </p>
        </div>
        <div className="bg-card border border-border shadow-2xl rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
