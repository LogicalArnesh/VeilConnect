
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
  Clock,
  Moon,
  Megaphone,
  Send
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

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      fullName: formData.get('fullName'),
      about: formData.get('about'),
      photoUrl: formData.get('photoUrl')
    };
    try {
      await updateDoc(doc(db, 'userProfiles', currentUser.userId), updates);
      toast({ title: "Profile Updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
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
            <p className="text-muted-foreground">Sector 01 | Identity Oversight</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/20 border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">User Control</TabsTrigger>}
            {isAdmin && <TabsTrigger value="presence">Team Presence</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Operatives" value={allUsers.length.toString()} icon={<Users className="h-5 w-5" />} />
                    <StatCard title="Active IDs" value={allUsers.filter(u => u.status === 'active').length.toString()} icon={<ShieldCheck className="h-5 w-5" />} />
                    <StatCard title="System Integrity" value="100%" icon={<Activity className="h-5 w-5" />} />
                  </div>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Command Announcements</CardTitle>
                        <CardDescription>Important updates and meeting schedules.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="New broadcast..." 
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            className="bg-background"
                          />
                          <Button size="icon" onClick={postAnnouncement}><Send className="h-4 w-4" /></Button>
                        </div>
                      )}
                      <div className="space-y-3">
                        {announcements.map(a => (
                          <div key={a.id} className="p-4 border rounded-lg bg-card/50 relative group">
                            <p className="text-sm leading-relaxed mb-2">{a.content}</p>
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                              <span>By @{a.authorId}</span>
                              <span>{new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
                            </div>
                          </div>
                        ))}
                        {announcements.length === 0 && <p className="text-center text-sm text-muted-foreground italic py-8">No active broadcasts.</p>}
                      </div>
                    </CardContent>
                  </Card>
               </div>

               <div className="space-y-8">
                  <Card>
                    <CardHeader>
                       <CardTitle className="text-lg">Operational Briefing</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4 text-muted-foreground">
                       <p>• All communication is encrypted.</p>
                       <p>• Role assignments are final once broadcast.</p>
                       <p>• Ensure status is updated for mission sync.</p>
                    </CardContent>
                  </Card>
               </div>
            </div>
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
                        <div className="flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-card/50 cursor-pointer hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="online" id="status-online" />
                          <Label htmlFor="status-online" className="flex items-center gap-2 cursor-pointer font-bold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-card/50 cursor-pointer hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="idle" id="status-idle" />
                          <Label htmlFor="status-idle" className="flex items-center gap-2 cursor-pointer font-bold">
                            <span className="h-2 w-2 rounded-full bg-amber-500" /> Idle
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-card/50 cursor-pointer hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="dnd" id="status-dnd" />
                          <Label htmlFor="status-dnd" className="flex items-center gap-2 cursor-pointer font-bold text-destructive">
                            <Moon className="h-3 w-3" /> Do Not Disturb
                          </Label>
                        </div>
                      </RadioGroup>
                    </section>

                    <form onSubmit={updateProfile} className="space-y-4 border-t pt-8">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Identity Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input name="fullName" defaultValue={currentUser.fullName} />
                        </div>
                        <div className="space-y-2">
                          <Label>Avatar URL</Label>
                          <Input name="photoUrl" defaultValue={currentUser.photoUrl} placeholder="https://..." />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Operational Bio</Label>
                        <textarea 
                          name="about" 
                          defaultValue={currentUser.about}
                          className="w-full min-h-[100px] bg-background border rounded-md p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                          placeholder="Operational specializations..."
                        />
                      </div>
                      <Button type="submit" className="w-full sm:w-auto px-12">Update Identity</Button>
                    </form>
                  </div>

                  <div className="flex flex-col items-center justify-start pt-4">
                    <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-primary/30 mb-6 bg-secondary shadow-2xl">
                      {currentUser.photoUrl ? (
                        <img src={currentUser.photoUrl} className="object-cover h-full w-full" alt="Profile" />
                      ) : (
                        <User className="h-24 w-24 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg px-6 py-1 border-primary/40 text-primary uppercase font-bold tracking-widest">{currentUser.role.replace('_', ' ').toUpperCase()}</Badge>
                      <p className="text-xs text-muted-foreground mt-4 font-mono font-bold tracking-widest uppercase opacity-60">UID: {currentUser.userId}</p>
                    </div>
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
                  <CardDescription>Assign roles and manage authorization for incoming operatives.</CardDescription>
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
                          {isHeadAdmin && <th className="pb-4">Last Pulse</th>}
                          <th className="pb-4 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {allUsers.map(user => {
                          if (user.id === currentUser.userId && !isHeadAdmin) return null;
                          const pData = presence.find(p => p.id === user.id);
                          return (
                            <tr key={user.id} className="group hover:bg-secondary/10 transition-colors">
                              <td className="py-4 pl-2">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
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
                                    <SelectTrigger className="w-32 h-8 text-[10px] uppercase font-bold border-primary/20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {operationalRoles.map(r => (
                                        <SelectItem key={r} value={r} className="text-[10px] uppercase font-bold">
                                          {r}
                                        </SelectItem>
                                      ))}
                                      {isHeadAdmin && <SelectItem value="admin" className="text-[10px] uppercase font-bold text-primary">Admin</SelectItem>}
                                    </SelectContent>
                                  </Select>
                                  {(selectedRoles[user.id] && selectedRoles[user.id] !== user.role) && (
                                    <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleAction(user.id, 'assign_role')}>
                                      Update
                                    </Button>
                                  )}
                                </div>
                              </td>
                              {isHeadAdmin && (
                                <td className="py-4 font-mono text-xs text-primary font-bold">{user.passcode}</td>
                              )}
                              {isHeadAdmin && (
                                <td className="py-4 font-mono text-[9px] text-muted-foreground">
                                  {pData?.lastSeen ? new Date(pData.lastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST' : 'N/A'}
                                </td>
                              )}
                              <td className="py-4 text-right pr-2 space-x-2">
                                {user.status === 'pending' && (
                                  <Button size="sm" variant="default" className="h-8" onClick={() => handleAction(user.id, 'approve')}>
                                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                )}
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

          {isAdmin && (
            <TabsContent value="presence">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presence.map(p => {
                  const user = allUsers.find(u => u.id === p.id);
                  return (
                    <Card key={p.id} className="border-border/40 hover:border-primary/50 transition-all group overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border-2 border-border group-hover:border-primary/40 transition-colors overflow-hidden">
                                {user?.photoUrl ? <img src={user.photoUrl} className="object-cover h-full w-full" /> : <User className="h-6 w-6" />}
                              </div>
                              <span className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm ${
                                p.status === 'online' ? 'bg-emerald-500' : 
                                p.status === 'idle' ? 'bg-amber-500' : 
                                p.status === 'dnd' ? 'bg-destructive' : 'bg-zinc-500'
                              }`} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">@{p.id}</p>
                              <div className="flex items-center gap-1.5">
                                {p.status === 'dnd' && <Moon className="h-2 w-2 text-destructive" />}
                                {p.status === 'idle' && <Coffee className="h-2 w-2 text-amber-500" />}
                                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">
                                  {p.status === 'dnd' ? 'DO NOT DISTURB' : p.status}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-dashed flex items-center justify-between">
                           <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest">Sector Link</span>
                           <span className="text-[10px] font-mono text-primary font-bold">
                             {p.lastSeen ? new Date(p.lastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST' : 'IDLE'}
                           </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border/40 bg-card/50 shadow-inner">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
          <div className="text-primary/70">{icon}</div>
        </div>
        <p className="text-3xl font-black text-foreground tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
