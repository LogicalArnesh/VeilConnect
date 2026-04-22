
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendBreachAlertToAdmins } from '@/app/actions/email-actions';

function SecurityAlertContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const [status, setStatus] = useState<'loading' | 'sent' | 'error'>('loading');
  
  const userEmail = searchParams.get('user');
  const type = searchParams.get('type');

  useEffect(() => {
    async function notifyAdmins() {
      if (!userEmail) return;
      try {
        const adminQuery = query(collection(db, 'userProfiles'), where('role', '==', 'admin'));
        const adminSnap = await getDocs(adminQuery);
        const adminEmails = adminSnap.docs.map(doc => doc.data().email);
        if (adminEmails.length === 0) adminEmails.push('meet.arnesh@gmail.com');

        await sendBreachAlertToAdmins(userEmail, type || 'unknown', adminEmails);
        setStatus('sent');
      } catch (err) {
        setStatus('error');
      }
    }
    notifyAdmins();
  }, [userEmail, type, db]);

  return (
    <AuthLayout>
      <div className="text-center space-y-6">
        {status === 'loading' ? (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold">Reporting Security Breach...</h2>
            <p className="text-sm text-muted-foreground">Establishing a secure line to administrators.</p>
          </>
        ) : status === 'sent' ? (
          <>
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-destructive uppercase tracking-widest">Alert Dispatched</h2>
            <p className="text-sm">Administrators have been notified of this unauthorized attempt. Your account is being reviewed for emergency freeze.</p>
            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
          </>
        ) : (
          <>
            <ShieldAlert className="h-12 w-12 text-orange-500 mx-auto" />
            <h2 className="text-xl font-bold">Report Failed</h2>
            <p className="text-sm text-muted-foreground">Please contact support directly at meet.arnesh@gmail.com.</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function SecurityAlertPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>}>
      <SecurityAlertContent />
    </Suspense>
  );
}
