
"use client";

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Activity,
  Inbox,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
  Plus,
  ClipboardList,
  Target,
  Send,
  CalendarDays
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AISuggestions } from '@/components/dashboard/ai-suggestions';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, doc, updateDoc, getDocs, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { sendApprovalStatusEmail, sendTaskNotification } from '@/app/actions/email-actions';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function DashboardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [user, setUser] = useState<{ userId: string; role: string; fullName: string; email: string } | null>(null);
  
  const [approvingUser, setApprovingUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Field Operative");
  const [isProcessing, setIsProcessing] = useState(false);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'Medium' });

  useEffect(() => {
    const storedUser = localStorage.getItem('veil_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const pendingUsersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'userProfiles'), where('status', '==', 'pending'));
  }, [db]);
  
  const { data: pendingUsers } = useCollection(pendingUsersQuery as any);

  const tasksQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery as any);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleApproveConfirm = async () => {
    if (!approvingUser) return;
    setIsProcessing(true);
    try {
      const adminQuery = query(collection(db, 'userProfiles'), where('role', '==', 'admin'));
      const adminSnap = await getDocs(adminQuery);
      const adminEmails = adminSnap.docs.map(doc => doc.data().email);
      if (adminEmails.length === 0) adminEmails.push('meet.arnesh@gmail.com');

      await updateDoc(doc(db, 'userProfiles', approvingUser.id), {
        status: 'active',
        role: selectedRole.toLowerCase() === 'admin' ? 'admin' : 'user',
        assignedRoleName: selectedRole,
        updatedAt: new Date().toISOString()
      });
      
      // Note: sendApprovalStatusEmail is not provided in all versions of the prompt, 
      // ensuring it exists or handling it gracefully.
      try {
        await sendApprovalStatusEmail(approvingUser.email, approvingUser.name, 'approved', adminEmails, selectedRole);
      } catch (err) {
        console.warn('Notification email failed, but user was approved.');
      }
      
      toast({ title: "User Approved", description: `Assigned as ${selectedRole}. Notification logs updated.` });
      setApprovingUser(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not finalize approval state." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskData.title || !db) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        createdBy: user.userId,
        createdAt: Timestamp.now(),
        status: 'open',
        progress: 0
      });

      const usersSnap = await getDocs(query(collection(db, 'userProfiles'), where('status', '==', 'active')));
      const notificationPromises = usersSnap.docs.map(uDoc => 
        sendTaskNotification(uDoc.data().email, uDoc.data().fullName, taskData.title)
      );
      await Promise.all(notificationPromises);

      toast({ title: "Task Assigned", description: "Operation task has been dispatched to the team." });
      setIsTaskDialogOpen(false);
      setTaskData({ title: '', description: '', priority: 'Medium' });
    } catch (e) {
      toast({ variant: "destructive", title: "Assignment Failed", description: "Failed to broadcast task." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader userId={user.userId} role={user.role as any} />
      
      <main className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-headline">
              Welcome back, <span className="text-primary italic">{user.fullName}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                Sector Status: <span className="text-accent">{user.role} Authorization Active</span>
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-4">
              <Button onClick={() => setIsTaskDialogOpen(true)} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-6 text-base font-bold">
                <Plus className="h-5 w-5 mr-2" /> DISPATCH MISSION
              </Button>
            </div>
          )}
        </div>

        {isAdmin && pendingUsers && pendingUsers.length > 0 && (
          <Card className="border-accent/40 bg-accent/5 overflow-hidden">
            <div className="bg-accent/10 px-6 py-4 border-b border-accent/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-accent" />
                <CardTitle className="text-lg font-bold uppercase tracking-widest">Awaiting Verification</CardTitle>
              </div>
              <Badge variant="outline" className="border-accent text-accent uppercase text-[10px] tracking-tighter">
                Action Required
              </Badge>
            </div>
            <CardContent className="p-6 space-y-4">
              {pendingUsers.map((pUser) => (
                <div key={pUser.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-card border border-border rounded-xl shadow-md transition-all hover:border-accent/30">
                  <div className="space-y-1">
                    <p className="font-bold text-base">{pUser.fullName}</p>
                    <p className="text-xs text-muted-foreground font-mono">OPERATIVE ID: {pUser.id} &bull; {pUser.email}</p>
                  </div>
                  <div className="flex gap-3 mt-4 sm:mt-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <UserX className="h-4 w-4 mr-1.5" /> DENY
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                      onClick={() => setApprovingUser({ id: pUser.id, email: pUser.email, name: pUser.fullName })}
                    >
                      <UserCheck className="h-4 w-4 mr-1.5" /> APPROVE
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Active Missions" value={tasks?.length.toString() || "0"} trend="+2 priority units" icon={<Target className="h-5 w-5 text-primary" />} />
          <StatCard title="Command Status" value="Online" trend="Operational IST: Active" icon={<Activity className="h-5 w-5 text-accent" />} />
          <StatCard title="Efficiency Rate" value="96.4%" trend="Optimal Performance" icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="min-h-[500px] border-border/50 shadow-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    Intelligence Briefing & Tasks
                  </CardTitle>
                  <CardDescription className="text-xs uppercase tracking-widest mt-1">Real-time team synchronization</CardDescription>
                </div>
                <div className="bg-secondary p-2 rounded-lg">
                   <Target className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isTasksLoading ? (
                  <div className="flex flex-col items-center justify-center p-32 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Decrypting Secure Data...</p>
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="divide-y divide-border">
                    {tasks.map((task) => (
                      <TaskItem 
                        key={task.id} 
                        title={task.title} 
                        priority={task.priority} 
                        progress={task.progress || 0}
                        status={task.status}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-32 flex flex-col items-center justify-center text-center opacity-60 space-y-4">
                    <EmptyState icon={<Inbox className="h-16 w-16 text-muted-foreground/30" />} title="Operational Silence" description="No active tasks currently assigned. Awaiting command broadcast." />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {isAdmin && <AISuggestions />}
            <Card className="bg-card border-border shadow-2xl overflow-hidden">
              <CardHeader className="bg-secondary/20 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-accent" />
                  Department Telemetry
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-tighter">Live feedback from sectors</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <ProgressSection label="Intelligence Gathering" value={88} color="bg-primary" />
                <ProgressSection label="Cyber Command" value={94} color="bg-accent" />
                <ProgressSection label="Field Logistics" value={72} color="bg-emerald-600" />
                <div className="pt-4 mt-4 border-t border-border/30">
                  <p className="text-[10px] font-mono text-muted-foreground text-center uppercase tracking-widest leading-relaxed">
                    All telemetry is encrypted and synced with base HQ.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md bg-card border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Assign Mission Task</DialogTitle>
            <DialogDescription className="text-sm font-medium">Assign critical objectives to the active unit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Task Objective</Label>
              <Input 
                placeholder="e.g., Secure Terminal Access" 
                value={taskData.title}
                onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                className="bg-secondary/40 border-border focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Priority Level</Label>
              <Select value={taskData.priority} onValueChange={(v) => setTaskData({...taskData, priority: v})}>
                <SelectTrigger className="bg-secondary/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High" className="text-primary font-bold">High Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="Low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Briefing Details</Label>
              <Textarea 
                placeholder="Provide detailed mission parameters..." 
                value={taskData.description}
                onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                className="bg-secondary/40 border-border min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setIsTaskDialogOpen(false)} className="font-bold">ABORT</Button>
            <Button onClick={handleCreateTask} disabled={isProcessing || !taskData.title} className="bg-primary hover:bg-primary/90 font-bold px-8">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              BROADCAST MISSION <Send className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!approvingUser} onOpenChange={() => setApprovingUser(null)}>
        <DialogContent className="bg-card border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase">Finalize Operative Role</DialogTitle>
            <DialogDescription className="text-sm">
              Assign a professional designation to <span className="text-primary font-bold">{approvingUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest">Designation</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="bg-secondary/40 h-12 text-base"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Field Operative">Field Operative</SelectItem>
                  <SelectItem value="Senior Analyst">Senior Analyst</SelectItem>
                  <SelectItem value="Intelligence Specialist">Intelligence Specialist</SelectItem>
                  <SelectItem value="Security Lead">Security Lead</SelectItem>
                  <SelectItem value="System Admin">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingUser(null)}>CANCEL</Button>
            <Button onClick={handleApproveConfirm} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ACTIVATE OPERATIVE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:border-primary/50 transition-all cursor-default group border-border/40 bg-card/50 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <div className="p-3 rounded-xl bg-secondary/50 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">{icon}</div>
        </div>
        <div className="flex flex-col">
          <p className="text-4xl font-black font-headline tracking-tighter text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ title, priority, progress, status }: { title: string; priority: string; progress: number; status: string }) {
  const isHigh = priority === 'High';
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-secondary/10 transition-colors group">
      <div className="flex items-start gap-5">
        <div className={`mt-1.5 h-3 w-3 rounded-full shadow-lg ${isHigh ? 'bg-primary shadow-primary/40 animate-pulse' : 'bg-accent shadow-accent/40'}`} />
        <div className="space-y-1.5">
          <h4 className="text-base font-extrabold tracking-tight group-hover:text-primary transition-colors">{title}</h4>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
            <span className={isHigh ? 'text-primary' : ''}>P: {priority}</span>
            <span className="opacity-30">/</span>
            <span>Prog: {progress}%</span>
            <span className="opacity-30">/</span>
            <span className="text-emerald-500">{status}</span>
          </div>
        </div>
      </div>
      <div className="w-full sm:w-32 mt-4 sm:mt-0">
        <div className="flex justify-between items-center mb-1 sm:hidden">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Progress</span>
          <span className="text-[10px] font-bold text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-secondary/50" />
      </div>
    </div>
  );
}

function ProgressSection({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-black italic">{label}</span>
        <span className="font-black text-sm text-foreground tabular-nums">{value}%</span>
      </div>
      <Progress value={value} className={`h-2.5 ${color} shadow-sm`} />
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="space-y-4">
      <div className="mx-auto flex justify-center animate-bounce duration-1000">{icon}</div>
      <div>
        <h4 className="font-black text-xl text-foreground uppercase tracking-tighter">{title}</h4>
        <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}
