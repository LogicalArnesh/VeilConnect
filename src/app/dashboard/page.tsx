
"use client";

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShieldCheck, 
  Trash2, 
  Megaphone,
  MessageSquareQuote,
  Globe,
  Search,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('online');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    const unsubUser = onSnapshot(doc(db, 'userProfiles', user.userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentUser({ ...user, ...data, userId: snap.id });
      }
    });

    const unsubAll = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
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
      toast({ title: "Presence Updated", description: `State is now ${status}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Presence Sync Failed" });
    }
  };

  const setConfessionStatus = async (id: string, type: 'review' | 'publication', status: string) => {
    setUpdatingId(id);
    const updates: any = {};
    const now = new Date().toISOString();
    
    if (type === 'review') {
      updates.reviewStatus = status;
      updates.reviewStatusChangedAt = now;
    } else {
      updates.publicationStatus = status;
      updates.publicationStatusChangedAt = now;
    }

    try {
      const confRef = doc(db, 'confessions', id);
      await updateDoc(confRef, updates);
      toast({ title: "Sector Sync Successful", description: `${type.toUpperCase()} status updated to ${status.toUpperCase()}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Denied", description: "Authorization failed." });
    } finally {
      setUpdatingId(null);
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
      toast({ title: "Broadcast Sent", description: "System update is live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    }
  };

  const handleAction = async (userId: string, action: 'approve' | 'deny' | 'delete' | 'assign_role') => {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const targetUser = allUsers.find(u => u.id === userId);

      if (action === 'delete') {
        await deleteDoc(userRef);
        toast({ title: "Identity Purged", description: `Operative ${userId} removed.` });
      } else if (action === 'approve') {
        const roleToAssign = selectedRoles[userId] || 'manager';
        await updateDoc(userRef, { status: 'active', role: roleToAssign });
        toast({ title: "Operative Activated", description: `${userId} sector assigned: ${roleToAssign}.` });
      } else if (action === 'assign_role') {
        const roleToAssign = selectedRoles[userId];
        if (!roleToAssign) return;
        await updateDoc(userRef, { role: roleToAssign });
        if (targetUser?.email) {
          await sendRoleChangeEmail(targetUser.email, targetUser.fullName, roleToAssign);
        }
        toast({ title: "Sector Updated", description: `${userId} moved to ${roleToAssign}.` });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'HeadAdmin';
  const isHeadAdmin = currentUser.role === 'HeadAdmin';

  const filteredConfessions = confessions?.filter(c => 
    c.submissionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.confessionNo.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <DashboardHeader userId={currentUser.userId} role={currentUser.role} />
      
      <main className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline uppercase">Command Dashboard</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] opacity-60">Confession Intelligence Oversight</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/30 border-white/5 p-1 rounded-2xl h-14">
            <TabsTrigger value="overview" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="confessions" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Confessions</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">My Profile</TabsTrigger>
            {isAdmin && <TabsTrigger value="users" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Operatives</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Confessions" value={confessions?.length.toString() || '0'} icon={<MessageSquareQuote className="h-6 w-6" />} />
              <StatCard title="Active Operatives" value={allUsers.filter(u => u.status === 'active').length.toString()} icon={<ShieldCheck className="h-6 w-6" />} />
              <StatCard title="Command Status" value="Online" icon={<Zap className="h-6 w-6 text-secondary" />} />
            </div>
            
            <Card className="mt-8 border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary uppercase text-sm font-black tracking-[0.2em]">
                  <Megaphone className="h-6 w-6" /> System Broadcasts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {isAdmin && (
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Type operational update..." 
                      value={newAnnouncement}
                      onChange={(e) => setNewAnnouncement(e.target.value)}
                      className="bg-background/40 rounded-xl h-12"
                    />
                    <Button onClick={postAnnouncement} className="bg-primary hover:bg-primary/90 h-12 px-8 font-black uppercase tracking-widest rounded-xl">Broadcast</Button>
                  </div>
                )}
                <div className="space-y-4">
                  {announcements.map(a => (
                    <div key={a.id} className="p-5 border border-white/5 rounded-2xl bg-white/5">
                      <p className="text-sm font-medium mb-2">{a.content}</p>
                      <div className="flex justify-between text-[10px] uppercase font-black opacity-60">
                        <span>@{a.authorId}</span>
                        <span>{new Date(a.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confessions">
            <Card className="rounded-[2.5rem] overflow-hidden border-white/10 shadow-2xl">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 bg-muted/20">
                <CardTitle className="text-2xl uppercase font-black text-primary">Confession Logs</CardTitle>
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="SEARCH BY ID OR CONTENT..." 
                    className="pl-12 h-12 rounded-xl bg-background/50 font-mono text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/10 text-left text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">
                      <th className="py-6 pl-10">Log Index</th>
                      <th className="py-6">Content Transcript</th>
                      <th className="py-6">Review Command</th>
                      <th className="py-6">Publish Command</th>
                      <th className="py-6">Origin IP</th>
                      <th className="py-6 pr-10 text-right">Logged Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isConfessionsLoading && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
                          <p className="text-[10px] uppercase font-black mt-4 text-muted-foreground tracking-widest">Decrypting Logs...</p>
                        </td>
                      </tr>
                    )}
                    {filteredConfessions?.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-8 pl-10">
                          <span className="font-black text-primary">#{c.confessionNo}</span>
                          <p className="text-[9px] font-mono text-muted-foreground">{c.submissionId}</p>
                        </td>
                        <td className="py-8 max-w-xs">
                          <p className="text-sm italic opacity-80 line-clamp-2">"{c.content}"</p>
                        </td>
                        <td className="py-8">
                          <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant={c.reviewStatus === 'accepted' ? 'default' : 'outline'}
                               className={`h-8 w-8 p-0 rounded-lg ${c.reviewStatus === 'accepted' ? 'bg-secondary hover:bg-secondary/80' : 'border-white/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'review', 'accepted')}
                               disabled={updatingId === c.id}
                             >
                               <Check className="h-4 w-4" />
                             </Button>
                             <Button 
                               size="sm" 
                               variant={c.reviewStatus === 'rejected' ? 'destructive' : 'outline'}
                               className={`h-8 w-8 p-0 rounded-lg ${c.reviewStatus === 'rejected' ? '' : 'border-white/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'review', 'rejected')}
                               disabled={updatingId === c.id}
                             >
                               <X className="h-4 w-4" />
                             </Button>
                             <div className="flex flex-col justify-center">
                               <Badge className={`text-[8px] uppercase font-black h-4 px-1.5 ${c.reviewStatus === 'accepted' ? 'bg-secondary text-white' : c.reviewStatus === 'rejected' ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'}`}>
                                 {c.reviewStatus}
                               </Badge>
                             </div>
                          </div>
                          {c.reviewStatusChangedAt && <p className="text-[8px] mt-1 text-muted-foreground">{new Date(c.reviewStatusChangedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>}
                        </td>
                        <td className="py-8">
                          <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant={c.publicationStatus === 'published' ? 'default' : 'outline'}
                               className={`h-8 w-8 p-0 rounded-lg ${c.publicationStatus === 'published' ? 'bg-secondary hover:bg-secondary/80' : 'border-white/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'publication', 'published')}
                               disabled={updatingId === c.id}
                             >
                               <Check className="h-4 w-4" />
                             </Button>
                             <Button 
                               size="sm" 
                               variant={c.publicationStatus === 'denied' ? 'destructive' : 'outline'}
                               className={`h-8 w-8 p-0 rounded-lg ${c.publicationStatus === 'denied' ? '' : 'border-white/10'}`}
                               onClick={() => setConfessionStatus(c.id, 'publication', 'denied')}
                               disabled={updatingId === c.id}
                             >
                               <X className="h-4 w-4" />
                             </Button>
                             <div className="flex flex-col justify-center">
                               <Badge className={`text-[8px] uppercase font-black h-4 px-1.5 ${c.publicationStatus === 'published' ? 'bg-secondary text-white' : c.publicationStatus === 'denied' ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'}`}>
                                 {c.publicationStatus}
                               </Badge>
                             </div>
                          </div>
                          {c.publicationStatusChangedAt && <p className="text-[8px] mt-1 text-muted-foreground">{new Date(c.publicationStatusChangedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>}
                        </td>
                        <td className="py-8 font-mono text-[10px] text-secondary font-black">
                          <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20 w-fit">
                            <Globe className="h-3.5 w-3.5" /> {c.ipAddress || 'TRACED'}
                          </div>
                        </td>
                        <td className="py-8 pr-10 text-[10px] font-bold text-right">
                          {new Date(c.createdAt).toLocaleDateString()}<br/>
                          <span className="opacity-60">{new Date(c.createdAt).toLocaleTimeString()}</span>
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
              <Card className="rounded-[2.5rem] overflow-hidden border-white/10 shadow-xl">
                <CardHeader className="p-10 bg-muted/20">
                  <CardTitle className="text-2xl font-black uppercase">Operative Authorization</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 text-left text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">
                        <th className="py-6 pl-10">Operative</th>
                        <th className="py-6">Status</th>
                        <th className="py-6">Sector Assignment</th>
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
                              <p className="text-[10px] opacity-60 uppercase">{user.fullName}</p>
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
                                <Button size="sm" onClick={() => handleAction(user.id, 'assign_role')} className="mt-2 h-7 text-[9px] font-black">Update</Button>
                              )}
                            </td>
                            {isHeadAdmin && (
                              <td className="py-8 font-mono text-sm text-primary font-black">{user.passcode}</td>
                            )}
                            <td className="py-8 pr-10 text-right space-x-2">
                              {isHeadAdmin && user.id !== currentUser.userId && (
                                <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleAction(user.id, 'delete')}><Trash2 className="h-4 w-4" /></Button>
                              )}
                              {user.status === 'pending' && (
                                <Button size="sm" className="h-9 text-[10px] font-black uppercase" onClick={() => handleAction(user.id, 'approve')}>Authorize</Button>
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
            <Card className="rounded-[2rem] border-white/10 p-10">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary mb-6">Presence Configuration</h3>
              <RadioGroup defaultValue={currentStatus} onValueChange={updateStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center space-x-4 p-6 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <RadioGroupItem value="online" id="status-online" />
                  <Label htmlFor="status-online" className="font-black uppercase text-[11px] cursor-pointer">Online</Label>
                </div>
                <div className="flex items-center space-x-4 p-6 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <RadioGroupItem value="idle" id="status-idle" />
                  <Label htmlFor="status-idle" className="font-black uppercase text-[11px] cursor-pointer">Idle</Label>
                </div>
                <div className="flex items-center space-x-4 p-6 border border-white/10 rounded-2xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <RadioGroupItem value="dnd" id="status-dnd" />
                  <Label htmlFor="status-dnd" className="font-black uppercase text-[11px] cursor-pointer">DND</Label>
                </div>
              </RadioGroup>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-[1.5rem] border-white/10 bg-white/5 shadow-xl hover:scale-105 transition-transform">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4 opacity-60">
          <p className="text-[11px] font-black uppercase tracking-[0.3em]">{title}</p>
          {icon}
        </div>
        <p className="text-4xl font-black text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
