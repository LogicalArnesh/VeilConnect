'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.veilconfessions@gmail.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

function getISTDateString() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }) + ' (IST)';
}

function getTimeGreeting() {
  const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const FOOTER_HTML = `
  <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 12px; font-style: italic;">
    This is an automated system-generated message from VeilConnect Interactive. Please do not reply to this email. For assistance, contact the head of intelligence.
  </div>
`;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://veilconnect.netlify.app';
const HEAD_ADMIN_EMAIL = 'meet.arnesh@gmail.com';

function ensureHeadAdmin(emails: string[]) {
  const set = new Set(emails);
  set.add(HEAD_ADMIN_EMAIL);
  return Array.from(set);
}

export async function sendSecurityEmail(to: string, code: string, name: string) {
  const greeting = getTimeGreeting();
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: 'Security Verification Key',
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 30px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 550px; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Verification Identity Check</h2>
          <p>${greeting}, ${name}.</p>
          <p>Your requested security verification key is provided below. This key is valid for single use within a 10-minute window.</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; text-align: center; padding: 30px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin: 25px 0; color: #0f172a;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 14px;">Event Timestamp: ${time}</p>
          <p style="font-weight: 600; margin-top: 30px; color: #4f46e5;">Veil Confessions Operations Unit</p>
          ${FOOTER_HTML}
        </div>
      `,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendAdminNotification(userData: { userId: string; email: string; fullName: string }, adminEmails: string[]) {
  const time = getISTDateString();
  const recipients = ensureHeadAdmin(adminEmails);
  
  try {
    const promises = recipients.map(email => 
      transporter.sendMail({
        from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
        to: email,
        subject: `ACTION REQUIRED: New Registration Request - ${userData.userId}`,
        html: `
          <div style="font-family: sans-serif; padding: 30px; border: 1px solid #4f46e5; border-radius: 12px; background: #fdfdfd;">
            <h2 style="color: #4f46e5;">New User Verification Alert</h2>
            <p>A new operative has successfully verified their contact email and is awaiting role synchronization.</p>
            <div style="background: #f1f5f9; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4f46e5;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${userData.fullName}</p>
              <p style="margin: 5px 0;"><strong>System UID:</strong> ${userData.userId}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${userData.email}</p>
              <p style="margin: 5px 0;"><strong>Verified At:</strong> ${time}</p>
            </div>
            <p>Please log in to the command center to approve or deny this request.</p>
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Access Dashboard</a>
            ${FOOTER_HTML}
          </div>
        `,
      })
    );
    await Promise.all(promises);
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function sendApprovalStatusEmail(to: string, name: string, status: 'approved' | 'denied', adminEmails: string[], role?: string) {
  const time = getISTDateString();
  const subject = status === 'approved' ? 'CONFIRMED: Account Activation' : 'Update: Registration Status';
  const recipients = ensureHeadAdmin(adminEmails);

  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 550px;">
          <h2 style="color: ${status === 'approved' ? '#10b981' : '#ef4444'};">Account Status Update</h2>
          <p>Greetings, ${name}.</p>
          ${status === 'approved' 
            ? `<p>Your account has been successfully approved. You have been assigned the role of: <strong>${role}</strong>.</p>`
            : `<p>We regret to inform you that your registration request has been denied by the administration unit.</p>`}
          <p style="color: #64748b; font-size: 13px;">Processed At: ${time}</p>
          ${status === 'approved' ? `<div style="margin-top: 30px;"><a href="${APP_URL}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In to Platform</a></div>` : ''}
          <p style="margin-top: 30px; font-weight: bold; color: #4f46e5;">Veil Confessions Team</p>
          ${FOOTER_HTML}
        </div>
      `,
    });

    const adminPromises = recipients.map(email => 
      transporter.sendMail({
        from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
        to: email,
        subject: `ADMIN: User ${status === 'approved' ? 'Approved' : 'Denied'} - ${name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1;">
            <h3>Action Log: User Management</h3>
            <p><strong>User:</strong> ${name} (${to})</p>
            <p><strong>Status:</strong> ${status.toUpperCase()}</p>
            <p><strong>Assigned Role:</strong> ${role || 'N/A'}</p>
            <p><strong>Timestamp:</strong> ${time}</p>
            ${FOOTER_HTML}
          </div>
        `
      })
    );
    await Promise.all(adminPromises);

    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function sendRecoveryEmail(to: string, code: string, type: 'uid' | 'password') {
  const typeStr = type === 'uid' ? 'User ID Recovery' : 'Passcode Reset';
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `Security OTP: ${typeStr}`,
      html: `
        <div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 550px;">
          <h2 style="color: #4f46e5;">Account Recovery Requested</h2>
          <p>A request was received to verify your identity for ${typeStr}.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; margin: 25px 0; color: #0f172a;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 13px;">Requested Time: ${time}</p>
          <div style="margin-top: 30px; padding: 20px; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; font-size: 14px;">
            <strong style="display: block; margin-bottom: 5px;">NOT DONE BY YOU?</strong>
            If you did not initiate this request, your account may be under threat. Click the link below to report an unauthorized attempt immediately:
            <br/><br/>
            <a href="${APP_URL}/security-alert?user=${encodeURIComponent(to)}&type=${type}" style="display: inline-block; background: #e11d48; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">REPORT SECURITY BREACH</a>
          </div>
          <p style="margin-top: 30px; font-weight: bold; color: #4f46e5;">Veil Confessions Cyber Intelligence</p>
          ${FOOTER_HTML}
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function sendResetConfirmationEmail(to: string, name: string, type: 'uid' | 'password') {
  const typeStr = type === 'uid' ? 'User ID' : 'Passcode';
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `CONFIRMED: ${typeStr} Update Successful`,
      html: `
        <div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 550px;">
          <h2 style="color: #10b981;">Security Update Confirmation</h2>
          <p>Greetings, ${name}.</p>
          <p>This email confirms that your <strong>${typeStr}</strong> was successfully updated in our secure database.</p>
          <p style="color: #64748b; font-size: 13px;">Execution Time: ${time}</p>
          <div style="margin-top: 30px; padding: 15px; background: #fff1f2; border-radius: 6px; color: #991b1b; font-size: 13px;">
            <strong>UNAUTHORIZED CHANGE?</strong><br/>
            If you did not authorize this change, please contact administration and report an immediate breach:<br/>
            <a href="${APP_URL}/security-alert?user=${encodeURIComponent(to)}&type=${type}_change" style="color: #e11d48; font-weight: bold;">REPORT BREACH</a>
          </div>
          <p style="margin-top: 30px; font-weight: bold; color: #4f46e5;">Veil Confessions Security Unit</p>
          ${FOOTER_HTML}
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function sendBreachAlertToAdmins(affectedUser: string, type: string, adminEmails: string[]) {
  const time = getISTDateString();
  const recipients = ensureHeadAdmin(adminEmails);

  try {
    const promises = recipients.map(email => 
      transporter.sendMail({
        from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
        to: email,
        subject: 'URGENT: CRITICAL SECURITY BREACH REPORTED',
        priority: 'high',
        html: `
          <div style="font-family: sans-serif; padding: 30px; border: 4px solid #ef4444; border-radius: 12px; background: #fff1f2;">
            <h1 style="color: #ef4444; margin-top: 0;">SECURITY ALERT</h1>
            <p>A user has manually flagged an account recovery attempt as unauthorized.</p>
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>User At Risk:</strong> ${affectedUser}</p>
              <p style="margin: 5px 0;"><strong>Trigger Action:</strong> ${type}</p>
              <p style="margin: 5px 0;"><strong>Reported At:</strong> ${time}</p>
            </div>
            <p style="font-weight: bold; font-size: 16px;">REQUIRED IMMEDIATE ACTION:</p>
            <ul style="color: #991b1b;">
              <li>Disable account for: ${affectedUser}</li>
              <li>Investigate source IP of recovery request</li>
              <li>Perform full security audit for this operative</li>
            </ul>
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Access Security Console</a>
            ${FOOTER_HTML}
          </div>
        `
      })
    );
    await Promise.all(promises);
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
