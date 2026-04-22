"use client";

import React, { useState, useEffect } from 'react';
import { User, Search, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  userId: string;
  role: string;
}

export function DashboardHeader({ userId, role }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istTime = now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(istTime + " IST");
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('veil_user');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-secondary/30 rounded-full px-4 py-1.5 border border-border/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search operational files..." 
            className="bg-transparent border-none text-sm outline-none w-48 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end mr-4 border-r pr-6 border-border/50">
          <div className="flex items-center gap-2 text-accent">
            <Clock className="h-3 w-3 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Pulse</span>
          </div>
          <span className="text-xs font-bold text-foreground tabular-nums">
            {currentTime}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-foreground">@{userId}</span>
              <Badge 
                variant={role === 'HeadAdmin' ? 'default' : (role === 'admin' ? 'secondary' : 'outline')} 
                className="capitalize h-5 px-2 text-[9px] font-black tracking-tighter"
              >
                {role.replace('_', ' ')}
              </Badge>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-70">Sector 01 Command</span>
          </div>
          
          <div className="relative group cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/40 group-hover:border-primary transition-all shadow-glow">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500 shadow-sm"></span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleLogout}
            title="Terminate Session"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
