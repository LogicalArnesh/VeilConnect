
"use client";

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Activity,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  CalendarDays
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AISuggestions } from '@/components/dashboard/ai-suggestions';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; role: string; fullName: string; email: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('veil_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader userId={user.userId} role={user.role as any} />
      
      <main className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-headline">
              Welcome, <span className="text-primary italic">{user.fullName}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                System Status: <span className="text-accent">Operational & Secure</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="System Integrity" value="99.9%" trend="Optimal performance" icon={<ShieldCheck className="h-5 w-5 text-primary" />} />
          <StatCard title="Command Status" value="Online" trend="Network: Active" icon={<Activity className="h-5 w-5 text-accent" />} />
          <StatCard title="Network Load" value="12.4ms" trend="Low Latency" icon={<Zap className="h-5 w-5 text-emerald-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="min-h-[400px] border-border/50 shadow-xl overflow-hidden flex flex-col items-center justify-center text-center p-12">
              <div className="bg-secondary/20 p-6 rounded-full mb-6">
                <LayoutDashboard className="h-16 w-16 text-primary/40" />
              </div>
              <CardTitle className="text-2xl font-bold uppercase tracking-tight">Operational Console</CardTitle>
              <CardDescription className="max-w-md mt-4 text-base">
                Your secure interface is active. Use the AI Assistant to generate operational briefings or monitor sector telemetry in real-time.
              </CardDescription>
            </Card>
          </div>

          <div className="space-y-8">
            <AISuggestions />
            <Card className="bg-card border-border shadow-2xl overflow-hidden">
              <CardHeader className="bg-secondary/20 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-accent" />
                  Sector Telemetry
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-tighter">Live feedback from divisions</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <ProgressSection label="Intelligence Unit" value={92} color="bg-primary" />
                <ProgressSection label="Cyber Operations" value={85} color="bg-accent" />
                <ProgressSection label="Infrastructure" value={78} color="bg-emerald-600" />
                <div className="pt-4 mt-4 border-t border-border/30">
                  <p className="text-[10px] font-mono text-muted-foreground text-center uppercase tracking-widest leading-relaxed">
                    Data verified via encrypted channel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:border-primary/50 transition-all cursor-default group border-border/40 bg-card/50 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <div className="p-3 rounded-xl bg-secondary/50 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">{icon}</div>
        </div>
        <div className="flex flex-col">
          <p className="text-4xl font-black font-headline tracking-tighter text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressSection({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-black italic">{label}</span>
        <span className="font-black text-sm text-foreground tabular-nums">{value}%</span>
      </div>
      <Progress value={value} className={`h-2.5 ${color} shadow-sm`} />
    </div>
  );
}
