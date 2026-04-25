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
  Coffee,
  CheckCircle,
  Moon,
  Megaphone,
  Send,
  MessageSquareQuote,
  Clock,
  Globe,
  Monitor
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
import { sendActivationEmail, sendRoleChangeEmail } from '@/app/actions/email-actions';
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

  // Real-time Confessions
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
      toast({ title: "Status Updated", description: `You are now ${status}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Status Sync Failed" });
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

  const handleAction = async (userId: string, action: 'approve' | 'deny' | 'delete' | 'assign_role') => {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const targetUser = allUsers.find(u => u.id === userId);
      const adminEmails = allUsers.filter(u => u.role === 'admin' || u.role === 'HeadAdmin').map(u => u.email);

      if (action === 'delete') {
        await deleteDoc(userRef);
        toast({ title: "Profile Purged", description: `Operative ${userId} removed.` });
      } else if (action === 'approve') {
        const roleToAssign = selectedRoles[userId] || 'manager';
        await updateDoc(userRef, { status: 'active', role: roleToAssign });
        await sendActivationEmail({ ...targetUser, role: roleToAssign }, adminEmails);
        toast({ title: "Operative Activated", description: `${userId} is now ${roleToAssign}.` });
      } else if (action === 'assign_role') {
        const roleToAssign = selectedRoles[userId];
        if (!roleToAssign) return;
        await updateDoc(userRef, { role: roleToAssign });
        await sendRoleChangeEmail(targetUser.email, targetUser.fullName, roleToAssign);
        toast({ title: "Role Updated", description: `${userId} updated to ${roleToAssign}.` });
      } else if (action === 'deny') {
        await updateDoc(userRef, { status: 'denied' });
        toast({ variant: "destructive", title: "Access Revoked" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'HeadAdmin';
  const isHeadAdmin = currentUser.role === 'HeadAdmin';
  const operationalRoles = ['promoter', 'manager', 'CC', 'Data Collector'];

  return (
    <div className="min-h-screen bg-background pb-20">
      <DashboardHeader userId={currentUser.userId} role={currentUser.role} />
      
      <main className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Command Dashboard</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Sector 01 | Identity Oversight</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="confessions">Confessions</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">User Control</TabsTrigger>}
            {isAdmin && <TabsTrigger value="presence">Team Presence</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Confessions" value={confessions?.length.toString() || '0'} icon={<MessageSquareQuote className="h-5 w-5" />} />
                    <StatCard title="Active IDs" value={allUsers.filter(u => u.status === 'active').length.toString()} icon={<ShieldCheck className="h-5 w-5" />} />
                    <StatCard title="System Integrity" value="100%" icon={<Activity className="h-5 w-5" />} />
                  </div>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary uppercase text-sm font-black tracking-widest">
                        <Megaphone className="h-5 w-5" /> Command Broadcasts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Type important update..." 
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            className="bg-background"
                          />
                          <Button onClick={postAnnouncement} className="bg-primary hover:bg-primary/90">Post</Button>
                        </div>
                      )}
                      <div className="space-y-3">
                        {announcements.map(a => (
                          <div key={a.id} className="p-4 border rounded-lg bg-card/50">
                            <p className="text-sm leading-relaxed mb-2 font-medium">{a.content}</p>
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                              <span>By @{a.authorId}</span>
                              <span>{new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-xl uppercase font-black tracking-tight flex items-center gap-2 text-primary">
                  <MessageSquareQuote className="h-6 w-6" /> Confession Logs
                </CardTitle>
                <CardDescription>All incoming anonymous submissions sorted by operational pulse.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-widest">
                        <th className="pb-4 pl-2">Log #</th>
                        <th className="pb-4">Confession</th>
                        <th className="pb-4">Origin (IP)</th>
                        <th className="pb-4">Timestamp</th>
                        <th className="pb-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {confessions?.map(c => (
                        <tr key={c.id} className="group hover:bg-muted/50 transition-colors">
                          <td className="py-4 pl-2">
                             <div className="flex flex-col">
                               <span className="font-black text-primary">#{c.confessionNo}</span>
                               <span className="text-[9px] font-mono uppercase text-muted-foreground">{c.submissionId}</span>
                             </div>
                          </td>
                          <td className="py-4 max-w-md">
                            <p className="line-clamp-2 text-xs font-medium italic">"{c.content}"</p>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <Globe className="h-3 w-3 text-secondary" />
                              {c.ipAddress}
                            </div>
                          </td>
                          <td className="py-4">
                             <div className="flex flex-col text-[10px]">
                               <span className="font-bold">{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                               <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
                             </div>
                          </td>
                          <td className="py-4 text-right pr-2">
                             <Button size="sm" variant="ghost" className="h-8 text-[10px] uppercase font-bold" onClick={() => {
                               toast({ title: "Log Details", description: `Browser: ${c.browserInfo}` });
                             }}>Inspect</Button>
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
            <Card>
              <CardHeader>
                <CardTitle>Operative Identity</CardTitle>
                <CardDescription>Manage your presence and identification details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Presence Status
                      </h3>
                      <RadioGroup 
                        defaultValue={currentStatus} 
                        onValueChange={updateStatus}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      >
                        <div className="flex items-center space-x-3 p-4 border rounded-lg bg-card/50 cursor-pointer hover:border-secondary transition-colors">
                          <RadioGroupItem value="online" id="status-online" />
                          <Label htmlFor="status-online" className="flex items-center gap-2 cursor-pointer font-bold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg bg-card/50 cursor-pointer hover:border-amber-500 transition-colors">
                          <RadioGroupItem value="idle" id="status-idle" />
                          <Label htmlFor="status-idle" className="flex items-center gap-2 cursor-pointer font-bold text-amber-600">
                             Idle
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg bg-card/50 cursor-pointer hover:border-primary transition-colors">
                          <RadioGroupItem value="dnd" id="status-dnd" />
                          <Label htmlFor="status-dnd" className="flex items-center gap-2 cursor-pointer font-bold text-primary">
                            <Moon className="h-3 w-3" /> Do Not Disturb
                          </Label>
                        </div>
                      </RadioGroup>
                    </section>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Operational Control Panel</CardTitle>
                  <CardDescription>Manage authorization for incoming operatives.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-widest">
                          <th className="pb-4 pl-2">Operative</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4">Clearance</th>
                          {isHeadAdmin && <th className="pb-4">Passcode</th>}
                          <th className="pb-4 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {allUsers.map(user => {
                          if (user.id === currentUser.userId && !isHeadAdmin) return null;
                          return (
                            <tr key={user.id} className="group hover:bg-secondary/5 transition-colors">
                              <td className="py-4 pl-2">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                    {user.photoUrl ? <img src={user.photoUrl} className="object-cover h-full w-full" /> : <User className="h-4 w-4" />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-xs">@{user.id}</p>
                                    <p className="text-[9px] text-muted-foreground font-mono">{user.fullName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold">
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <Select 
                                    defaultValue={user.role} 
                                    onValueChange={(val) => setSelectedRoles(prev => ({...prev, [user.id]: val}))}
                                  >
                                    <SelectTrigger className="w-32 h-8 text-[10px] uppercase font-bold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {operationalRoles.map(r => (
                                        <SelectItem key={r} value={r} className="text-[10px] uppercase font-bold">{r}</SelectItem>
                                      ))}
                                      {isHeadAdmin && <SelectItem value="admin" className="text-[10px] uppercase font-bold text-primary">Admin</SelectItem>}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </td>
                              {isHeadAdmin && (
                                <td className="py-4 font-mono text-xs text-primary font-bold tracking-widest">{user.passcode}</td>
                              )}
                              <td className="py-4 text-right pr-2 space-x-2">
                                {isHeadAdmin && user.id !== currentUser.userId && (
                                  <Button size="sm" variant="destructive" className="h-8" onClick={() => handleAction(user.id, 'delete')}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
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
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
          <div className="text-primary/70">{icon}</div>
        </div>
        <p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{value}</p>
      </CardContent>
    </Card>
  );
}
