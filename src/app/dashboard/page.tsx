
"use client";

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Activity,
  Inbox,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
  Plus,
  Video
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AISuggestions } from '@/components/dashboard/ai-suggestions';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, doc, updateDoc, addDoc, orderBy } from 'firebase/firestore';
import { sendApprovalStatusEmail } from '@/app/actions/email-actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [user, setUser] = useState<{ userId: string; role: string; fullName: string } | null>(null);
  
  // Approval state
  const [approvingUser, setApprovingUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Field Operative");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('veil_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const pendingUsersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'userProfiles'), where('status', '==', 'pending'));
  }, [db]);
  
  const { data: pendingUsers } = useCollection(pendingUsersQuery as any);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isNewUser = !isAdmin && user.userId !== 'analyst_01' && user.userId !== 'operative_x';

  const handleApproveConfirm = async () => {
    if (!approvingUser) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'userProfiles', approvingUser.id), {
        status: 'active',
        role: selectedRole.toLowerCase() === 'admin' ? 'admin' : 'user',
        assignedRoleName: selectedRole,
        updatedAt: new Date().toISOString()
      });
      await sendApprovalStatusEmail(approvingUser.email, approvingUser.name, 'approved', selectedRole);
      toast({ title: "User Approved", description: `Assigned as ${selectedRole}. Notification sent.` });
      setApprovingUser(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Database update error." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async (userId: string, email: string, name: string) => {
    try {
      await updateDoc(doc(db, 'userProfiles', userId), {
        status: 'denied',
        updatedAt: new Date().toISOString()
      });
      await sendApprovalStatusEmail(email, name, 'denied');
      toast({ title: "User Denied", description: "Notification email sent." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userId={user.userId} role={user.role as any} />
      
      <main className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
              Welcome back, <span className="text-primary">{user.fullName}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Access level: <span className="capitalize text-accent font-semibold">{user.role}</span>
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Button variant="outline" size="sm">Download Reports</Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" /> New Assignment
              </Button>
            </div>
          )}
        </div>

        {isAdmin && pendingUsers && pendingUsers.length > 0 && (
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-accent" />
                Pending Approvals
              </CardTitle>
              <CardDescription>Review and activate new account requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingUsers.map((pUser) => (
                <div key={pUser.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg shadow-sm">
                  <div>
                    <p className="font-semibold text-sm">{pUser.fullName}</p>
                    <p className="text-xs text-muted-foreground">ID: {pUser.id} • {pUser.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeny(pUser.id, pUser.email, pUser.fullName)}
                    >
                      <UserX className="h-4 w-4 mr-1" /> Deny
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setApprovingUser({ id: pUser.id, email: pUser.email, name: pUser.fullName })}
                    >
                      <UserCheck className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Tasks" value={isNewUser ? "0" : "24"} trend={isNewUser ? "No tasks yet" : "+12% from last week"} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
          <StatCard title="Meetings" value={isNewUser ? "0" : "3"} trend={isNewUser ? "None scheduled" : "Next at 2:00 PM"} icon={<Calendar className="h-4 w-4 text-accent" />} />
          <StatCard title="Project Progress" value={isNewUser ? "0%" : "76%"} trend={isNewUser ? "Awaiting start" : "On track"} icon={<TrendingUp className="h-4 w-4 text-primary" />} />
          <StatCard title="Team Activity" value="Active" trend="12 members online" icon={<Activity className="h-4 w-4 text-orange-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
                <TabsTrigger value="meetings">Team Meetings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Security Assignments</CardTitle>
                      <CardDescription>Current operational priorities</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className={isNewUser ? "p-12 flex flex-col items-center justify-center text-center opacity-60" : "p-0"}>
                    {isNewUser ? (
                      <EmptyState icon={<Inbox className="h-12 w-12" />} title="No tasks assigned" description="Your administrator will assign your first mission once your role is fully synchronized." />
                    ) : (
                      <div className="divide-y divide-border">
                        <TaskItem title="Firewall Log Analysis" due="Today" priority="High" progress={80} />
                        <TaskItem title="Internal Security Audit" due="Tomorrow" priority="Medium" progress={45} />
                        <TaskItem title="Update Encryption Protocols" due="Friday" priority="High" progress={10} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="meetings">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Sessions</CardTitle>
                    <CardDescription>Coordinated team briefings</CardDescription>
                  </CardHeader>
                  <CardContent className={isNewUser ? "p-12 flex flex-col items-center justify-center text-center opacity-60" : "p-0"}>
                    {isNewUser ? (
                      <EmptyState icon={<Video className="h-12 w-12" />} title="No briefings scheduled" description="You haven't been invited to any security briefings yet." />
                    ) : (
                      <div className="divide-y divide-border">
                        <MeetingItem title="Daily Stand-up" time="09:00 AM" date="May 24" participants={8} />
                        <MeetingItem title="Project X Briefing" time="02:00 PM" date="May 24" participants={3} />
                        <MeetingItem title="Tech Sync" time="11:00 AM" date="May 25" participants={5} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {isAdmin && <AISuggestions />}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Tracking</CardTitle>
                <CardDescription>Live status across departments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProgressSection label="Intelligence" value={isNewUser ? 0 : 92} color="bg-primary" />
                <ProgressSection label="Operations" value={isNewUser ? 0 : 78} color="bg-accent" />
                <ProgressSection label="Cyber Defense" value={isNewUser ? 0 : 64} color="bg-emerald-500" />
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Total Efficiency</span>
                    <span className="text-sm text-accent font-bold">82%</span>
                  </div>
                  <Progress value={82} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Role Assignment Dialog */}
      <Dialog open={!!approvingUser} onOpenChange={() => setApprovingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User Role</DialogTitle>
            <DialogDescription>
              Assign a professional role to {approvingUser?.name} before activation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Professional Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Field Operative">Field Operative</SelectItem>
                  <SelectItem value="Senior Analyst">Senior Analyst</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                  <SelectItem value="Security Lead">Security Lead</SelectItem>
                  <SelectItem value="System Admin">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingUser(null)}>Cancel</Button>
            <Button onClick={handleApproveConfirm} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:border-primary/50 transition-colors cursor-default">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2"><p className="text-sm font-medium text-muted-foreground">{title}</p>{icon}</div>
        <div className="flex flex-col"><p className="text-2xl font-bold font-headline">{value}</p><p className="text-xs text-muted-foreground mt-1 flex items-center">{trend}</p></div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ title, due, priority, progress }: { title: string; due: string; priority: string; progress: number }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors group">
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2 w-2 rounded-full ${priority === 'High' ? 'bg-destructive' : 'bg-primary'}`} />
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-muted-foreground">Due: {due} • {progress}% complete</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></Button>
    </div>
  );
}

function MeetingItem({ title, time, date, participants }: { title: string; time: string; date: string; participants: number }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors">
      <div className="flex gap-4">
        <div className="flex flex-col items-center justify-center bg-secondary/50 rounded-lg p-2 min-w-[60px]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">{date.split(' ')[0]}</span>
          <span className="text-sm font-bold">{date.split(' ')[1]}</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-accent" />
            <span className="text-xs text-muted-foreground">{time}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{participants} participants</span>
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" className="text-xs h-8">Join</Button>
    </div>
  );
}

function ProgressSection({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <Progress value={value} className={`h-1.5 ${color}`} />
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground mx-auto flex justify-center">{icon}</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">{description}</p>
      </div>
    </div>
  );
}
