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
const HEAD_ADMIN_EMAIL = 'meet.arnesh@gmail.com';

function getISTDateString() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }) + ' (IST)';
}

const EMAIL_FOOTER = `
  <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 25px; color: #888; font-size: 11px; text-align: center;">
    <p style="margin: 0; font-weight: 700; color: ${PRIMARY_COLOR}; text-transform: uppercase; letter-spacing: 1px;">VeilConnect Operations Command</p>
    <p style="margin: 6px 0;">This is a secure, automated system message. Please do not reply.</p>
    <p style="margin: 6px 0;">&copy; ${new Date().getFullYear()} Veil Confessions Intelligence Unit. Unauthorized access is prohibited.</p>
  </div>
`;

export async function sendSecurityEmail(to: string, code: string, name: string) {
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to,
      subject: 'Security Protocol: Identity Verification Key',
      html: `
        <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR}); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Verification Key</h1>
            </div>
            <div style="padding: 35px;">
              <p>Greetings, <strong>${name}</strong>.</p>
              <p>Please utilize the unique authorization key below to verify your operational identity:</p>
              <div style="background: #fff8f6; border: 2px dashed ${PRIMARY_COLOR}; border-radius: 10px; padding: 25px; margin: 25px 0; text-align: center;">
                <span style="font-family: monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: ${PRIMARY_COLOR};">${code}</span>
              </div>
              <p style="font-size: 12px; color: #999; text-align: center;">Issued at: ${time}</p>
            </div>
            ${EMAIL_FOOTER}
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendRoleChangeEmail(to: string, name: string, newRole: string) {
  const time = getISTDateString();
  const securityLink = `https://veilconnect.netlify.app/security-alert?user=${encodeURIComponent(to)}&type=role_change`;

  await transporter.sendMail({
    from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
    to,
    subject: `Operational Update: Role Escalation to ${newRole.toUpperCase()}`,
    html: `
      <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
          <div style="background: ${PRIMARY_COLOR}; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Role Assignment Confirmed</h1>
          </div>
          <div style="padding: 35px;">
            <p>Greetings, <strong>${name}</strong>.</p>
            <p>Your operational status has been updated by Command. Your new clearance level is:</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="color: ${PRIMARY_COLOR}; margin: 0; text-transform: uppercase;">${newRole}</h2>
            </div>
            <p style="font-size: 13px; line-height: 1.6;">You may now access advanced dashboard features and command protocols associated with this identity level.</p>
            <p style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Timestamp: ${time}</p>
            <div style="margin-top: 25px; background: #fff5f5; border: 1px solid #feb2b2; padding: 15px; border-radius: 6px;">
              <p style="margin: 0; font-size: 12px; color: #c53030;"><strong>Not done by you?</strong> If you did not expect this change, please <a href="${securityLink}" style="color: ${PRIMARY_COLOR}; font-weight: bold;">report unauthorized access immediately</a>.</p>
            </div>
          </div>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `
  });
}

export async function notifyAdminsOfRequest(userData: any, adminEmails: string[]) {
  const recipients = Array.from(new Set([...adminEmails, HEAD_ADMIN_EMAIL]));
  const time = getISTDateString();

  const mailPromises = recipients.map(email => 
    transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to: email,
      subject: `[ALERT] New Registration Request: ${userData.fullName}`,
      html: `
        <div style="background: #fff; padding: 30px; font-family: sans-serif;">
          <h2 style="color: ${PRIMARY_COLOR};">New Identity Access Request</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid ${PRIMARY_COLOR};">
            <p><strong>Name:</strong> ${userData.fullName}</p>
            <p><strong>User ID:</strong> ${userData.id}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Requested At:</strong> ${time}</p>
          </div>
          <p>Please log in to the command dashboard to assign a role and approve this operative.</p>
          ${EMAIL_FOOTER}
        </div>
      `
    })
  );
  await Promise.all(mailPromises);
}

export async function sendActivationEmail(userData: any, adminEmails: string[]) {
  const recipients = Array.from(new Set([...adminEmails, HEAD_ADMIN_EMAIL]));
  const time = getISTDateString();

  await transporter.sendMail({
    from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
    to: userData.email,
    subject: 'Operational Access Granted: Account Active',
    html: `
      <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif;">
        <h2 style="color: #059669;">Access Granted</h2>
        <p>Greetings, ${userData.fullName}. Your account has been approved and activated with the role of <strong>${userData.role}</strong>.</p>
        <p>Issued at: ${time}</p>
        ${EMAIL_FOOTER}
      </div>
    `
  });

  const adminMailPromises = recipients.map(email => 
    transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to: email,
      subject: `[CONFIRMED] Operative Activated: ${userData.fullName}`,
      html: `
        <div style="background: #fff; padding: 30px; font-family: sans-serif;">
          <h2 style="color: #059669;">Activation Confirmed</h2>
          <p>Operative <strong>${userData.fullName}</strong> has been successfully activated by an administrator.</p>
          <p>Update Timestamp: ${time}</p>
          ${EMAIL_FOOTER}
        </div>
      `
    })
  );
  await Promise.all(adminMailPromises);
}

export async function sendBreachAlertToAdmins(compromisedEmail: string, type: string, adminEmails: string[]) {
  const recipients = Array.from(new Set([...adminEmails, HEAD_ADMIN_EMAIL]));
  const time = getISTDateString();

  const mailPromises = recipients.map(email => 
    transporter.sendMail({
      from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
      to: email,
      subject: `[CRITICAL] Security Breach Alert: ${compromisedEmail}`,
      html: `
        <div style="background: #450a0a; padding: 30px; font-family: sans-serif;">
          <div style="background: white; border-top: 8px solid #dc2626; padding: 30px; border-radius: 8px;">
            <h1 style="color: #dc2626; text-align: center;">SECURITY BREACH</h1>
            <p>A manual unauthorized access report has been triggered.</p>
            <div style="background: #fef2f2; padding: 20px; border: 1px solid #fee2e2; border-radius: 6px;">
              <p><strong>Account:</strong> ${compromisedEmail}</p>
              <p><strong>Attempt Type:</strong> ${type}</p>
              <p><strong>Reported At:</strong> ${time}</p>
            </div>
            ${EMAIL_FOOTER}
          </div>
        </div>
      `
    })
  );
  await Promise.all(mailPromises);
}

export async function sendRecoveryEmail(email: string, code: string, type: 'password' | 'uid') {
  const time = getISTDateString();
  const securityLink = `https://veilconnect.netlify.app/security-alert?user=${encodeURIComponent(email)}&type=${type}_recovery`;
  
  await transporter.sendMail({
    from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
    to: email,
    subject: `Security Protocol: ${type === 'password' ? 'Passcode' : 'User ID'} Recovery Key`,
    html: `
      <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #444; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Identity Recovery</h1>
          </div>
          <div style="padding: 35px;">
            <p>A recovery request was initiated for your ${type === 'password' ? 'passcode' : 'User ID'}.</p>
            <div style="background: #f5f5f5; border: 1px solid #ddd; padding: 20px; text-align: center; margin: 20px 0; font-size: 30px; font-weight: bold; letter-spacing: 5px; color: ${PRIMARY_COLOR};">
              ${code}
            </div>
            <p style="font-size: 11px; color: #999;">Issued at: ${time}</p>
            <div style="margin-top: 30px; padding: 15px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px;">
              <p style="margin: 0; font-size: 12px; color: #c53030;"><strong>Not done by you?</strong> <a href="${securityLink}" style="color: ${PRIMARY_COLOR}; font-weight: bold;">Click here to alert Command</a> of unauthorized activity.</p>
            </div>
          </div>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `
  });
}

export async function sendResetConfirmationEmail(email: string, name: string, type: 'password' | 'uid') {
  const time = getISTDateString();
  await transporter.sendMail({
    from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
    to: email,
    subject: `Security Alert: ${type === 'password' ? 'Passcode' : 'User ID'} Successfully Updated`,
    html: `
      <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif;">
        <h2 style="color: #059669;">Security Update Confirmed</h2>
        <p>Greetings, ${name}. Your operational credentials (${type}) have been updated at ${time}.</p>
        <p>If you did not authorize this change, please contact Command immediately.</p>
        ${EMAIL_FOOTER}
      </div>
    `
  });
}
