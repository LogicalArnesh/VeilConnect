
'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.veilconfessions@gmail.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

const PRIMARY_COLOR = '#e14a1d'; // Vibrant Red-Orange
const ACCENT_COLOR = '#f59e0b'; // Amber-Yellow
const BG_COLOR = '#120d0b';

function getISTDateString() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }) + ' (IST)';
}

const EMAIL_FOOTER = `
  <div style="margin-top: 40px; border-top: 1px solid #3d2b26; padding-top: 25px; color: #8c736c; font-size: 11px; font-family: 'Inter', sans-serif; text-align: center;">
    <p style="margin: 0; font-weight: 600; color: ${PRIMARY_COLOR}; letter-spacing: 1px; text-transform: uppercase;">VeilConnect Operations Command</p>
    <p style="margin: 6px 0;">This is a secure, automated communication. Do not reply to this address.</p>
    <p style="margin: 6px 0;">&copy; ${new Date().getFullYear()} Veil Confessions Intelligence Unit. Unauthorized reproduction is strictly prohibited.</p>
  </div>
`;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://veilconnect.netlify.app';
const HEAD_ADMIN_EMAIL = 'meet.arnesh@gmail.com';

async function getAdminEmails() {
  // In a real scenario, we'd query Firestore here. For the prototype, we ensure the head admin is included.
  return [HEAD_ADMIN_EMAIL];
}

export async function sendSecurityEmail(to: string, code: string, name: string) {
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: 'Security Protocol: Identity Verification Key',
      html: `
        <div style="background-color: #f8f5f4; padding: 40px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1514;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR}); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -1px; font-weight: 800;">Identity Verification</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 16px; line-height: 1.6; color: #4a3a35;">Greetings, <strong>${name}</strong>.</p>
              <p style="font-size: 15px; color: #665550; line-height: 1.6;">A request has been initiated to access the VeilConnect secure environment. Please utilize the unique authorization key below:</p>
              <div style="background: #fff8f6; border: 2px dashed ${PRIMARY_COLOR}; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <span style="font-family: 'Courier New', monospace; font-size: 48px; font-weight: 800; letter-spacing: 10px; color: ${PRIMARY_COLOR};">${code}</span>
              </div>
              <p style="font-size: 13px; color: #8c736c; text-align: center; margin-bottom: 30px;">Key issued at: <strong>${time}</strong> (Valid for 10 minutes)</p>
              <div style="padding-top: 20px; border-top: 1px solid #f0e6e4;">
                <p style="font-size: 14px; color: #665550; margin-bottom: 0;">If you did not request this verification, please ignore this email or report the attempt.</p>
              </div>
            </div>
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
  const recipients = Array.from(new Set([...adminEmails, HEAD_ADMIN_EMAIL]));
  
  try {
    const promises = recipients.map(email => 
      transporter.sendMail({
        from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
        to: email,
        subject: `[ALERT] New Operative Registration: ${userData.userId}`,
        html: `
          <div style="background-color: #f8f5f4; padding: 40px; font-family: sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-top: 6px solid ${ACCENT_COLOR}; border-radius: 8px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h2 style="color: #1a1514; margin-top: 0; font-size: 22px;">New Access Request</h2>
              <p style="color: #4a3a35; font-size: 15px;">An individual has successfully verified their email and is awaiting deployment authorization.</p>
              <div style="background: #fffdf5; border-left: 4px solid ${ACCENT_COLOR}; padding: 25px; border-radius: 6px; margin: 30px 0;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #8c736c;">Full Name</td><td style="padding: 8px 0; font-weight: bold; color: #1a1514;">${userData.fullName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #8c736c;">System ID</td><td style="padding: 8px 0; font-weight: bold; color: #1a1514;">${userData.userId}</td></tr>
                  <tr><td style="padding: 8px 0; color: #8c736c;">Email</td><td style="padding: 8px 0; font-weight: bold; color: #1a1514;">${userData.email}</td></tr>
                  <tr><td style="padding: 8px 0; color: #8c736c;">Verified At</td><td style="padding: 8px 0; font-weight: bold; color: #1a1514;">${time}</td></tr>
                </table>
              </div>
              <div style="text-align: center;">
                <a href="${APP_URL}/dashboard" style="display: inline-block; background: ${PRIMARY_COLOR}; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Access Command Center</a>
              </div>
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

export async function sendRecoveryEmail(to: string, code: string, type: 'uid' | 'password') {
  const typeStr = type === 'uid' ? 'User ID Recovery' : 'Passcode Reset';
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `[URGENT] ${typeStr} Key Requested`,
      html: `
        <div style="background-color: #fff; padding: 40px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #f0e6e4; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <h2 style="color: ${PRIMARY_COLOR}; font-size: 24px;">Account Recovery Protocol</h2>
            <p style="color: #4a3a35; font-size: 15px;">A request for <strong>${typeStr}</strong> has been received for this account.</p>
            <div style="background: #fff8f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <span style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #1a1514;">${code}</span>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 25px; color: #991b1b; font-size: 14px; margin-bottom: 30px;">
              <strong style="display: block; margin-bottom: 10px; font-size: 16px;">SECURITY WARNING</strong>
              If you did not initiate this request, your account may be under observation. Please report this immediately using the link below to freeze unauthorized access.
              <br/><br/>
              <a href="${APP_URL}/security-alert?user=${encodeURIComponent(to)}&type=${type}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">REPORT UNAUTHORIZED ATTEMPT</a>
            </div>
            <p style="font-size: 12px; color: #8c736c; text-align: center;">Requested at: ${time}</p>
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

export async function sendResetConfirmationEmail(to: string, name: string, type: 'uid' | 'password') {
  const typeStr = type === 'uid' ? 'User ID' : 'Passcode';
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: `[CONFIRMED] Account Security Update: ${typeStr}`,
      html: `
        <div style="background-color: #f8f5f4; padding: 40px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-top: 6px solid #059669; border-radius: 12px; padding: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <h2 style="color: #059669; margin-top: 0;">Security Update Successful</h2>
            <p style="color: #4a3a35; font-size: 16px;">Greetings, ${name}.</p>
            <p style="color: #4a3a35; line-height: 1.6;">This email serves as official confirmation that your <strong>${typeStr}</strong> has been updated securely via the operational console.</p>
            <p style="font-size: 13px; color: #8c736c; margin-top: 25px;">Update Timestamp: ${time}</p>
            <div style="margin-top: 35px; text-align: center;">
              <a href="${APP_URL}/login" style="background: ${PRIMARY_COLOR}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; font-size: 13px; letter-spacing: 1px;">Log In to Platform</a>
            </div>
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
      subject: `[MISSION] New Task Assignment: ${taskTitle}`,
      html: `
        <div style="background-color: #f8f5f4; padding: 40px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-top: 6px solid ${PRIMARY_COLOR}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1514; margin-top: 0; font-size: 24px;">New Assignment Dispatched</h2>
            <p style="color: #4a3a35; font-size: 16px;">Operative <strong>${name}</strong>,</p>
            <p style="color: #4a3a35; line-height: 1.6;">A new high-priority operational task has been assigned to your unit:</p>
            <div style="background: #fcfcfc; padding: 30px; border-radius: 12px; border: 1px solid #f0e6e4; margin: 30px 0; text-align: center;">
              <h3 style="color: ${PRIMARY_COLOR}; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${taskTitle}</h3>
              <p style="margin: 15px 0 0 0; color: #8c736c; font-size: 13px;">Dispatch Time: ${time}</p>
            </div>
            <div style="text-align: center;">
              <a href="${APP_URL}/dashboard" style="display: inline-block; background: ${PRIMARY_COLOR}; color: #ffffff; padding: 18px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">VIEW ASSIGNMENT DETAILS</a>
            </div>
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

export async function sendBreachAlertToAdmins(compromisedEmail: string, type: string, adminEmails: string[]) {
  const time = getISTDateString();
  const recipients = Array.from(new Set([...adminEmails, HEAD_ADMIN_EMAIL]));
  
  try {
    const promises = recipients.map(email => 
      transporter.sendMail({
        from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
        to: email,
        subject: `[CRITICAL] Security Breach Alert: ${compromisedEmail}`,
        html: `
          <div style="background-color: #450a0a; padding: 40px; font-family: sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-top: 10px solid #dc2626; border-radius: 12px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
              <h1 style="color: #991b1b; font-size: 26px; margin-top: 0; text-align: center;">SECURITY ALERT</h1>
              <p style="color: #4a3a35; font-size: 16px; line-height: 1.6; text-align: center;">A user has manually reported an unauthorized access attempt to their account.</p>
              <div style="background: #fef2f2; border: 2px solid #fee2e2; padding: 30px; border-radius: 12px; margin: 30px 0;">
                <p style="margin: 10px 0; font-size: 15px;"><strong>Target Account:</strong> ${compromisedEmail}</p>
                <p style="margin: 10px 0; font-size: 15px;"><strong>Attempt Type:</strong> ${type}</p>
                <p style="margin: 10px 0; font-size: 15px;"><strong>Report Timestamp:</strong> ${time}</p>
              </div>
              <p style="color: #991b1b; font-weight: bold; text-align: center;">RECOMMENDED ACTION: Freeze account credentials immediately.</p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${APP_URL}/dashboard" style="display: inline-block; background: #dc2626; color: white; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Manage Security Freeze</a>
              </div>
              ${EMAIL_FOOTER}
            </div>
          </div>
        `,
      })
    );
    await Promise.all(promises);
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
