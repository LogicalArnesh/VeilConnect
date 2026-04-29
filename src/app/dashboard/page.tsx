
"use client";

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShieldCheck, 
  Trash2, 
  MessageSquareQuote,
  Globe,
  Search,
  Zap,
  Loader2,
  CheckCircle2,
  Clock,
  Check,
  X,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendRoleChangeEmail } from '@/app/actions/email-actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useMemoFirebase } from '@/firebase';

export default function DashboardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('online');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const confessionsQuery = useMemoFirebase(() => query(collection(db, 'confessions'), orderBy('createdAt', 'desc')), [db]);
  const { data: confessions, isLoading: isConfessionsLoading } = useCollection(confessionsQuery);

  useEffect(() => {
    const storedUser = localStorage.getItem('veil_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    const unsubAll = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    return () => {
      unsubAll();
    };
  }, [router, db]);

  const updateStatus = async (status: string) => {
    if (!currentUser) return;
    setCurrentStatus(status);
    try {
      await setDoc(doc(db, 'presence', currentUser.userId), {
        status: status,
        lastSeen: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Presence Updated", description: `State is now ${status.toUpperCase()}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Presence Sync Failed" });
    }
  };

  const setConfessionStatus = async (ids: string | string[], type: 'review' | 'publication', status: string) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (idArray.length === 0) return;

    if (idArray.length === 1) setUpdatingId(idArray[0]);
    else setIsBulkUpdating(true);

    const now = new Date().toISOString();
    
    try {
      const promises = idArray.map(async (id) => {
        const confRef = doc(db, 'confessions', id);
        let updatePayload: any = {};
        if (type === 'review') {
          updatePayload = {
            reviewStatus: status,
            reviewStatusChangedAt: now,
            reviewStatusChangedBy: currentUser.fullName,
            reviewStatusChangedByUserId: currentUser.userId
          };
        } else {
          updatePayload = {
            publicationStatus: status,
            publicationStatusChangedAt: now,
            publicationStatusChangedBy: currentUser.fullName,
            publicationStatusChangedByUserId: currentUser.userId
          };
        }
        return setDoc(confRef, updatePayload, { merge: true });
      });

      await Promise.all(promises);
      toast({ title: "Sector Synced", description: `${idArray.length > 1 ? 'Bulk ' : ''}${type.toUpperCase()} protocol updated.` });
      if (idArray.length > 1) setSelectedIds(new Set());
    } catch (err: any) {
      console.error("Firestore Update Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Protocol Breach", 
        description: `Failed to update status: ${err.message || 'Access Denied'}` 
      });
    } finally {
      setUpdatingId(null);
      setIsBulkUpdating(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredConfessions?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConfessions?.map(c => c.id)));
    }
  };

  const deleteConfession = async (id: string) => {
    if (!confirm('CRITICAL ACTION: Permanently purge this submission?')) return;
    try {
      await deleteDoc(doc(db, 'confessions', id));
      toast({ title: "Submission Purged", description: "Data permanently deleted." });
    } catch (err) {
      toast({ variant: "destructive", title: "Purge Failed" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Key Copied", description: "Submission ID copied to clipboard." });
  };

  const handleAction = async (userId: string, action: 'approve' | 'deny' | 'delete' | 'assign_role') => {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const targetUser = allUsers.find(u => u.id === userId);

      if (action === 'delete') {
        await deleteDoc(userRef);
        toast({ title: "Operative Purged", description: `ID @${userId} removed.` });
      } else if (action === 'approve') {
        const roleToAssign = selectedRoles[userId] || 'manager';
        await updateDoc(userRef, { status: 'active', role: roleToAssign });
        toast({ title: "Operative Authorized", description: `@${userId} activated as ${roleToAssign}.` });
      } else if (action === 'assign_role') {
        const roleToAssign = selectedRoles[userId];
        if (!roleToAssign) return;
        await updateDoc(userRef, { role: roleToAssign });
        if (targetUser?.email) {
          await sendRoleChangeEmail(targetUser.email, targetUser.fullName, roleToAssign);
        }
        toast({ title: "Sector Updated", description: `@${userId} moved to ${roleToAssign}.` });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'HeadAdmin';
  const isHeadAdmin = currentUser.role === 'HeadAdmin';

  const filteredConfessions = confessions?.filter(c => 
    c.submissionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.confessionNo?.toString().includes(searchQuery)
  );

  const formatIST = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + " IST";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <DashboardHeader userId={currentUser.userId} role={currentUser.role} />
      
      <main className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Command Center</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] opacity-60">Confession Oversight Matrix (Sector 01)</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/30 border-white/5 p-1 rounded-2xl h-14">
            <TabsTrigger value="overview" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="confessions" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Log Explorer</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Presence</TabsTrigger>
            {isAdmin && <TabsTrigger value="users" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Operatives</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Submissions" value={confessions?.length.toString() || '0'} icon={<MessageSquareQuote className="h-6 w-6" />} />
              <StatCard title="Active Operatives" value={allUsers.filter(u => u.status === 'active').length.toString()} icon={<ShieldCheck className="h-6 w-6" />} />
              <StatCard title="Sync Status" value="Online" icon={<Zap className="h-6 w-6 text-secondary" />} />
            </div>
          </TabsContent>

          <TabsContent value="confessions">
            <Card className="mt-8 glass-card rounded-[2rem] overflow-hidden shadow-2xl border-primary/20">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 bg-white/5">
                <CardTitle className="text-xl md:text-2xl uppercase font-black text-primary">Confession Log Forensics</CardTitle>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-4">
                      <span className="text-[10px] font-black uppercase px-2 text-primary">{selectedIds.size} SELECTED</span>
                      <Select onValueChange={(val) => {
                        const [type, status] = val.split(':');
                        setConfessionStatus(Array.from(selectedIds), type as any, status);
                      }}>
                        <SelectTrigger className="w-[180px] h-9 text-[9px] uppercase font-black bg-background/50 border-primary/20">
                          <SelectValue placeholder="BULK ACTIONS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="review:accepted">MARK ACCEPTED</SelectItem>
                          <SelectItem value="review:rejected">MARK REJECTED</SelectItem>
                          <SelectItem value="publication:published">MARK PUBLISHED</SelectItem>
                          <SelectItem value="publication:denied">MARK DENIED</SelectItem>
                          <SelectItem value="review:pending">MARK WAITING</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="h-9 px-3 text-[9px] font-black uppercase text-muted-foreground hover:text-primary">Cancel</Button>
                    </div>
                  )}
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="SEARCH SUBMISSION KEY..." 
                      className="pl-12 h-12 rounded-xl bg-background/20 font-mono text-xs uppercase border-white/5 focus:bg-background/40 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/10 text-left text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">
                      <th className="py-6 pl-10">
                        <div className="flex items-center gap-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary cursor-pointer" 
                            checked={filteredConfessions?.length ? selectedIds.size === filteredConfessions.length : false}
                            onChange={toggleSelectAll}
                          />
                          <span>Index Key</span>
                        </div>
                      </th>
                      <th className="py-6">Content</th>
                      <th className="py-6">Authorization</th>
                      <th className="py-6">Publication</th>
                      <th className="py-6">Trace</th>
                      <th className="py-6 pr-10 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isConfessionsLoading && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
                          <p className="text-[10px] uppercase font-black mt-4 text-muted-foreground tracking-widest">Decrypting Files...</p>
                        </td>
                      </tr>
                    )}
                    {filteredConfessions?.map(c => (
                      <tr key={c.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(c.id) ? 'bg-primary/5' : ''}`}>
                        <td className="py-8 pl-10">
                          <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-white/10 bg-white/5 accent-primary cursor-pointer" 
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelection(c.id)}
                            />
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => deleteConfession(c.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-primary">VeiL#{c.confessionNo}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-40 hover:opacity-100" 
                                  onClick={() => copyToClipboard(c.submissionId)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-[9px] font-mono text-muted-foreground uppercase">{c.submissionId}</p>
                            </div>
                            <Link 
                              href={`/confession-status?sid=${c.submissionId}`} 
                              target="_blank"
                              className="h-8 w-8 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all ml-2"
                              title="Verify Public Status"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                        <td className="py-8 max-w-xs">
                          <p className="text-sm italic opacity-80 line-clamp-2">"{c.content}"</p>
                        </td>
                        <td className="py-8">
                          <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant="outline"
                               className={`h-10 w-10 p-0 rounded-xl transition-all ${c.reviewStatus === 'accepted' ? 'bg-secondary text-white border-secondary shadow-glow-green' : 'border-white/10 hover:border-secondary hover:bg-secondary/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'review', 'accepted')}
                               disabled={updatingId === c.id}
                               title="Authorize"
                             >
                               <Check className="h-5 w-5" />
                             </Button>
                             <Button 
                               size="sm" 
                               variant="outline"
                               className={`h-10 w-10 p-0 rounded-xl transition-all ${c.reviewStatus === 'rejected' ? 'bg-destructive text-white border-destructive shadow-glow-red' : 'border-white/10 hover:border-destructive hover:bg-destructive/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'review', 'rejected')}
                               disabled={updatingId === c.id}
                               title="Deny"
                             >
                               <X className="h-5 w-5" />
                             </Button>
                             <div className="flex flex-col justify-center ml-1">
                               <Badge className={`text-[8px] uppercase font-black h-4 px-1.5 ${c.reviewStatus === 'accepted' ? 'bg-secondary text-white' : c.reviewStatus === 'rejected' ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'}`}>
                                 {c.reviewStatus}
                               </Badge>
                             </div>
                          </div>
                          <p className="text-[8px] font-bold opacity-30 mt-1">{formatIST(c.reviewStatusChangedAt)}</p>
                        </td>
                        <td className="py-8">
                          <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant="outline"
                               className={`h-10 w-10 p-0 rounded-xl transition-all ${c.publicationStatus === 'published' ? 'bg-secondary text-white border-secondary shadow-glow-green' : 'border-white/10 hover:border-secondary hover:bg-secondary/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'publication', 'published')}
                               disabled={updatingId === c.id}
                               title="Publish"
                             >
                               <CheckCircle2 className="h-5 w-5" />
                             </Button>
                             <Button 
                               size="sm" 
                               variant="outline"
                               className={`h-10 w-10 p-0 rounded-xl transition-all ${c.publicationStatus === 'denied' ? 'bg-destructive text-white border-destructive shadow-glow-red' : 'border-white/10 hover:border-secondary hover:bg-secondary/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'publication', 'denied')}
                               disabled={updatingId === c.id}
                               title="Restrict"
                             >
                               <AlertTriangle className="h-5 w-5" />
                             </Button>
                             <div className="flex flex-col justify-center ml-1">
                               <Badge className={`text-[8px] uppercase font-black h-4 px-1.5 ${c.publicationStatus === 'published' ? 'bg-secondary text-white' : c.publicationStatus === 'denied' ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'}`}>
                                 {c.publicationStatus}
                               </Badge>
                             </div>
                          </div>
                          <p className="text-[8px] font-bold opacity-30 mt-1">{formatIST(c.publicationStatusChangedAt)}</p>
                        </td>
                        <td className="py-8 font-mono text-[10px] text-secondary font-black">
                          <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20 w-fit">
                            <Globe className="h-3.5 w-3.5" /> {c.ipAddress || 'UNKNOWN'}
                          </div>
                        </td>
                        <td className="py-8 pr-10 text-[10px] font-bold text-right">
                          <p className="text-foreground">{new Date(c.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                          <span className="opacity-40">{new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <Card className="glass-card rounded-[2.5rem] overflow-hidden shadow-xl">
                <CardHeader className="p-6 md:p-10 bg-white/5">
                  <CardTitle className="text-xl md:text-2xl font-black uppercase">Operative Sector Assignments</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 text-left text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">
                        <th className="py-6 pl-10">Operative</th>
                        <th className="py-6">Status</th>
                        <th className="py-6">Sector Role</th>
                        {isHeadAdmin && <th className="py-6">Passcode</th>}
                        <th className="py-6 pr-10 text-right">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers.map(user => {
                        if (user.id === currentUser.userId && !isHeadAdmin) return null;
                        return (
                          <tr key={user.id} className="hover:bg-secondary/5 transition-colors">
                            <td className="py-8 pl-10">
                              <p className="font-black">@{user.id}</p>
                              <p className="text-[10px] opacity-60 uppercase font-bold">{user.fullName}</p>
                            </td>
                            <td className="py-8">
                              <Badge className={`text-[9px] uppercase font-black ${user.status === 'active' ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'}`}>{user.status}</Badge>
                            </td>
                            <td className="py-8">
                              <Select 
                                defaultValue={user.role} 
                                onValueChange={(val) => setSelectedRoles(prev => ({...prev, [user.id]: val}))}
                              >
                                <SelectTrigger className="w-[160px] h-9 text-[9px] uppercase font-black">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="promoter">Promoter</SelectItem>
                                  <SelectItem value="CC">CC</SelectItem>
                                  <SelectItem value="Data Collector">Data Collector</SelectItem>
                                  {isHeadAdmin && <SelectItem value="admin">Admin</SelectItem>}
                                </SelectContent>
                              </Select>
                              {selectedRoles[user.id] && selectedRoles[user.id] !== user.role && (
                                <Button size="sm" onClick={() => handleAction(user.id, 'assign_role')} className="mt-2 h-7 text-[9px] font-black uppercase">Update Sector</Button>
                              )}
                            </td>
                            {isHeadAdmin && (
                              <td className="py-8 font-mono text-sm text-primary font-black">{user.passcode}</td>
                            )}
                            <td className="py-8 pr-10 text-right space-x-2">
                              {isHeadAdmin && user.id !== currentUser.userId && (
                                <Button size="icon" variant="destructive" className="h-9 w-9 rounded-xl" onClick={() => handleAction(user.id, 'delete')}><Trash2 className="h-4 w-4" /></Button>
                              )}
                              {user.status === 'pending' && (
                                <Button size="sm" className="h-9 text-[10px] font-black uppercase rounded-xl" onClick={() => handleAction(user.id, 'approve')}>Authorize</Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="profile">
            <Card className="rounded-[2.5rem] border-white/10 p-10 shadow-2xl">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-2">
                    <Zap className="h-5 w-5" /> Operational Presence
                  </h3>
                  <RadioGroup defaultValue={currentStatus} onValueChange={updateStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-4 p-8 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                      <RadioGroupItem value="online" id="status-online" />
                      <Label htmlFor="status-online" className="font-black uppercase text-[11px] cursor-pointer group-hover:text-primary transition-colors">Sector Online</Label>
                    </div>
                    <div className="flex items-center space-x-4 p-8 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                      <RadioGroupItem value="idle" id="status-idle" />
                      <Label htmlFor="status-idle" className="font-black uppercase text-[11px] cursor-pointer group-hover:text-amber-500 transition-colors">Sector Idle</Label>
                    </div>
                    <div className="flex items-center space-x-4 p-8 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                      <RadioGroupItem value="dnd" id="status-dnd" />
                      <Label htmlFor="status-dnd" className="font-black uppercase text-[11px] cursor-pointer group-hover:text-destructive transition-colors">Secure DND</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="pt-10 border-t border-white/5 space-y-8">
                   <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 p-8 rounded-3xl border border-white/10">
                      <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-white p-2 border-2 border-primary/20">
                        <Image src={'https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo-ai-veil.png'} alt="Logo" fill className="object-contain" unoptimized />
                      </div>
                      <div className="flex-1 space-y-2">
                         <h3 className="text-2xl font-black text-primary uppercase italic tracking-tighter">VeiL Command Hub</h3>
                         <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Authorized Sector 01 Personnel Only</p>
                      </div>
                   </div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Identity Verification</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                         <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Full Name</p>
                         <p className="text-sm font-black">{currentUser.fullName}</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                         <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Operational Role</p>
                         <p className="text-sm font-black text-primary uppercase">{currentUser.role}</p>
                      </div>
                   </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-white/5 shadow-xl hover:scale-105 transition-all duration-300 border-t-primary/20">
      <CardContent className="p-10">
        <div className="flex items-center justify-between mb-6 opacity-40">
          <p className="text-[11px] font-black uppercase tracking-[0.3em]">{title}</p>
          {icon}
        </div>
        <p className="text-5xl font-black text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
