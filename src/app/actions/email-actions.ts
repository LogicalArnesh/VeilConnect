
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
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good night';
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://veilconnect.netlify.app';

export async function sendSecurityEmail(to: string, code: string, name: string) {
  const greeting = getTimeGreeting();
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Security" <noreply.veilconfessions@gmail.com>',
      to,
      subject: 'Your VeilConnect Security Key',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #6366f1;">Greetings, ${name}</h2>
          <p>${greeting},</p>
          <p>Your security verification key for VeilConnect is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">Requested at: ${time}</p>
          <p style="color: #666; font-size: 14px;">This key will expire in 10 minutes.</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold;">From Team Veil Confessions</p>
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
  try {
    const promises = adminEmails.map(email => 
      transporter.sendMail({
        from: '"VeilConnect System" <noreply.veilconfessions@gmail.com>',
        to: email,
        subject: 'ALERT: New User ID Verification Request',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 2px solid #6366f1; border-radius: 10px;">
            <h2 style="color: #6366f1;">Greetings Admin,</h2>
            <p>A new user has successfully verified their email address and is requesting access.</p>
            <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${userData.fullName}</p>
              <p><strong>System ID:</strong> ${userData.userId}</p>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Verified At:</strong> ${time}</p>
            </div>
            <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold; color: #6366f1;">Intelligence Notification System</p>
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
  const subject = status === 'approved' ? 'Welcome to VeilConnect - Account Approved' : 'VeilConnect Account Status Update';
  const message = status === 'approved' 
    ? `We are pleased to inform you that your account has been approved. Role: <strong>${role}</strong>.`
    : `We regret to inform you that your registration request could not be approved at this time.`;

  try {
    await transporter.sendMail({
      from: '"VeilConnect Team" <noreply.veilconfessions@gmail.com>',
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2>Greetings, ${name}</h2>
          <p>${message}</p>
          <p style="color: #666; font-size: 12px;">Processed at: ${time}</p>
          ${status === 'approved' ? `<p style="margin-top: 20px;"><a href="${APP_URL}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access Dashboard</a></p>` : ''}
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold;">From Team Veil Confessions</p>
        </div>
      `,
    });
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
      from: '"VeilConnect Security" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `Security OTP: ${typeStr}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #6366f1;">Verification Requested</h2>
          <p>You requested a security verification for your ${typeStr}.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">Time: ${time}</p>
          <p style="margin-top: 20px; padding: 10px; background: #fee2e2; border-radius: 5px; color: #991b1b; font-size: 13px;">
            <strong>Not done by you?</strong><br/>
            If you did not request this, please alert the security team immediately by clicking below:<br/>
            <a href="${APP_URL}/security-alert?user=${encodeURIComponent(to)}&type=${type}" style="color: #991b1b; font-weight: bold; text-decoration: underline;">REPORT SECURITY BREACH</a>
          </p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold;">Veil Confessions Intelligence</p>
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
      from: '"VeilConnect Security" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `CONFIRMED: ${typeStr} Successfully Updated`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #10b981;">Security Update Successful</h2>
          <p>Greetings, ${name}.</p>
          <p>Your <strong>${typeStr}</strong> has been successfully updated in our secure system.</p>
          <p><strong>Update Timestamp (IST):</strong> ${time}</p>
          <div style="margin-top: 20px; padding: 10px; background: #fee2e2; border-radius: 5px; color: #991b1b; font-size: 13px;">
            <strong>Not done by you?</strong><br/>
            If you did not authorize this change, please contact the administrator immediately and report a breach:<br/>
            <a href="${APP_URL}/security-alert?user=${encodeURIComponent(to)}&type=${type}_change" style="color: #991b1b; font-weight: bold; text-decoration: underline;">REPORT UNAUTHORIZED CHANGE</a>
          </div>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold;">Veil Confessions Team</p>
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
  try {
    const promises = adminEmails.map(email => 
      transporter.sendMail({
        from: '"VeilConnect Security" <noreply.veilconfessions@gmail.com>',
        to: email,
        subject: 'URGENT: SECURITY BREACH REPORTED',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 3px solid #ef4444; border-radius: 10px;">
            <h2 style="color: #ef4444;">SECURITY ALERT</h2>
            <p>A user has manually reported a security breach regarding their account recovery.</p>
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px;">
              <p><strong>Affected User:</strong> ${affectedUser}</p>
              <p><strong>Action Type:</strong> ${type}</p>
              <p><strong>Reported At (IST):</strong> ${time}</p>
            </div>
            <p><strong>REQUIRED ACTION:</strong> Please log in to the admin panel to freeze this user's account and investigate immediately.</p>
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

export async function sendMeetingInvite(to: string, meetingData: { title: string; time: string; link: string; type: string }) {
  try {
    await transporter.sendMail({
      from: '"VeilConnect Operations" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `NEW MEETING: ${meetingData.title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #6366f1; border-radius: 10px;">
          <h2 style="color: #6366f1;">Operational Briefing</h2>
          <p>New session scheduled (All times in IST):</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px;">
            <p><strong>Title:</strong> ${meetingData.title}</p>
            <p><strong>Scheduled Time:</strong> ${meetingData.time}</p>
          </div>
          <p style="margin-top: 20px;">
            <a href="${meetingData.link}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Google Meet</a>
          </p>
        </div>
      `
    });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
