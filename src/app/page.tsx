
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
import { collection, addDoc, getCountFromServer, query } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { sendConfessionAlertToAdmins } from '@/app/actions/email-actions';
import { useCollection, useMemoFirebase } from '@/firebase';

export default function ConfessionLandingPage() {
  const db = useFirestore();
  const router = useRouter();
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
      setError('Please verify your human identity.');
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
        console.warn('Could not fetch public IP');
      }

      const browserFingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: navigator.cookieEnabled,
        hardwareConcurrency: navigator.hardwareConcurrency,
        touchPoints: navigator.maxTouchPoints,
        colorDepth: window.screen.colorDepth,
      };

      const coll = collection(db, 'confessions');
      const snapshot = await getCountFromServer(coll);
      const confessionNo = (snapshot.data().count || 0) + 1;

      const submissionId = Math.random().toString(36).substring(2, 12).toUpperCase();
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

      const adminEmails = allUsers
        ? allUsers.filter(u => u.role === 'admin' || u.role === 'HeadAdmin').map(u => u.email)
        : [];
      
      await sendConfessionAlertToAdmins(confessionData, adminEmails);

      router.push(`/confession-success?sid=${submissionId}&ts=${encodeURIComponent(timestamp)}`);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError('Operational failure: ' + (err.message || 'Transmission interrupted.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-secondary/5 -z-10" />
      
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-2xl ring-8 ring-primary/10">
             {logo && <Image src={logo.imageUrl} alt="Logo" fill className="object-cover" />}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-foreground font-headline uppercase leading-none">
              VEIL <span className="text-primary">CONFESSIONS</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Clock className="h-3 w-3 text-secondary animate-pulse" />
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">{currentTime}</p>
            </div>
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl rounded-3xl overflow-hidden border-t-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/40 p-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Secure Submission Portal</CardTitle>
                <CardDescription className="text-xs font-medium">Your identity is protected by AES-256 Encryption.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Textarea 
                  placeholder="Send your confessions secretly!" 
                  className="min-h-[220px] text-lg resize-none focus-visible:ring-primary border-border bg-background/50 rounded-2xl p-5 placeholder:text-muted-foreground/50 transition-all focus:bg-background"
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  required
                />
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-secondary" />
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">End-to-End Encrypted</p>
                  </div>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">Active Link: Secured</p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-xs flex items-center gap-3 border border-destructive/20 animate-in fade-in zoom-in-95 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div 
                className="group flex items-center space-x-4 p-5 border rounded-2xl bg-background/40 border-border hover:border-secondary/40 transition-all cursor-pointer hover:bg-secondary/5" 
                onClick={() => setIsHuman(!isHuman)}
              >
                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${isHuman ? 'bg-secondary border-secondary scale-110' : 'bg-background border-border group-hover:border-secondary/50'}`}>
                   {isHuman && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Human Operative Verification</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Mission integrity check required</span>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-16 text-xl font-black tracking-widest uppercase gap-3 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
                {loading ? 'Dispatching...' : 'Submit Confession'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 items-center pt-4">
          <Link href="/confession-status" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-secondary/10 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-secondary/20 transition-all group">
            <Search className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            See Confession Status
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group">
            <ShieldCheck className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            TEAM LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
