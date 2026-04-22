
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
  Send
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
      
      await sendApprovalStatusEmail(approvingUser.email, approvingUser.name, 'approved', adminEmails, selectedRole);
      
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

      // Notify all active users (Optional: Can be refined to specific user)
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
    <div className="min-h-screen bg-background">
      <DashboardHeader userId={user.userId} role={user.role as any} />
      
      <main className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
              Welcome back, <span className="text-primary">{user.fullName}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Sector Status: <span className="capitalize text-accent font-semibold">Active - ${user.role}</span>
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Button onClick={() => setIsTaskDialogOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Assign New Task
              </Button>
            </div>
          )}
        </div>

        {isAdmin && pendingUsers && pendingUsers.length > 0 && (
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-accent" />
                Awaiting Authorization
              </CardTitle>
              <CardDescription>Verify and assign roles to new operatives</CardDescription>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Active Operations" value={tasks?.length.toString() || "0"} trend="+2 from yesterday" icon={<Target className="h-4 w-4 text-primary" />} />
          <StatCard title="Team Engagement" value="High" trend="98% Response Rate" icon={<Activity className="h-4 w-4 text-accent" />} />
          <StatCard title="Efficiency" value="92%" trend="On Target" icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="min-h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Intelligence Briefing & Tasks</CardTitle>
                  <CardDescription>Real-time operational priorities</CardDescription>
                </div>
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0">
                {isTasksLoading ? (
                  <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                  <div className="p-20 flex flex-col items-center justify-center text-center opacity-60">
                    <EmptyState icon={<Inbox className="h-12 w-12" />} title="Clean Slate" description="No active tasks currently assigned. Intelligence gathering in progress." />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {isAdmin && <AISuggestions />}
            <Card className="bg-card border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Departmental Overview</CardTitle>
                <CardDescription>Live telemetry across sectors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProgressSection label="Intelligence" value={85} color="bg-primary" />
                <ProgressSection label="Field Ops" value={62} color="bg-accent" />
                <ProgressSection label="Cyber Command" value={94} color="bg-emerald-500" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Task Creation Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign New Mission Task</DialogTitle>
            <DialogDescription>Assign a priority task to the active team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input 
                placeholder="e.g., Firewall Log Audit" 
                value={taskData.title}
                onChange={(e) => setTaskData({...taskData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Operational Priority</Label>
              <Select value={taskData.priority} onValueChange={(v) => setTaskData({...taskData, priority: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="Low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Briefing Details</Label>
              <Textarea 
                placeholder="Provide specific instructions..." 
                value={taskData.description}
                onChange={(e) => setTaskData({...taskData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={isProcessing || !taskData.title}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dispatch Assignment <Send className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!approvingUser} onOpenChange={() => setApprovingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Operative Role</DialogTitle>
            <DialogDescription>
              Assign a professional role to {approvingUser?.name} before deployment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Operational Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
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
            <Button onClick={handleApproveConfirm} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activate Operative
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:border-primary/50 transition-all cursor-default group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">{icon}</div>
        </div>
        <div className="flex flex-col">
          <p className="text-3xl font-bold font-headline">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-semibold">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ title, priority, progress, status }: { title: string; priority: string; progress: number; status: string }) {
  const isHigh = priority === 'High';
  return (
    <div className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors group">
      <div className="flex items-start gap-4">
        <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${isHigh ? 'bg-primary animate-pulse' : 'bg-accent'}`} />
        <div className="space-y-1">
          <h4 className="text-sm font-bold tracking-tight">{title}</h4>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span className={isHigh ? 'text-primary font-bold' : ''}>Priority: {priority}</span>
            <span>&bull;</span>
            <span>Progress: {progress}%</span>
            <span>&bull;</span>
            <span className="capitalize text-emerald-500">{status}</span>
          </div>
        </div>
      </div>
      <div className="w-24">
        <Progress value={progress} className="h-1 bg-secondary" />
      </div>
    </div>
  );
}

function ProgressSection({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground uppercase tracking-widest font-bold">{label}</span>
        <span className="font-bold text-foreground">{value}%</span>
      </div>
      <Progress value={value} className={`h-1.5 ${color}`} />
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground/30 mx-auto flex justify-center">{icon}</div>
      <div>
        <h4 className="font-bold text-lg">{title}</h4>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
