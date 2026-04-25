
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, ShieldCheck, CheckCircle2, Loader2, AlertCircle, Clock, Shield, Search } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, getCountFromServer, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { sendConfessionAlertToAdmins } from '@/app/actions/email-actions';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function ConfessionLandingPage() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [confession, setConfession] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  const logo = PlaceHolderImages.find(img => img.id === 'team-logo');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium',
      }) + ' (IST)');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const adminsQuery = useMemoFirebase(() => query(collection(db, 'userProfiles')), [db]);
  const { data: allUsers } = useCollection(adminsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confession.trim()) return;
    if (!isHuman) {
      setError('Please verify your identity as a human operative.');
      return;
    }

    // Spam Protection: 5 minute cooldown
    const lastSub = localStorage.getItem('veil_last_sub');
    if (lastSub && Date.now() - parseInt(lastSub) < 300000) {
      setError('Anti-Spam Alert: Please wait 5 minutes before sending another confession.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let ip = 'Unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch (err) {
        console.warn('IP Trace Failure');
      }

      const browserFingerprint = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const coll = collection(db, 'confessions');
      const snapshot = await getCountFromServer(coll);
      const confessionNo = (snapshot.data().count || 0) + 1;

      const submissionId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const timestamp = new Date().toISOString();

      const confessionData = {
        content: confession,
        submissionId,
        confessionNo,
        ipAddress: ip,
        browserInfo: JSON.stringify(browserFingerprint),
        createdAt: timestamp,
        reviewStatus: 'pending',
        publicationStatus: 'waiting'
      };

      await addDoc(coll, confessionData);
      
      localStorage.setItem('veil_last_sub', Date.now().toString());

      const adminEmails = allUsers
        ? allUsers.filter(u => u.role === 'admin' || u.role === 'HeadAdmin').map(u => u.email)
        : [];
      
      await sendConfessionAlertToAdmins(confessionData, adminEmails);

      router.push(`/confession-success?sid=${submissionId}&ts=${encodeURIComponent(timestamp)}`);
    } catch (err: any) {
      setError('Operational failure: ' + (err.message || 'Transmission interrupted.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-secondary/10">
      
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-4 border-primary shadow-glow-red ring-8 ring-primary/5 transition-all hover:scale-105 duration-500">
             {logo && <Image src={logo.imageUrl} alt="Veil Logo" fill className="object-cover" />}
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-foreground font-headline uppercase leading-none">
              VEIL <span className="text-primary text-glow-red">CONFESSIONS</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3 bg-white/5 py-1 px-4 rounded-full border border-white/5">
              <Clock className="h-4 w-4 text-secondary animate-pulse" />
              <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] opacity-80">{currentTime}</p>
            </div>
          </div>
        </div>

        <Card className="glass-card rounded-[2.5rem] overflow-hidden border-t-primary/30">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-white/5 p-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight uppercase">Secure Submission Portal</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">End-to-End Encryption Protocol Active</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <Textarea 
                  placeholder="Send you confessions secretly!" 
                  className="min-h-[250px] text-lg resize-none focus-visible:ring-primary border-white/10 bg-background/40 rounded-3xl p-6 placeholder:text-muted-foreground/30 transition-all focus:bg-background/60 shadow-inner"
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  required
                />
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-secondary" />
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.1em]">AES-256 Sector Protection</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                    <p className="text-[10px] text-secondary font-black uppercase tracking-[0.1em]">Signal: Secure</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/20 text-destructive-foreground p-5 rounded-2xl text-xs flex items-center gap-4 border border-destructive/30 animate-in fade-in zoom-in-95 font-bold">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              <div 
                className="group flex items-center space-x-5 p-6 border rounded-[1.5rem] bg-white/5 border-white/10 hover:border-secondary/50 transition-all cursor-pointer hover:bg-secondary/5 active:scale-[0.98]" 
                onClick={() => setIsHuman(!isHuman)}
              >
                <div className={`h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${isHuman ? 'bg-secondary border-secondary shadow-glow-green' : 'bg-background border-white/20 group-hover:border-secondary/50'}`}>
                   {isHuman && <CheckCircle2 className="h-5 w-5 text-white" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-foreground uppercase tracking-tight">Identity integrity check</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Human operative verification required</span>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-16 text-xl font-black tracking-widest uppercase gap-4 bg-primary hover:bg-primary/90 shadow-[0_10px_30px_-10px_rgba(225,29,72,0.5)] rounded-2xl transition-all active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-7 w-7" /> : <Send className="h-7 w-7" />}
                {loading ? 'Transmitting...' : 'Submit Confession'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5 items-center pt-6">
          <Link href="/confession-status" className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-secondary/10 text-[11px] font-black uppercase tracking-widest text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all group shadow-sm">
            <Search className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            See Confession Status
          </Link>
          <Link href="/login" className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted-foreground border border-white/10 hover:text-primary hover:bg-primary/5 transition-all group">
            <ShieldCheck className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            TEAM COMMAND LOGIN
          </Link>
        </div>
        
        <div className="text-center pt-10 border-t border-white/5 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
             &copy; {new Date().getFullYear()} VEIL CONFESSIONS INTELLIGENCE UNIT.
           </p>
           <p className="text-[8px] mt-2 font-bold text-muted-foreground uppercase tracking-widest">Authorized Operations Sector 01</p>
        </div>
      </div>
    </div>
  );
}
