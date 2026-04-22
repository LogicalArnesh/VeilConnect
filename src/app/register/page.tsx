
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, ShieldCheck, AlertCircle, IdCard } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sendSecurityEmail } from '@/app/actions/email-actions';

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    fullName: '',
    email: '',
    passcode: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

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
      await setDoc(doc(db, 'verificationCodes', formData.userId), {
        userId: formData.userId,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
      });

      const emailResult = await sendSecurityEmail(formData.email, verificationCode, formData.fullName);
      
      if (emailResult.success) {
        localStorage.setItem('pending_verification_user', formData.userId);
        router.push('/login/2fa');
      } else {
        setError(`Failed to send verification email: ${emailResult.error || 'System setup required. Please contact admin.'}`);
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Join the Team</h2>
          <p className="text-sm text-muted-foreground">
            Create your professional identity for VeilConnect
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="fullName" 
                  placeholder="John Doe" 
                  className="pl-10" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">Desired User ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="userId" 
                  placeholder="johndoe_veil" 
                  className="pl-10" 
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  className="pl-10" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Create Passcode</Label>
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
          </div>

          <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center text-accent">
              <ShieldCheck className="h-3 w-3 mr-1" />
              <span className="font-semibold">Security Norms</span>
            </div>
            <p>• A verification key will be sent to your email.</p>
            <p>• Access requires admin approval after verification.</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Initiate Registration"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Log in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
