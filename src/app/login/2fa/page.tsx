
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sendAdminNotification } from '@/app/actions/email-actions';
import { MOCK_USERS } from '@/lib/users';

export default function TwoFactorPage() {
  const router = useRouter();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem('pending_verification_user');
    if (!pending) {
      router.push('/login');
      return;
    }
    setUserId(pending);
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setLoading(true);

    try {
      const codeDoc = await getDoc(doc(db, 'verificationCodes', userId));
      
      if (codeDoc.exists()) {
        const data = codeDoc.data();
        const now = new Date();
        const expiresAt = new Date(data.expiresAt);

        if (now > expiresAt) {
          setError('Verification key has expired. Please log in again.');
        } else if (data.code === code) {
          // Check Firestore profile
          const userProfileDoc = await getDoc(doc(db, 'userProfiles', userId));
          const userData = userProfileDoc.data();
          const mockUser = MOCK_USERS.find(u => u.userId === userId);

          if (userData?.status === 'pending') {
            await sendAdminNotification({
              userId: userData.id,
              email: userData.email,
              fullName: userData.fullName
            });
            setIsAwaitingApproval(true);
            localStorage.removeItem('pending_verification_user');
          } else if (userData?.status === 'active' || mockUser) {
            // Success for approved or hardcoded users
            localStorage.removeItem('pending_verification_user');
            router.push('/dashboard');
          } else {
            setError('Account restricted. Please contact an administrator.');
          }
        } else {
          setError('Invalid verification key. Please try again.');
        }
      } else {
        setError('Verification session not found. Please log in again.');
      }
    } catch (err) {
      setError('System error during verification.');
    } finally {
      setLoading(false);
    }
  };

  if (isAwaitingApproval) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="bg-emerald-500/10 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Verification Successful</h2>
            <p className="text-muted-foreground">
              Your ID creation process has started and will be done as soon as an admin approves it with a role.
            </p>
          </div>
          <div className="bg-secondary/20 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-accent text-sm font-semibold mb-2">
              <ShieldCheck className="h-4 w-4" />
              What's next?
            </div>
            <p className="text-xs text-muted-foreground text-left">
              An administrator has been notified. You will receive a confirmation email once your account access level has been assigned.
            </p>
          </div>
          <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
            Return to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Security Verification</h2>
          <p className="text-sm text-muted-foreground">
            Please check the mail sent to your email address by <strong>noreply.veilconfessions@gmail.com</strong>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="sr-only">Security Key</Label>
            <Input
              id="code"
              placeholder="0 0 0 0 0 0"
              className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg" disabled={loading || code.length !== 6}>
            {loading ? "Verifying..." : "Confirm Verification"}
            {!loading && <CheckCircle2 className="ml-2 h-5 w-5" />}
          </Button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => router.push('/login')}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Back to login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
