
"use client";

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle2, Clock, XCircle, FileText, Download, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
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
        toast({ variant: "destructive", title: "Record Not Found", description: "Submission ID does not exist in the database." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Inquiry Failed", description: "System connection interrupted." });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/5 via-background to-primary/5">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4">
             <ArrowLeft className="h-3 w-3 mr-1" /> Back to Base
          </Link>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Mission Interrogation</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Track your operational submission status</p>
        </div>

        <Card className="border-secondary/20 shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="ENTER SUBMISSION ID (e.g. X1Y2Z3A4)" 
                  className="pl-10 h-11 uppercase font-mono tracking-widest bg-background/50"
                  value={sid}
                  onChange={(e) => setSid(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-11 bg-secondary hover:bg-secondary/90 text-white font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "TRACK"}
              </Button>
            </form>
          </CardHeader>

          <CardContent className="p-8">
            {!confession && searched && !loading && (
              <div className="text-center py-12 space-y-4">
                <XCircle className="h-12 w-12 text-destructive mx-auto opacity-50" />
                <p className="text-sm font-bold text-muted-foreground">No records found for that ID.</p>
              </div>
            )}

            {!searched && (
              <div className="text-center py-12 space-y-4 border-2 border-dashed rounded-2xl bg-muted/20">
                <ShieldCheck className="h-12 w-12 text-secondary mx-auto opacity-50" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Identity Key</p>
              </div>
            )}

            {confession && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="text-sm font-black text-primary uppercase tracking-widest">Inquiry Transcript</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">ID: {confession.submissionId}</p>
                    </div>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 font-black uppercase text-[10px]">
                      Verified Operative
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-xl space-y-1 border">
                       <p className="text-[9px] font-black uppercase text-muted-foreground">Submission Log</p>
                       <p className="text-xs font-bold">{new Date(confession.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                       <p className="text-[10px] text-muted-foreground">{new Date(confession.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })} IST</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-1 border">
                       <p className="text-[9px] font-black uppercase text-muted-foreground">Calendar Pulse</p>
                       <p className="text-xs font-bold">{new Date(confession.createdAt).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                       <p className="text-[10px] text-muted-foreground">Cycle {new Date(confession.createdAt).getFullYear()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Transmission Pipeline</h4>
                  <div className="space-y-4">
                     <StatusStep 
                       title="Database Receipt" 
                       description="Successfully logged into the encrypted matrix." 
                       status="completed" 
                     />
                     <StatusStep 
                       title="Command Review" 
                       description={confession.reviewStatus === 'accepted' ? 'Authorized by intelligence command.' : confession.reviewStatus === 'rejected' ? 'Denied by command oversight.' : 'Awaiting operational clearance.'} 
                       status={confession.reviewStatus === 'accepted' ? 'completed' : confession.reviewStatus === 'rejected' ? 'failed' : 'pending'} 
                     />
                     <StatusStep 
                       title="Publication Status" 
                       description={confession.publicationStatus === 'published' ? 'Broadcast to the public network.' : confession.publicationStatus === 'denied' ? 'Publication restricted by policy.' : 'Awaiting broadcast schedule.'} 
                       status={confession.publicationStatus === 'published' ? 'completed' : confession.publicationStatus === 'denied' ? 'failed' : 'pending'} 
                     />
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                   <p className="text-[10px] leading-relaxed font-medium">
                     <span className="font-bold text-primary uppercase block mb-1">Confession Content</span>
                     <span className="italic">"{confession.content}"</span>
                   </p>
                </div>

                <div className="flex gap-2 print:hidden">
                   <Button onClick={handleDownload} className="flex-1 bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[11px]">
                     <Download className="h-4 w-4 mr-2" /> Download Transcript
                   </Button>
                   <Button asChild variant="outline" className="flex-1 border-secondary/20 hover:bg-secondary/10 font-bold uppercase tracking-widest text-[11px]">
                     <a href="mailto:veilconfessions@gmail.com">
                       <Mail className="h-4 w-4 mr-2" /> Contact Admin
                     </a>
                   </Button>
                </div>

                <div className="text-center pt-4 border-t opacity-50">
                  <p className="text-[9px] font-black uppercase tracking-tighter">
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
    <div className="flex gap-4 items-start">
       <div className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${status === 'completed' ? 'bg-secondary border-secondary text-white' : status === 'failed' ? 'bg-destructive border-destructive text-white' : 'bg-background border-muted text-muted-foreground'}`}>
          {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : status === 'failed' ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
       </div>
       <div>
         <p className={`text-xs font-black uppercase tracking-widest ${status === 'failed' ? 'text-destructive' : 'text-foreground'}`}>{title}</p>
         <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
       </div>
    </div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <div className={`px-2 py-0.5 rounded-full text-[9px] border ${className}`}>
      {children}
    </div>
  );
}
