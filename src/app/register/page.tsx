"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, AlertCircle, IdCard, ShieldCheck, LockIcon } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sendSecurityEmail } from '@/app/actions/email-actions';

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationDisabled, setRegistrationDisabled] = useState(true); // DISABLING NEW REGISTRATIONS BY COMMAND DIRECTIVE
  const [formData, setFormData] = useState({
    userId: '',
    fullName: '',
    email: '',
    passcode: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registrationDisabled) return;
    
    setLoading(true);
    setError(null);

    try {
      // Check if user ID already exists
      const existingDoc = await getDoc(doc(db, 'userProfiles', formData.userId));
      if (existingDoc.exists()) {
        setError('Operational ID already registered in secure database.');
        setLoading(false);
        return;
      }

      const userProfile = {
        id: formData.userId,
        email: formData.email,
        fullName: formData.fullName,
        role: 'pending',
        status: 'pending',
        passcode: formData.passcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'userProfiles', formData.userId), userProfile);
      
      // Send 2FA OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, 'verificationCodes', formData.userId), {
        userId: formData.userId,
        code: code,
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      });

      await sendSecurityEmail(formData.email, code, formData.fullName);
      localStorage.setItem('pending_verification_user', formData.userId);
      router.push('/login/2fa');
    } catch (err: any) {
      setError(err.message || 'Identity initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  if (registrationDisabled) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center py-10">
          <LockIcon className="h-16 w-16 text-primary mx-auto animate-pulse" />
          <div className="space-y-2">
             <h2 className="text-2xl font-black uppercase text-primary">Registration Locked</h2>
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
               By direct command of Sector 01, new operative registrations are temporarily suspended.
             </p>
          </div>
          <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20">
             <p className="text-[10px] font-mono text-primary font-black uppercase">DIRECTIVE: VEIL-SEC-099</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Return to Command Access</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Initialize Account</h2>
          <p className="text-sm text-muted-foreground">Establish your operational identity</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="fullName" 
                placeholder="Operative Name" 
                className="pl-10" 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="userId">Operational ID</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="userId" 
                placeholder="e.g., rivers_ops" 
                className="pl-10" 
                value={formData.userId}
                onChange={(e) => setFormData({...formData, userId: e.target.value})}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="operative@veil.com" 
                className="pl-10" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="passcode" 
                type="password" 
                placeholder="••••••••" 
                className="pl-10" 
                value={formData.passcode}
                onChange={(e) => setFormData({...formData, passcode: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center text-accent">
              <ShieldCheck className="h-3 w-3 mr-1" />
              <span className="font-semibold uppercase tracking-wider">Security Protocol 2.1</span>
            </div>
            <p>• Initial 2FA verification required for all new IDs.</p>
            <p>• Admin approval mandatory for command access.</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Decrypting Intent..." : "Verify & Initialize"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Existing operative? <Link href="/login" className="text-accent hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}