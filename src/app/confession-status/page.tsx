
"use client";

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle2, Clock, XCircle, Download, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ConfessionStatusPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [sid, setSid] = useState('');
  const [loading, setLoading] = useState(false);
  const [confession, setConfession] = useState<any>(null);
  const [searched, setSearched] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/10 via-background to-primary/10">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all group">
             <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> Return to Command Base
          </Link>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tight">Confession Interrogation</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-60">Track your anonymous mission status</p>
        </div>

        <Card className="glass-card rounded-[2.5rem] overflow-hidden border-t-secondary/30 shadow-2xl">
          <CardHeader className="p-10 pb-0">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="ENTER SUBMISSION ID (e.g. X1Y2Z3A4)" 
                  className="pl-12 h-14 uppercase font-mono tracking-widest bg-background/40 rounded-2xl border-white/10"
                  value={sid}
                  onChange={(e) => setSid(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-14 px-8 bg-secondary hover:bg-secondary/90 text-white font-black uppercase tracking-widest rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "TRACK"}
              </Button>
            </form>
          </CardHeader>

          <CardContent className="p-10">
            {!confession && searched && !loading && (
              <div className="text-center py-16 space-y-6">
                <XCircle className="h-16 w-16 text-destructive mx-auto opacity-30" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Submission ID Not Found.</p>
              </div>
            )}

            {!searched && (
              <div className="text-center py-20 space-y-6 border-2 border-dashed rounded-[2rem] border-white/5 bg-white/5">
                <ShieldCheck className="h-20 w-20 text-secondary mx-auto opacity-20" />
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">Awaiting Identity Key</p>
              </div>
            )}

            {confession && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                      <h3 className="text-lg font-black text-primary uppercase tracking-tight">Confession Log</h3>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ID: {confession.submissionId}</p>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-black uppercase text-[10px] tracking-widest">
                      Verified Data
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-5 rounded-2xl space-y-2 border border-white/5 shadow-inner">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Logged Date</p>
                       <p className="text-sm font-bold text-foreground">{new Date(confession.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       <p className="text-[11px] text-muted-foreground font-medium">{new Date(confession.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl space-y-2 border border-white/5 shadow-inner">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sector Cycle</p>
                       <p className="text-sm font-bold text-foreground">{new Date(confession.createdAt).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                       <p className="text-[11px] text-muted-foreground font-medium">Q{Math.floor(new Date(confession.createdAt).getMonth() / 3) + 1} {new Date(confession.createdAt).getFullYear()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary border-l-4 border-primary pl-3">Lifecycle Workflow</h4>
                  <div className="space-y-6">
                     <StatusStep 
                       title="Database Receipt" 
                       description="Confession successfully encrypted and logged into the operational matrix." 
                       status="completed" 
                     />
                     <StatusStep 
                       title="Command Review" 
                       description={confession.reviewStatus === 'accepted' ? 'Confession authorized by intelligence command.' : confession.reviewStatus === 'rejected' ? 'Confession denied by command oversight.' : 'Awaiting operational clearance from command.'} 
                       status={confession.reviewStatus === 'accepted' ? 'completed' : confession.reviewStatus === 'rejected' ? 'failed' : 'pending'} 
                     />
                     <StatusStep 
                       title="Broadcast Status" 
                       description={confession.publicationStatus === 'published' ? 'Broadcast to the public sector network.' : confession.publicationStatus === 'denied' ? 'Confession broadcast restricted by command policy.' : 'Awaiting broadcast schedule.'} 
                       status={confession.publicationStatus === 'published' ? 'completed' : confession.publicationStatus === 'denied' ? 'failed' : 'pending'} 
                     />
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-[1.5rem] border border-primary/10 space-y-2">
                   <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">Authenticated Transcript</p>
                   <p className="text-sm leading-relaxed font-medium text-foreground/80 italic">
                     "{confession.content}"
                   </p>
                </div>

                <div className="flex gap-4 print:hidden">
                   <Button onClick={() => window.print()} className="flex-1 h-14 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] rounded-2xl">
                     <Download className="h-5 w-5 mr-3" /> Save Transcript
                   </Button>
                   <Button asChild variant="outline" className="flex-1 h-14 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[11px] rounded-2xl">
                     <a href="mailto:veilconfessions@gmail.com">
                       <Mail className="h-5 w-5 mr-3" /> Contact Command
                     </a>
                   </Button>
                </div>

                <div className="text-center pt-8 border-t border-white/5 opacity-40">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                    &copy; {new Date().getFullYear()} VEIL CONFESSIONS INTELLIGENCE UNIT
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusStep({ title, description, status }: { title: string, description: string, status: 'completed' | 'pending' | 'failed' }) {
  return (
    <div className="flex gap-6 items-start">
       <div className={`mt-1 h-8 w-8 rounded-xl border-2 flex items-center justify-center shrink-0 shadow-lg ${status === 'completed' ? 'bg-secondary border-secondary text-white shadow-glow-green' : status === 'failed' ? 'bg-destructive border-destructive text-white shadow-glow-red' : 'bg-background border-white/20 text-muted-foreground'}`}>
          {status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : status === 'failed' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
       </div>
       <div className="space-y-1">
         <p className={`text-xs font-black uppercase tracking-[0.2em] ${status === 'failed' ? 'text-destructive' : 'text-foreground'}`}>{title}</p>
         <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{description}</p>
       </div>
    </div>
  );
}

