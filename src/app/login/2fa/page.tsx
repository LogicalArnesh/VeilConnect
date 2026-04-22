
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { notifyAdminsOfRequest } from '@/app/actions/email-actions';

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
        if (new Date() > new Date(data.expiresAt)) {
          setError('Security key has expired. Please register again.');
        } else if (data.code === code) {
          const userSnap = await getDoc(doc(db, 'userProfiles', userId));
          const userData = userSnap.data();

          // Get all admin emails
          const adminQuery = query(collection(db, 'userProfiles'), where('role', 'in', ['admin', 'head_admin']));
          const adminSnap = await getDocs(adminQuery);
          const adminEmails = adminSnap.docs.map(d => d.data().email);

          await notifyAdminsOfRequest(userData, adminEmails);
          
          setIsAwaitingApproval(true);
          localStorage.removeItem('pending_verification_user');
        } else {
          setError('Invalid operational key.');
        }
      } else {
        setError('Verification session not found.');
      }
    } catch (err) {
      setError('System verification failure.');
    } finally {
      setLoading(false);
    }
  };

  if (isAwaitingApproval) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold">Identity Established</h2>
          <p className="text-muted-foreground text-sm">
            Verification successful. Administrators have been notified to authorize your role and activate your account.
          </p>
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
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Verify Key</h2>
          <p className="text-sm text-muted-foreground">Enter the 6-digit operational key sent to your email.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            placeholder="000000"
            className="text-center text-3xl tracking-[0.4em] font-mono h-14"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Button type="submit" className="w-full h-12" disabled={loading || code.length !== 6}>
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Verify Identity"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
