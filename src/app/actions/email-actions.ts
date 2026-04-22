
'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.veilconfessions@gmail.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

const PRIMARY_COLOR = '#e14a1d'; // Reddish-Orange
const ACCENT_COLOR = '#f59e0b'; // Golden-Yellow
const BG_COLOR = '#110d0c';

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

const EMAIL_FOOTER = `
  <div style="margin-top: 40px; border-top: 1px solid #3d2b26; padding-top: 25px; color: #8c736c; font-size: 11px; font-family: 'Inter', sans-serif;">
    <p style="margin: 0; font-weight: 600; color: #e14a1d;">VeilConnect Operations Security</p>
    <p style="margin: 4px 0;">This is an automated system communication from the VeilConnect Interactive platform. Please do not respond to this address.</p>
    <p style="margin: 4px 0;">&copy; ${new Date().getFullYear()} Veil Confessions Intelligence Unit. All rights reserved.</p>
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
      subject: 'Security Verification Protocol: Identity Key',
      html: `
        <div style="background-color: #fcfcfc; padding: 40px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #1a1514;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0e6e4; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <div style="border-left: 4px solid ${PRIMARY_COLOR}; padding-left: 20px; margin-bottom: 30px;">
              <h2 style="color: ${PRIMARY_COLOR}; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Identity Verification</h2>
              <p style="color: #665550; margin: 5px 0 0 0; font-size: 14px;">${greeting}, ${name}.</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #4a3a35;">To proceed with your secure access request, please utilize the single-use verification key provided below:</p>
            <div style="background: #fff8f6; border: 2px solid ${PRIMARY_COLOR}; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
              <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: ${PRIMARY_COLOR};">${code}</span>
            </div>
            <p style="font-size: 13px; color: #8c736c;">Request Timestamp: <strong>${time}</strong></p>
            <p style="font-size: 14px; color: #4a3a35; border-top: 1px solid #f0e6e4; padding-top: 20px; margin-top: 30px;">This key will expire in 10 minutes. If you did not request this verification, please contact your unit lead immediately.</p>
            ${EMAIL_FOOTER}
          </div>
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
        subject: `ACTION REQUIRED: New Operative Verification - ${userData.userId}`,
        html: `
          <div style="background-color: #fcfcfc; padding: 40px; font-family: sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-top: 4px solid ${ACCENT_COLOR}; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #1a1514;">New Access Request</h2>
              <p style="color: #4a3a35;">A new operative has verified their email and is awaiting role synchronization.</p>
              <div style="background: #fffdf5; border-left: 4px solid ${ACCENT_COLOR}; padding: 20px; border-radius: 4px; margin: 25px 0;">
                <p style="margin: 8px 0; font-size: 14px;"><strong>Full Name:</strong> ${userData.fullName}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>System ID:</strong> ${userData.userId}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> ${userData.email}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>Verified At:</strong> ${time}</p>
              </div>
              <a href="${APP_URL}/dashboard" style="display: inline-block; background: ${PRIMARY_COLOR}; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Access Command Center</a>
              ${EMAIL_FOOTER}
            </div>
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
  const subject = status === 'approved' ? 'Deployment Confirmed: Account Activated' : 'Status Update: Access Request';
  const recipients = ensureHeadAdmin(adminEmails);

  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject,
      html: `
        <div style="background-color: #fcfcfc; padding: 40px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0e6e4; border-radius: 12px; padding: 40px;">
            <h2 style="color: ${status === 'approved' ? '#059669' : '#dc2626'}; margin-top: 0;">Operational Status Update</h2>
            <p style="font-size: 16px; color: #4a3a35;">Greetings, ${name}.</p>
            ${status === 'approved' 
              ? `<p style="font-size: 15px; color: #4a3a35; line-height: 1.6;">Your registration has been processed successfully. You have been formally assigned the following operational role: <strong style="color: ${PRIMARY_COLOR};">${role}</strong>.</p>`
              : `<p style="font-size: 15px; color: #4a3a35; line-height: 1.6;">We wish to inform you that your request for access to the VeilConnect platform has been declined by the administration unit.</p>`}
            <p style="font-size: 13px; color: #8c736c; margin-top: 20px;">Execution Timestamp: ${time}</p>
            ${status === 'approved' ? `<div style="margin-top: 40px;"><a href="${APP_URL}" style="background: ${PRIMARY_COLOR}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Log In to Operations</a></div>` : ''}
            ${EMAIL_FOOTER}
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

export async function sendRecoveryEmail(to: string, code: string, type: 'uid' | 'password') {
  const typeStr = type === 'uid' ? 'User ID Recovery' : 'Credential Reset';
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `URGENT: ${typeStr} Requested`,
      html: `
        <div style="background-color: #fcfcfc; padding: 40px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0e6e4; border-radius: 12px; padding: 40px;">
            <h2 style="color: ${PRIMARY_COLOR};">Account Security Protocol</h2>
            <p style="color: #4a3a35;">A request was received to verify identity for: <strong>${typeStr}</strong>.</p>
            <div style="background: #fff8f6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1a1514;">${code}</span>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 20px; color: #991b1b; font-size: 14px; margin-bottom: 25px;">
              <strong style="display: block; margin-bottom: 5px; font-size: 16px;">CRITICAL SECURITY ALERT:</strong>
              If you did NOT initiate this request, your credentials may be compromised. Report this attempt immediately to secure your data.
              <br/><br/>
              <a href="${APP_URL}/security-alert?user=${encodeURIComponent(to)}&type=${type}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">REPORT UNAUTHORIZED ATTEMPT</a>
            </div>
            <p style="font-size: 12px; color: #8c736c;">Requested at: ${time}</p>
            ${EMAIL_FOOTER}
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function sendTaskNotification(to: string, name: string, taskTitle: string) {
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `NEW ASSIGNMENT: ${taskTitle}`,
      html: `
        <div style="background-color: #fcfcfc; padding: 40px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-top: 4px solid ${PRIMARY_COLOR}; border-radius: 8px; padding: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1514; margin-top: 0;">New Task Assignment</h2>
            <p style="color: #4a3a35; font-size: 16px;">Greetings, ${name}.</p>
            <p style="color: #4a3a35; line-height: 1.6;">A new operational task has been assigned to your unit:</p>
            <div style="background: #f8fafc; padding: 25px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 25px 0;">
              <h3 style="color: ${PRIMARY_COLOR}; margin: 0; font-size: 18px;">${taskTitle}</h3>
              <p style="margin: 10px 0 0 0; color: #64748b; font-size: 13px;">Assigned At: ${time}</p>
            </div>
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: ${PRIMARY_COLOR}; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">VIEW TASK DETAILS</a>
            ${EMAIL_FOOTER}
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
