
'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.veilconfessions@gmail.com',
    pass: 'vowg csze pfdx vway',
  },
});

const COLOR_RED = '#e11d48';
const COLOR_GREEN = '#16a34a';
const COLOR_WHITE = '#ffffff';
const HEAD_ADMIN_EMAIL = 'veilconfessions@gmail.com';
const LOGO_URL = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop';

function getISTDateString() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }) + ' (IST)';
}

const EMAIL_FOOTER = `
  <div style="margin-top: 40px; border-top: 2px solid ${COLOR_GREEN}; padding-top: 25px; color: #64748b; font-size: 11px; text-align: center; font-family: 'Inter', sans-serif;">
    <p style="margin: 0; font-weight: 800; color: ${COLOR_RED}; text-transform: uppercase; letter-spacing: 2px;">VeilConnect Intelligence Ops</p>
    <p style="margin: 6px 0;">Authorized Personnel Only. Logged Access strictly monitored.</p>
    <p style="margin: 6px 0;">&copy; ${new Date().getFullYear()} Veil Confessions. All Rights Reserved.</p>
    <p style="margin: 6px 0;">Command HQ: <a href="mailto:veilconfessions@gmail.com" style="color: ${COLOR_GREEN}; font-weight: bold; text-decoration: none;">veilconfessions@gmail.com</a></p>
  </div>
`;

const LOGO_HTML = `
  <div style="text-align: center; margin-bottom: 25px;">
    <img src="${LOGO_URL}" alt="VEIL" style="width: 80px; height: 80px; border-radius: 20px; object-fit: cover; border: 3px solid ${COLOR_RED};" />
  </div>
`;

export async function sendConfessionAlertToAdmins(confessionData: any, adminEmails: string[]) {
  const recipients = Array.from(new Set([...adminEmails, HEAD_ADMIN_EMAIL]));
  const time = getISTDateString();

  const mailPromises = recipients.map(email => 
    transporter.sendMail({
      from: '"Veil Intelligence" <noreply.veilconfessions@gmail.com>',
      to: email,
      subject: `[LOG ALERT] New Submission #${confessionData.confessionNo}`,
      html: `
        <div style="background: #f1f5f9; padding: 40px; font-family: 'Inter', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: ${COLOR_WHITE}; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, ${COLOR_RED}, ${COLOR_GREEN}); padding: 50px 40px; text-align: center;">
              ${LOGO_HTML}
              <h1 style="color: ${COLOR_WHITE}; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">Incoming Mission</h1>
            </div>
            <div style="padding: 40px;">
              <div style="background: #f8fafc; padding: 30px; border-left: 6px solid ${COLOR_RED}; border-radius: 16px; margin-bottom: 30px;">
                <p style="font-style: italic; color: #334155; font-size: 18px; margin: 0; line-height: 1.6;">"${confessionData.content}"</p>
              </div>
              <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; font-size: 13px; color: #64748b;">
                <p style="margin: 5px 0;"><strong>Submission ID:</strong> <span style="font-family: monospace; color: #0f172a;">${confessionData.submissionId}</span></p>
                <p style="margin: 5px 0;"><strong>Mission Rank:</strong> <span style="color: ${COLOR_RED}; font-weight: bold;">#${confessionData.confessionNo}</span></p>
                <p style="margin: 5px 0;"><strong>Origin Pulse:</strong> ${confessionData.ipAddress}</p>
                <p style="margin: 5px 0;"><strong>Logged At:</strong> ${time}</p>
              </div>
              <div style="margin-top: 35px; text-align: center;">
                <a href="https://veilconnect.netlify.app/dashboard" style="display: inline-block; padding: 16px 32px; background: ${COLOR_GREEN}; color: ${COLOR_WHITE}; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Open Command Dashboard</a>
              </div>
            </div>
            ${EMAIL_FOOTER}
          </div>
        </div>
      `
    })
  );
  await Promise.all(mailPromises);
}

export async function sendSecurityEmail(to: string, code: string, name: string) {
  const time = getISTDateString();
  try {
    await transporter.sendMail({
      from: '"Veil Security" <noreply.veilconfessions@gmail.com>',
      to,
      subject: 'Identity Authorization Required',
      html: `
        <div style="background: #f1f5f9; padding: 40px; font-family: 'Inter', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: ${COLOR_WHITE}; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: ${COLOR_RED}; padding: 40px; text-align: center;">
              ${LOGO_HTML}
              <h1 style="color: ${COLOR_WHITE}; margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">Verification Key</h1>
            </div>
            <div style="padding: 40px; text-align: center;">
              <p style="font-size: 16px; color: #334155;">Operative <strong>${name}</strong>,</p>
              <p style="font-size: 14px; color: #64748b;">Establish your session identity using this authorized key:</p>
              <div style="background: #fff5f5; border: 2px dashed ${COLOR_RED}; border-radius: 16px; padding: 30px; margin: 30px 0;">
                <span style="font-family: 'monospace'; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: ${COLOR_RED};">${code}</span>
              </div>
              <p style="font-size: 11px; color: #94a3b8;">Timestamp: ${time}</p>
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
  await transporter.sendMail({
    from: '"Veil Command" <noreply.veilconfessions@gmail.com>',
    to,
    subject: `Operational Status: Role Assigned to ${newRole.toUpperCase()}`,
    html: `
      <div style="background: #f1f5f9; padding: 40px; font-family: 'Inter', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: ${COLOR_WHITE}; border-radius: 24px; overflow: hidden;">
          <div style="background: ${COLOR_GREEN}; padding: 40px; text-align: center;">
            ${LOGO_HTML}
            <h1 style="color: ${COLOR_WHITE}; margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">Role Assigned</h1>
          </div>
          <div style="padding: 40px; text-align: center;">
            <p style="font-size: 16px;">Greetings, ${name}. Your operational sector role is:</p>
            <div style="background: #f1f5f9; padding: 25px; border-radius: 16px; margin: 25px 0;">
              <h2 style="color: ${COLOR_RED}; margin: 0; text-transform: uppercase; font-size: 32px; font-weight: 900;">${newRole}</h2>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">Sector Sync: ${time}</p>
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
      from: '"Veil Identity Control" <noreply.veilconfessions@gmail.com>',
      to: email,
      subject: `[SECURITY] New Identity established: ${userData.fullName}`,
      html: `
        <div style="background: #f1f5f9; padding: 40px; font-family: 'Inter', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: ${COLOR_WHITE}; border-radius: 24px; overflow: hidden; padding: 40px;">
            ${LOGO_HTML}
            <h2 style="color: ${COLOR_RED}; font-weight: 900; text-transform: uppercase;">Identity Verification Required</h2>
            <div style="background: #f8fafc; padding: 25px; border-radius: 16px; border-left: 6px solid ${COLOR_GREEN}; margin: 25px 0;">
              <p style="margin: 8px 0; font-size: 14px;"><strong>Operative:</strong> ${userData.fullName}</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> ${userData.email}</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Sector ID:</strong> ${userData.id}</p>
            </div>
            <div style="text-align: center;">
              <a href="https://veilconnect.netlify.app/dashboard" style="display: inline-block; padding: 14px 28px; background: ${COLOR_RED}; color: ${COLOR_WHITE}; text-decoration: none; border-radius: 10px; font-weight: bold;">Review Identity</a>
            </div>
          </div>
          ${EMAIL_FOOTER}
        </div>
      `
    })
  );
  await Promise.all(mailPromises);
}

export async function sendResetConfirmationEmail(to: string, name: string, type: string) {
  const time = getISTDateString();
  await transporter.sendMail({
    from: '"Veil System Control" <noreply.veilconfessions@gmail.com>',
    to,
    subject: `[SYSTEM] ${type.toUpperCase()} Synchronized`,
    html: `
      <div style="background: #f1f5f9; padding: 40px; font-family: 'Inter', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: ${COLOR_WHITE}; border-radius: 24px; padding: 40px; text-align: center;">
          ${LOGO_HTML}
          <h2 style="color: ${COLOR_GREEN}; font-weight: 900;">Sector Sync Successful</h2>
          <p>Your ${type === 'uid' ? 'User ID' : 'Passcode'} has been updated securely.</p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Timestamp: ${time}</p>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `
  });
}
