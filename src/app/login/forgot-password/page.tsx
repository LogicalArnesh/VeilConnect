
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sendRecoveryEmail } from '@/app/actions/email-actions';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const q = query(collection(db, 'userProfiles'), where('email', '==', email), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const user = snap.docs[0].data();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        await setDoc(doc(db, 'verificationCodes', user.id), {
          userId: user.id,
          code,
          type: 'pass_recovery',
          email: email,
          expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
        });

        await sendRecoveryEmail(email, code, 'password');
        router.push(`/login/reset-auth?type=password&email=${email}&uid=${user.id}`);
      } else {
        setError('No account found with this email address.');
      }
    } catch (err) {
      setError('System failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Reset Passcode</h2>
          <p className="text-sm text-muted-foreground">Enter your email to receive a reset key</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRequest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="operative@veil.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send Reset Key
          </Button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
