
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, getCountFromServer, query } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { sendConfessionAlertToAdmins } from '@/app/actions/email-actions';
import { useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase';

export default function ConfessionLandingPage() {
  const db = useFirestore();
  const router = useRouter();
  const [confession, setConfession] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logo = PlaceHolderImages.find(img => img.id === 'team-logo');

  // To fetch admin emails for notification
  const adminsQuery = useMemoFirebase(() => query(collection(db, 'userProfiles')), [db]);
  const { data: allUsers } = useCollection(adminsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confession.trim()) return;
    if (!isHuman) {
      setError('Please verify that you are human.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get IP Address
      let ip = 'Unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch (err) {
        console.warn('Could not fetch IP');
      }

      // Get Confession Count
      const coll = collection(db, 'confessions');
      const snapshot = await getCountFromServer(coll);
      const confessionNo = snapshot.data().count + 1;

      const submissionId = Math.random().toString(36).substring(2, 12).toUpperCase();
      const timestamp = new Date().toISOString();

      const confessionData = {
        content: confession,
        submissionId,
        confessionNo,
        ipAddress: ip,
        browserInfo: navigator.userAgent,
        createdAt: timestamp,
      };

      await addDoc(coll, confessionData);

      // Notify Admins
      const adminEmails = allUsers
        ? allUsers.filter(u => u.role === 'admin' || u.role === 'HeadAdmin').map(u => u.email)
        : [];
      
      await sendConfessionAlertToAdmins(confessionData, adminEmails);

      router.push(`/confession-success?sid=${submissionId}&ts=${encodeURIComponent(timestamp)}`);
    } catch (err) {
      setError('Operational failure. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-xl">
             {logo && <Image src={logo.imageUrl} alt="Logo" fill className="object-cover" />}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-foreground font-headline uppercase">
              VEIL <span className="text-primary">CONFESSIONS</span>
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.3em] text-xs">Unfiltered. Anonymous. Secure.</p>
          </div>
        </div>

        <Card className="border-border shadow-2xl bg-card overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> 
              Secure Submission Portal
            </CardTitle>
            <CardDescription>
              Your identity is protected by the Veil Encryption Protocol. No login required.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Textarea 
                  placeholder="What is your confession?" 
                  className="min-h-[200px] text-lg resize-none focus-visible:ring-primary border-primary/20"
                  value={confession}
                  onChange={(e) => setConfession(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-right">Encrypted Line: 256-bit AES</p>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-xs flex items-center gap-2 border border-destructive/20 animate-in fade-in zoom-in-95">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex items-center space-x-3 p-4 border rounded-lg bg-secondary/5 border-secondary/20 transition-all hover:bg-secondary/10 cursor-pointer" onClick={() => setIsHuman(!isHuman)}>
                <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isHuman ? 'bg-secondary border-secondary' : 'bg-background border-border'}`}>
                   {isHuman && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <Image src="https://picsum.photos/seed/captcha/20/20" width={20} height={20} alt="Captcha" className="grayscale opacity-50" />
                  I am a human operative
                </span>
              </div>

              <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold tracking-widest uppercase gap-2 bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                {loading ? 'Dispatching...' : 'Submit Confession'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center pt-8">
          <Link href="/login" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 group">
            <ShieldCheck className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            TEAM LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
