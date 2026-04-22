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
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendActivationEmail, sendRoleChangeEmail } from '@/app/actions/email-actions';

export default function DashboardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [presence, setPresence] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

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
        setCurrentUser({ ...user, ...snap.data(), userId: snap.id });
      }
    });

    const unsubAll = onSnapshot(collection(db, 'userProfiles'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubPresence = onSnapshot(collection(db, 'presence'), (snap) => {
      setPresence(snap.docs.map(d => ({ ...d.data(), id: d.id })));
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
      if (user) {
        setDoc(doc(db, 'presence', user.userId), { status: 'offline' }, { merge: true });
      }
    };
  }, [router, db]);

  const handleAction = async (userId: string, action: 'approve' | 'deny' | 'delete' | 'promote') => {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const targetUser = allUsers.find(u => u.id === userId);
      const adminEmails = allUsers.filter(u => u.role === 'admin' || u.role === 'head_admin').map(u => u.email);

      if (action === 'delete') {
        await deleteDoc(userRef);
        toast({ title: "Profile Purged", description: `Operative ${userId} removed.` });
      } else if (action === 'approve') {
        await updateDoc(userRef, { status: 'active', role: 'user' });
        await sendActivationEmail(targetUser, adminEmails);
        toast({ title: "Operative Activated", description: `${userId} is now active.` });
      } else if (action === 'promote') {
        await updateDoc(userRef, { role: 'admin' });
        await sendRoleChangeEmail(targetUser.email, targetUser.fullName, 'admin');
        toast({ title: "Role Escalated", description: `${userId} promoted to Admin.` });
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

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'head_admin';
  const isHeadAdmin = currentUser.role === 'head_admin';

  return (
    <div className="min-h-screen bg-background pb-20">
      <DashboardHeader userId={currentUser.userId} role={currentUser.role} />
      
      <main className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Command Dashboard</h1>
            <p className="text-muted-foreground">Operational Sector Control</p>
          </div>
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm font-mono font-bold tracking-tighter">
              {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short' })} IST
            </span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/20 border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">User Command</TabsTrigger>}
            <TabsTrigger value="presence">Team Presence</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Operatives" value={allUsers.length.toString()} icon={<Users className="h-5 w-5" />} />
              <StatCard title="Active Protocols" value={allUsers.filter(u => u.status === 'active').length.toString()} icon={<ShieldCheck className="h-5 w-5" />} />
              <StatCard title="Sector Stability" value="100%" icon={<Activity className="h-5 w-5" />} />
            </div>
            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Security Briefing</CardTitle>
                <CardDescription>Sector status is currently optimal.</CardDescription>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground italic">
                Strategic data stream active...
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Operative Identity</CardTitle>
                <CardDescription>Manage your professional profile and credentials.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={updateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Operational Name</Label>
                      <Input name="fullName" defaultValue={currentUser.fullName} />
                    </div>
                    <div className="space-y-2">
                      <Label>Photo URL</Label>
                      <Input name="photoUrl" defaultValue={currentUser.photoUrl} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Operational Bio</Label>
                      <textarea 
                        name="about" 
                        defaultValue={currentUser.about}
                        className="w-full min-h-[100px] bg-background border rounded-md p-3 text-sm"
                        placeholder="Tell the team about your role..."
                      />
                    </div>
                    <Button type="submit" className="w-full">Save Changes</Button>
                  </div>
                  <div className="flex flex-col items-center justify-center border-l pl-8">
                    <div className="relative h-40 w-40 rounded-full overflow-hidden border-4 border-primary/30 mb-4 bg-secondary">
                      {currentUser.photoUrl ? (
                        <img src={currentUser.photoUrl} className="object-cover h-full w-full" alt="Profile" />
                      ) : (
                        <User className="h-20 w-20 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-1">{currentUser.role.toUpperCase()}</Badge>
                    <p className="text-xs text-muted-foreground mt-2 font-mono italic">UID: {currentUser.userId}</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Control Panel</CardTitle>
                  <CardDescription>Authorization and role assignment for operatives.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-4 pl-2">Operative</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4">Role</th>
                          <th className="pb-4">Passcode</th>
                          <th className="pb-4 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allUsers.map(user => (
                          <tr key={user.id} className="group">
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                  {user.photoUrl ? <img src={user.photoUrl} className="object-cover" /> : <User className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-bold">@{user.id}</p>
                                  <p className="text-xs text-muted-foreground">{user.fullName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                {user.status}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <span className="capitalize text-xs font-mono">{user.role}</span>
                            </td>
                            <td className="py-4 font-mono text-xs">
                              <div className="flex items-center gap-2">
                                {showPasswords[user.id] ? (isHeadAdmin ? user.passcode : '••••••••') : '••••••••'}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={() => setShowPasswords(prev => ({...prev, [user.id]: !prev[user.id]}))}
                                >
                                  {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            </td>
                            <td className="py-4 text-right pr-2 space-x-2">
                              {user.status === 'pending' && (
                                <Button size="sm" variant="default" onClick={() => handleAction(user.id, 'approve')}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                </Button>
                              )}
                              {user.status === 'active' && user.role === 'user' && (
                                <Button size="sm" variant="outline" onClick={() => handleAction(user.id, 'promote')}>
                                  Promote
                                </Button>
                              )}
                              {isHeadAdmin && user.id !== currentUser.userId && (
                                <Button size="sm" variant="destructive" onClick={() => handleAction(user.id, 'delete')}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="presence">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presence.map(p => {
                const user = allUsers.find(u => u.id === p.id);
                return (
                  <Card key={p.id} className="border-border/40 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                              {user?.photoUrl ? <img src={user.photoUrl} className="rounded-full" /> : <User className="h-5 w-5" />}
                            </div>
                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                              p.status === 'online' ? 'bg-emerald-500' : 
                              p.status === 'idle' ? 'bg-amber-500' : 'bg-zinc-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">@{p.id}</p>
                            <p className="text-[10px] uppercase text-muted-foreground">{p.status}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Last Active: {new Date(p.lastSeen).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border/40 bg-card/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <div className="text-primary">{icon}</div>
        </div>
        <p className="text-3xl font-black">{value}</p>
      </CardContent>
    </Card>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{children}</label>;
}
