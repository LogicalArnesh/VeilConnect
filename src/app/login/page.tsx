"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, ArrowRight, AlertCircle, HelpCircle, Clock } from 'lucide-react';
import { validateUser } from '@/lib/users';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { sendSecurityEmail } from '@/app/actions/email-actions';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [formData, setFormData] = useState({
    userId: '',
    passcode: ''
  });

  useEffect(() => {
    const updateTime = () => {
      const istTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(istTime + " IST");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const mockUser = validateUser(formData.userId, formData.passcode);

    if (mockUser && mockUser.role === 'admin') {
      localStorage.setItem('veil_user', JSON.stringify(mockUser));
      router.push('/dashboard');
      return;
    }

    try {
      const q = query(
        collection(db, 'userProfiles'),
        where('id', '==', formData.userId),
        where('passcode', '==', formData.passcode),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        if (data.status === 'denied') {
          setError('Your account has been restricted or denied.');
          setLoading(false);
          return;
        }

        const targetUser = {
          userId: data.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role as any,
          passcode: data.passcode
        };

        if (data.status === 'active') {
          localStorage.setItem('veil_user', JSON.stringify(targetUser));
          router.push('/dashboard');
          return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await setDoc(doc(db, 'verificationCodes', targetUser.userId), {
          userId: targetUser.userId,
          code: code,
          expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
        });

        await sendSecurityEmail(targetUser.email, code, targetUser.fullName);
        localStorage.setItem('pending_verification_user', targetUser.userId);
        router.push('/login/2fa');
      } else {
        setError('Invalid User ID or passcode.');
      }
    } catch (err: any) {
      console.error(err);
      setError('System error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-3 w-3 text-accent animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{currentTime}</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Access Control</h2>
          <p className="text-sm text-muted-foreground">
            Enter your secure operational credentials
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="userId">User ID</Label>
              <Link href="/login/forgot-uid" className="text-[10px] text-accent hover:underline flex items-center gap-1">
                <HelpCircle className="h-2 w-2" /> Forgot UID?
              </Link>
            </div>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="userId"
                placeholder="Enter your user ID"
                className="pl-10"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="passcode">Passcode</Label>
              <Link href="/login/forgot-password" title="Forgot Passcode" className="text-[10px] text-accent hover:underline flex items-center gap-1">
                 <HelpCircle className="h-2 w-2" /> Forgot Passcode?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="passcode"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={formData.passcode}
                onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Decrypting..." : "Establish Connection"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            New Operative?{" "}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Initialize Account
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
