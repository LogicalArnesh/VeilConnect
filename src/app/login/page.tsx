
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { validateUser } from '@/lib/users';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { sendSecurityEmail } from '@/app/actions/email-actions';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    passcode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Check hardcoded/mock users (like super admins)
    const mockUser = validateUser(formData.userId, formData.passcode);

    if (mockUser && mockUser.role === 'admin') {
      // ADMIN BYPASS: No 2FA as requested
      localStorage.setItem('veil_user', JSON.stringify(mockUser));
      router.push('/dashboard');
      return;
    }

    // 2. Check Firestore users
    try {
      const q = query(
        collection(db, 'userProfiles'),
        where('id', '==', formData.userId),
        where('passcode', '==', formData.passcode),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      let targetUser = mockUser;
      let isFirestoreUser = false;

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        if (data.status === 'denied') {
          setError('Your account has been restricted or denied.');
          setLoading(false);
          return;
        }
        targetUser = {
          userId: data.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role as any,
          passcode: data.passcode
        };
        isFirestoreUser = true;
      }

      if (targetUser) {
        // Standard User or approved analyst: Send 2FA
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        await setDoc(doc(db, 'verificationCodes', targetUser.userId), {
          userId: targetUser.userId,
          code: code,
          expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
        });

        const emailResult = await sendSecurityEmail(targetUser.email, code, targetUser.fullName);
        
        if (emailResult.success) {
          localStorage.setItem('veil_user', JSON.stringify(targetUser));
          localStorage.setItem('pending_verification_user', targetUser.userId);
          router.push('/login/2fa');
        } else {
          setError('Failed to send security key. Please check your network.');
        }
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
          <h2 className="text-xl font-semibold tracking-tight">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your secure dashboard
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
            <Label htmlFor="userId">User ID</Label>
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
              <button 
                type="button"
                onClick={() => alert("Please contact the administrator for a passcode reset.")}
                className="text-xs text-accent hover:underline font-medium"
              >
                Forgot Passcode?
              </button>
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
            {loading ? "Processing..." : "Continue"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
