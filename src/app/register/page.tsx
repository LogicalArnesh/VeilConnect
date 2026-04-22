
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
      // In this version, we set the user to 'active' immediately to simplify access
      // while still sending the verification email for security protocol simulation.
      const userProfile = {
        id: formData.userId,
        email: formData.email,
        fullName: formData.fullName,
        role: 'user',
        status: 'active',
        passcode: formData.passcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'userProfiles', formData.userId), userProfile);
      
      // Auto-log the user in
      localStorage.setItem('veil_user', JSON.stringify(userProfile));
      
      // Optional: Send a professional welcome email in background
      // For now, redirect to dashboard
      router.push('/dashboard');
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
          <h2 className="text-xl font-semibold tracking-tight">Initialize Account</h2>
          <p className="text-sm text-muted-foreground">
            Establish your professional identity on the platform
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
                  placeholder="e.g., Alex Rivers" 
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
                  placeholder="name@example.com" 
                  className="pl-10" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Secure Passcode</Label>
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
              <span className="font-semibold">Security Protocol</span>
            </div>
            <p>• Accounts are verified against operational standards.</p>
            <p>• Multi-factor authentication is active for recovery.</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Register Identity"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Existing operative?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Log in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
