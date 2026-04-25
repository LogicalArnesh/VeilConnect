
"use client";

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Trash2, 
  User, 
  Zap,
  Moon,
  Megaphone,
  MessageSquareQuote,
  Globe,
  Monitor,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc, addDoc, query, orderBy, limit, where } from 'firebase/firestore';
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
  const [presence, setPresence] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('online');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const confessionsQuery = useMemoFirebase(() => query(collection(db, 'confessions'), orderBy('createdAt', 'desc')), [db]);
  const { data: confessions } = useCollection(confessionsQuery);

  useEffect(() => {
    const storedUser = localStorage.getItem('veil_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    const unsubUser = onSnapshot(doc(db, 'userProfiles', user.userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentUser({ ...user, ...data, userId: snap.id });
      }
    });

    const unsubAll = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubPresence = onSnapshot(collection(db, 'presence'), (snap) => {
      setPresence(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    setDoc(doc(db, 'presence', user.userId), {
      userId: user.userId,
      status: 'online',
      lastSeen: new Date().toISOString()
    }, { merge: true });

    return () => {
      unsubUser();
      unsubAll();
      unsubPresence();
      unsubAnnounce();
      if (user) {
        setDoc(doc(db, 'presence', user.userId), { status: 'offline', lastSeen: new Date().toISOString() }, { merge: true });
      }
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
      toast({ title: "Status Updated", description: `Operational state is now ${status}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Status Sync Failed" });
    }
  };

  const updateConfessionStatus = async (id: string, updates: any) => {
    try {
      const confRef = doc(db, 'confessions', id);
      if (updates.reviewStatus === 'rejected') {
        updates.publicationStatus = 'denied';
      }
      await updateDoc(confRef, updates);
      toast({ title: "Log Updated", description: "Submission status synchronized." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const postAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        content: newAnnouncement,
        authorId: currentUser.userId,
        authorName: currentUser.fullName,
        createdAt: new Date().toISOString()
      });
      setNewAnnouncement('');
      toast({ title: "Broadcast Sent", description: "Announcement is live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    }
  };

  const inspectConfession = (c: any) => {
    let details = 'Technical data unavailable.';
    try {
      const data = JSON.parse(c.browserInfo);
      details = `Platform: ${data.platform} | Res: ${data.screenResolution} | TZ: ${data.timeZone} | Cookies: ${data.cookiesEnabled ? 'YES' : 'NO'}`;
    } catch (e) {
      details = c.browserInfo || 'Legacy browser metadata format.';
    }
    
    toast({
      title: `Log #${c.confessionNo} Technical Trace`,
      description: details,
    });
  };

  const handleAction = async (userId: string, action: 'approve' | 'deny' | 'delete' | 'assign_role') => {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const targetUser = allUsers.find(u => u.id === userId);

      if (action === 'delete') {
        await deleteDoc(userRef);
        toast({ title: "Profile Purged", description: `Operative ${userId} removed.` });
      } else if (action === 'approve') {
        const roleToAssign = selectedRoles[userId] || 'manager';
        await updateDoc(userRef, { status: 'active', role: roleToAssign });
        toast({ title: "Operative Activated", description: `${userId} is now ${roleToAssign}.` });
      } else if (action === 'assign_role') {
        const roleToAssign = selectedRoles[userId];
        if (!roleToAssign || roleToAssign === 'admin' || roleToAssign === 'HeadAdmin') return;
        await updateDoc(userRef, { role: roleToAssign });
        await sendRoleChangeEmail(targetUser.email, targetUser.fullName, roleToAssign);
        toast({ title: "Role Updated", description: `${userId} updated to ${roleToAssign}.` });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'HeadAdmin';
  const isHeadAdmin = currentUser.role === 'HeadAdmin';
  const operationalRoles = ['promoter', 'manager', 'CC', 'Data Collector'];

  const filteredConfessions = confessions?.filter(c => 
    c.submissionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <DashboardHeader userId={currentUser.userId} role={currentUser.role} />
      
      <main className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline uppercase">Command Dashboard</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] opacity-60">Sector 01 | Intelligence Oversight</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/30 border-white/5 p-1 rounded-2xl h-14">
            <TabsTrigger value="overview" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="confessions" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Confessions</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">My Profile</TabsTrigger>
            {isAdmin && <TabsTrigger value="users" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">User Control</TabsTrigger>}
            {isAdmin && <TabsTrigger value="presence" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Team Presence</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Confessions" value={confessions?.length.toString() || '0'} icon={<MessageSquareQuote className="h-6 w-6" />} />
                    <StatCard title="Active IDs" value={allUsers.filter(u => u.status === 'active').length.toString()} icon={<ShieldCheck className="h-6 w-6" />} />
                    <StatCard title="Network Status" value="Online" icon={<Zap className="h-6 w-6 text-secondary" />} />
                  </div>

                  <Card className="border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-primary/10 border-b border-primary/10">
                      <CardTitle className="flex items-center gap-3 text-primary uppercase text-sm font-black tracking-[0.2em]">
                        <Megaphone className="h-6 w-6" /> Command Broadcasts
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Post mission updates and meeting schedules</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      {isAdmin && (
                        <div className="flex gap-4">
                          <Input 
                            placeholder="Type important mission update..." 
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            className="bg-background/40 rounded-xl h-12"
                          />
                          <Button onClick={postAnnouncement} className="bg-primary hover:bg-primary/90 h-12 px-8 font-black uppercase tracking-widest rounded-xl">Broadcast</Button>
                        </div>
                      )}
                      <div className="space-y-4">
                        {announcements.map(a => (
                          <div key={a.id} className="p-5 border border-white/5 rounded-2xl bg-white/5 relative group transition-all hover:bg-white/10">
                            <p className="text-sm leading-relaxed mb-3 font-medium text-foreground/90">{a.content}</p>
                            <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">
                              <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> @{a.authorId}</span>
                              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="confessions">
            <Card className="rounded-[2.5rem] overflow-hidden border-white/10 shadow-2xl">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 bg-muted/20">
                <div className="space-y-1">
                  <CardTitle className="text-2xl uppercase font-black tracking-tight flex items-center gap-3 text-primary">
                    <MessageSquareQuote className="h-8 w-8" /> Confession Logs
                  </CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Search and manage anonymous mission submissions.</CardDescription>
                </div>
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="SEARCH BY MISSION ID..." 
                    className="pl-12 h-12 rounded-xl bg-background/50 font-mono tracking-widest text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 text-left text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">
                        <th className="py-6 pl-10">Log Index</th>
                        <th className="py-6">Submission Data</th>
                        <th className="py-6">Review Protocol</th>
                        <th className="py-6">Broadcast Mode</th>
                        <th className="py-6">Log Time</th>
                        <th className="py-6 text-right pr-10">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredConfessions?.map(c => (
                        <tr key={c.id} className="group hover:bg-white/5 transition-colors">
                          <td className="py-8 pl-10">
                             <div className="flex flex-col gap-1">
                               <span className="font-black text-primary text-lg">#{c.confessionNo}</span>
                               <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{c.submissionId}</span>
                             </div>
                          </td>
                          <td className="py-8 max-w-md">
                            <p className="line-clamp-2 text-sm font-medium italic text-foreground/80 leading-relaxed">"{c.content}"</p>
                            <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-muted-foreground font-black">
                               <Globe className="h-3 w-3 text-secondary" /> {c.ipAddress}
                            </div>
                          </td>
                          <td className="py-8">
                             <Select defaultValue={c.reviewStatus || 'pending'} onValueChange={(val) => updateConfessionStatus(c.id, { reviewStatus: val })}>
                               <SelectTrigger className="w-[140px] h-10 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="pending" className="text-[10px] font-black uppercase">Pending</SelectItem>
                                 <SelectItem value="accepted" className="text-[10px] font-black uppercase text-secondary">Accepted</SelectItem>
                                 <SelectItem value="rejected" className="text-[10px] font-black uppercase text-primary">Rejected</SelectItem>
                               </SelectContent>
                             </Select>
                          </td>
                          <td className="py-8">
                            <Select defaultValue={c.publicationStatus || 'waiting'} onValueChange={(val) => updateConfessionStatus(c.id, { publicationStatus: val })}>
                               <SelectTrigger className="w-[140px] h-10 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="waiting" className="text-[10px] font-black uppercase">Waiting</SelectItem>
                                 <SelectItem value="published" className="text-[10px] font-black uppercase text-secondary">Published</SelectItem>
                                 <SelectItem value="denied" className="text-[10px] font-black uppercase text-primary">Denied</SelectItem>
                               </SelectContent>
                             </Select>
                          </td>
                          <td className="py-8">
                             <div className="flex flex-col text-[10px] font-bold">
                               <span className="text-foreground">{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                               <span className="text-muted-foreground mt-1 opacity-60">{new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
                             </div>
                          </td>
                          <td className="py-8 text-right pr-10">
                             <Button size="sm" variant="outline" className="h-10 px-6 text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => inspectConfession(c)}>
                               Trace Mission
                             </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="rounded-[2rem] border-white/10 overflow-hidden">
              <CardHeader className="p-10 bg-muted/20 border-b border-white/5">
                <CardTitle className="text-2xl font-black uppercase">Operative Identity</CardTitle>
                <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Manage your presence and identification protocols.</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="max-w-3xl space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                        <Zap className="h-5 w-5" /> Presence Authorization
                      </h3>
                      <RadioGroup 
                        defaultValue={currentStatus} 
                        onValueChange={updateStatus}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                      >
                        <div className="flex items-center space-x-4 p-6 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:border-secondary/50 transition-all hover:bg-secondary/5">
                          <RadioGroupItem value="online" id="status-online" />
                          <Label htmlFor="status-online" className="flex items-center gap-3 cursor-pointer font-black uppercase text-[11px] tracking-widest">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Online
                          </Label>
                        </div>
                        <div className="flex items-center space-x-4 p-6 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:border-amber-500/50 transition-all hover:bg-amber-500/5">
                          <RadioGroupItem value="idle" id="status-idle" />
                          <Label htmlFor="status-idle" className="flex items-center gap-3 cursor-pointer font-black uppercase text-[11px] tracking-widest text-amber-500">
                             Idle Pulse
                          </Label>
                        </div>
                        <div className="flex items-center space-x-4 p-6 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:border-primary/50 transition-all hover:bg-primary/5">
                          <RadioGroupItem value="dnd" id="status-dnd" />
                          <Label htmlFor="status-dnd" className="flex items-center gap-3 cursor-pointer font-black uppercase text-[11px] tracking-widest text-primary">
                            <Moon className="h-4 w-4" /> Restricted
                          </Label>
                        </div>
                      </RadioGroup>
                    </section>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <Card className="rounded-[2.5rem] overflow-hidden border-white/10">
                <CardHeader className="p-10 bg-muted/20">
                  <CardTitle className="text-2xl font-black uppercase">Identity Control Panel</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Manage authorization and mission clearance for team operatives.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/10 text-left text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">
                          <th className="py-6 pl-10">Operative Identity</th>
                          <th className="py-6">Authorization</th>
                          <th className="py-6">Sector Role</th>
                          {isHeadAdmin && <th className="py-6">Clearance Key</th>}
                          <th className="py-6">Last Login Pulse</th>
                          <th className="py-6 text-right pr-10">Command</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {allUsers.map(user => {
                          const userPresence = presence.find(p => p.id === user.id);
                          const lastSeenStr = userPresence?.lastSeen ? new Date(userPresence.lastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never';
                          const status = userPresence?.status || 'offline';
                          
                          if (user.id === currentUser.userId && !isHeadAdmin) return null;
                          return (
                            <tr key={user.id} className="group hover:bg-secondary/5 transition-colors">
                              <td className="py-8 pl-10">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-white/10">
                                      {user.photoUrl ? <img src={user.photoUrl} className="object-cover h-full w-full" /> : <User className="h-6 w-6 text-muted-foreground" />}
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-background ${status === 'online' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                  </div>
                                  <div>
                                    <p className="font-black text-sm text-foreground tracking-tight">@{user.id}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{user.fullName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-8">
                                <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest bg-secondary/20 text-secondary border-secondary/20">
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="py-8">
                                <div className="flex items-center gap-2">
                                  <Select 
                                    defaultValue={user.role} 
                                    onValueChange={(val) => setSelectedRoles(prev => ({...prev, [user.id]: val}))}
                                  >
                                    <SelectTrigger className="w-[180px] h-10 text-[10px] uppercase font-black tracking-widest rounded-xl">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {operationalRoles.map(r => (
                                        <SelectItem key={r} value={r} className="text-[10px] uppercase font-black tracking-widest">{r}</SelectItem>
                                      ))}
                                      {isHeadAdmin && <SelectItem value="admin" className="text-[10px] uppercase font-black tracking-widest text-primary">Intelligence Admin</SelectItem>}
                                    </SelectContent>
                                  </Select>
                                  {selectedRoles[user.id] && selectedRoles[user.id] !== user.role && (
                                    <Button size="sm" onClick={() => handleAction(user.id, 'assign_role')} className="h-10 rounded-xl font-black uppercase tracking-widest text-[9px]">Apply</Button>
                                  )}
                                </div>
                              </td>
                              {isHeadAdmin && (
                                <td className="py-8 font-mono text-sm text-primary font-black tracking-[0.2em]">{user.passcode}</td>
                              )}
                              <td className="py-8 text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                                <div className="flex flex-col gap-1">
                                   <span className="text-foreground">{lastSeenStr} IST</span>
                                   {isHeadAdmin && userPresence?.lastSeen && (
                                     <span className="text-[9px] opacity-40 font-bold">{new Date(userPresence.lastSeen).toLocaleDateString('en-IN')}</span>
                                   )}
                                </div>
                              </td>
                              <td className="py-8 text-right pr-10 space-x-2">
                                {isHeadAdmin && user.id !== currentUser.userId && (
                                  <Button size="icon" variant="destructive" className="h-10 w-10 rounded-xl" onClick={() => handleAction(user.id, 'delete')} title="Purge Identity">
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                )}
                                {user.status === 'pending' && (
                                   <Button size="sm" className="h-10 px-6 text-[10px] uppercase font-black tracking-widest rounded-xl shadow-lg shadow-primary/20" onClick={() => handleAction(user.id, 'approve')}>Authorize Identity</Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="presence">
               <Card className="rounded-[2.5rem] border-white/10 overflow-hidden">
                 <CardHeader className="p-10 bg-muted/20">
                   <CardTitle className="text-2xl font-black uppercase">Sector Presence Board</CardTitle>
                   <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Real-time network availability and mission pulse of active operatives.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {allUsers.filter(u => u.status === 'active').map(u => {
                         const p = presence.find(pr => pr.id === u.id);
                         const isOnline = p?.status === 'online';
                         return (
                           <div key={u.id} className="p-6 border border-white/10 rounded-[2rem] flex items-center gap-5 bg-white/5 group hover:bg-white/10 transition-all">
                             <div className="relative">
                               <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center border-2 border-primary/20 overflow-hidden shadow-glow group-hover:border-primary/50 transition-all">
                                 {u.photoUrl ? <img src={u.photoUrl} className="rounded-2xl h-full w-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground" />}
                               </div>
                               <span className={`absolute bottom-[-4px] right-[-4px] h-6 w-6 rounded-full border-4 border-background shadow-lg ${p?.status === 'online' ? 'bg-emerald-500 shadow-emerald-500/50' : p?.status === 'idle' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                             </div>
                             <div className="space-y-1">
                               <p className="font-black text-base tracking-tight text-foreground">@{u.id}</p>
                               <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{u.role}</p>
                               <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                  <Activity className="h-2.5 w-2.5" />
                                  <span>{p?.status || 'offline'}</span>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-[1.5rem] border-white/10 bg-white/5 hover:bg-white/10 transition-all shadow-xl group">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">{title}</p>
          <div className="text-primary/70 group-hover:text-primary transition-colors">{icon}</div>
        </div>
        <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter">{value}</p>
      </CardContent>
    </Card>
  );
}
