
"use client";

import React, { useState, useEffect } from 'react';
import { User, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  userId: string;
  role: 'admin' | 'user';
}

export function DashboardHeader({ userId, role }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istTime = now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(istTime + " (IST)");
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-1.5 border border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="bg-transparent border-none text-sm outline-none w-48 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-[11px] font-bold text-accent uppercase tracking-tighter">Current Deployment Time</span>
          <span className="text-xs font-medium text-foreground tabular-nums">
            {currentTime}
          </span>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">@{userId}</span>
              <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="capitalize h-5 px-1.5 text-[10px]">
                {role}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Veil Confessions Team</span>
          </div>
          <div className="relative h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
            <User className="h-5 w-5 text-primary" />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500"></span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-destructive"
            onClick={() => router.push('/login')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
