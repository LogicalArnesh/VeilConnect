
"use client";

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle2, Clock, XCircle, Download, ShieldCheck, ArrowLeft, Calendar, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ConfessionStatusPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [sid, setSid] = useState('');
  const [loading, setLoading] = useState(false);
  const [confession, setConfession] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const logo = PlaceHolderImages.find(img => img.id === 'team-logo');

  useEffect(() => {
    if (confession && sid) {
      document.title = `veilconfessions_${sid}_confession_status`;
    }
  }, [confession, sid]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sid.trim()) return;

    setLoading(true);
    setSearched(true);
    setConfession(null);

    try {
      const q = query(collection(db, 'confessions'), where('submissionId', '==', sid.trim().toUpperCase()), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setConfession({ ...snap.docs[0].data(), id: snap.docs[0].id });
      } else {
        toast({ variant: "destructive", title: "Record Not Found", description: "Submission ID does not exist in our secure database." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Inquiry Failed", description: "System connection interrupted." });
    } finally {
      setLoading(false);
    }
  };

  const formatIST = (dateStr: string | null) => {
    if (!dateStr) return "PENDING";
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + " IST";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/10 via-background to-primary/10 print:bg-white print:p-0" data-unhackable="true">
      <div className="max-w-2xl w-full space-y-8 print:max-w-full">
        <div className="text-center space-y-4 print:hidden">
          <Link href="/" className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all group">
             <ArrowLeft className="h-4 w-4 mr-2" /> Return to Command Base
          </Link>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tight">Status Interrogation</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-60">Track your encrypted transmission sector status</p>
        </div>

        <Card className="glass-card rounded-[2.5rem] overflow-hidden border-t-secondary/30 shadow-2xl print:shadow-none print:border-none print:rounded-none">
          <CardHeader className="p-10 pb-0 print:hidden">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="ENTER SUBMISSION ID" 
                  className="pl-12 h-14 uppercase font-mono tracking-widest bg-background/40 rounded-2xl"
                  value={sid}
                  onChange={(e) => setSid(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-14 px-8 bg-secondary hover:bg-secondary/90 text-white font-black uppercase rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "TRACK"}
              </Button>
            </form>
          </CardHeader>

          <CardContent className="p-10 print:p-8">
            {!confession && searched && !loading && (
              <div className="text-center py-16 space-y-6">
                <XCircle className="h-16 w-16 text-destructive mx-auto opacity-30" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Identity Record Not Found.</p>
              </div>
            )}

            {!searched && (
              <div className="text-center py-20 space-y-6 border-2 border-dashed rounded-[2rem] border-white/5 bg-white/5">
                <ShieldCheck className="h-20 w-20 text-secondary mx-auto opacity-20" />
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">Awaiting Key Input</p>
              </div>
            )}

            {confession && (
              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6 print:border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 relative">
                        {logo && <Image src={logo.imageUrl} alt="Logo" fill className="object-contain" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-primary uppercase">Confession Log Report</h3>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ID: {confession.submissionId}</p>
                      </div>
                    </div>
                    <div className="text-right hidden print:block">
                      <p className="text-[10px] font-black">OFFICIAL STATUS REPORT</p>
                      <p className="text-[10px] opacity-60">LOG TIME: {formatIST(new Date().toISOString())}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-5 rounded-2xl space-y-2 border border-white/5 print:bg-gray-50 print:border-gray-200">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                         <Calendar className="h-3 w-3" /> Initial Transmission
                       </p>
                       <p className="text-xs font-bold text-foreground">{formatIST(confession.createdAt)}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl space-y-2 border border-white/5 print:bg-gray-50 print:border-gray-200">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                         <Shield className="h-3 w-3" /> SECURITY STATUS
                       </p>
                       <p className="text-xs font-black text-secondary">AES-256 ENCRYPTED</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary border-l-4 border-primary pl-3">Operational Lifecycle</h4>
                  <div className="space-y-6">
                     <StatusStep 
                       title="Uplink Sync" 
                       description="Confession encrypted and synced to the secure database." 
                       status="completed" 
                       timestamp={formatIST(confession.createdAt)}
                     />
                     <StatusStep 
                       title="Command Authorization" 
                       description={confession.reviewStatus === 'accepted' ? 'Authorized by Command Sector.' : confession.reviewStatus === 'rejected' ? 'Access denied by Command Sector.' : 'Awaiting operational authorization.'} 
                       status={confession.reviewStatus === 'accepted' ? 'completed' : confession.reviewStatus === 'rejected' ? 'failed' : 'pending'} 
                       timestamp={formatIST(confession.reviewStatusChangedAt)}
                     />
                     <StatusStep 
                       title="Global Broadcast" 
                       description={confession.publicationStatus === 'published' ? 'Broadcasting to public network.' : confession.publicationStatus === 'denied' ? 'Broadcast restricted by policy.' : 'Awaiting broadcast schedule.'} 
                       status={confession.publicationStatus === 'published' ? 'completed' : confession.publicationStatus === 'denied' ? 'failed' : 'pending'} 
                       timestamp={formatIST(confession.publicationStatusChangedAt)}
                     />
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-[1.5rem] border border-primary/10 space-y-2 print:bg-gray-50 print:border-gray-200">
                   <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">Transcript Excerpt</p>
                   <p className="text-xs italic text-foreground/80 font-mono">"{confession.content.substring(0, 100)}..."</p>
                </div>

                <div className="flex gap-4 print:hidden">
                   <Button onClick={() => window.print()} className="flex-1 h-14 bg-primary hover:bg-primary/90 font-black uppercase rounded-2xl text-[10px] tracking-widest">
                     <Download className="h-5 w-5 mr-3" /> Save Status Report (PDF)
                   </Button>
                </div>

                <div className="text-center opacity-40 pt-10 border-t border-white/5 print:border-gray-200">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]">Official VeiLConnect Intelligence Document (c) {new Date().getFullYear()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusStep({ title, description, status, timestamp }: { title: string, description: string, status: 'completed' | 'pending' | 'failed', timestamp?: string }) {
  return (
    <div className="flex gap-6 items-start group">
       <div className={`mt-1 h-10 w-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${status === 'completed' ? 'bg-secondary border-secondary text-white shadow-glow-green' : status === 'failed' ? 'bg-destructive border-destructive text-white' : 'bg-background border-white/20 text-muted-foreground'}`}>
          {status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : status === 'failed' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
       </div>
       <div className="space-y-1 flex-1">
         <div className="flex justify-between items-start">
           <p className="text-xs font-black uppercase tracking-[0.2em]">{title}</p>
           {status !== 'pending' && <span className="text-[9px] font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded uppercase">{timestamp}</span>}
         </div>
         <p className="text-[11px] text-muted-foreground font-medium">{description}</p>
       </div>
    </div>
  );
}
