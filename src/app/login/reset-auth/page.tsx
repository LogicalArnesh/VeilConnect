
"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sendResetConfirmationEmail } from '@/app/actions/email-actions';

function ResetAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [success, setSuccess] = useState(false);

  const type = searchParams.get('type') as 'uid' | 'password';
  const email = searchParams.get('email');
  const userId = searchParams.get('uid');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Missing session data.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const codeDoc = await getDoc(doc(db, 'verificationCodes', userId));
      if (codeDoc.exists()) {
        const data = codeDoc.data();
        if (new Date() > new Date(data.expiresAt)) {
          setError('Security key has expired.');
        } else if (data.code === code) {
          setIsVerified(true);
        } else {
          setError('Invalid key.');
        }
      } else {
        setError('Verification session not found.');
      }
    } catch (err) {
      setError('Connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newValue) return;
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error('User profile not found.');
      }
      const userData = userSnap.data();

      if (type === 'uid') {
        await updateDoc(userRef, { id: newValue, updatedAt: new Date().toISOString() });
      } else {
        await updateDoc(userRef, { passcode: newValue, updatedAt: new Date().toISOString() });
      }

      await sendResetConfirmationEmail(email!, userData?.fullName || 'Operative', type);
      await deleteDoc(doc(db, 'verificationCodes', userId));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold">Update Successful</h2>
          <p className="text-sm text-muted-foreground">Your {type === 'uid' ? 'User ID' : 'Passcode'} has been updated securely. You can now log in.</p>
          <Button onClick={() => router.push('/login')} className="w-full">Return to Access Control</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">{isVerified ? `Update ${type === 'uid' ? 'User ID' : 'Passcode'}` : 'Verify Identity'}</h2>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {!isVerified ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Enter the key sent to:</p>
              <p className="text-xs font-mono bg-secondary/50 p-1 rounded">{email}</p>
            </div>
            <Input 
              placeholder="000000" 
              className="text-center text-2xl tracking-[0.4em] font-mono h-12" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              maxLength={6} 
              required 
            />
            <Button className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Confirm Identity
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label>Enter New {type === 'uid' ? 'User ID' : 'Passcode'}</Label>
              <Input 
                type={type === 'password' ? 'password' : 'text'} 
                placeholder={type === 'uid' ? 'e.g., agent_x' : '••••••••'} 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)} 
                required 
              />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Apply Security Update
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default function ResetAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>}>
      <ResetAuthContent />
    </Suspense>
  );
}
