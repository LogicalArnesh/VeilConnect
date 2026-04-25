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
      subject: `[LOG ALERT] New Confession #${confessionData.confessionNo}`,
      html: `
        <div style="background: #f1f5f9; padding: 40px; font-family: 'Inter', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: ${COLOR_WHITE}; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, ${COLOR_RED}, ${COLOR_GREEN}); padding: 50px 40px; text-align: center;">
              ${LOGO_HTML}
              <h1 style="color: ${COLOR_WHITE}; margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase;">New Confession Logged</h1>
            </div>
            <div style="padding: 40px;">
              <div style="background: #f8fafc; padding: 30px; border-left: 6px solid ${COLOR_RED}; border-radius: 16px; margin-bottom: 30px;">
                <p style="font-style: italic; color: #334155; font-size: 18px; margin: 0; line-height: 1.6;">"${confessionData.content}"</p>
              </div>
              <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; font-size: 13px; color: #64748b;">
                <p style="margin: 5px 0;"><strong>Submission ID:</strong> ${confessionData.submissionId}</p>
                <p style="margin: 5px 0;"><strong>Origin IP:</strong> ${confessionData.ipAddress}</p>
                <p style="margin: 5px 0;"><strong>Logged At:</strong> ${time}</p>
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
              <p style="font-size: 16px;">Operative <strong>${name}</strong>, use this key to establish identity:</p>
              <div style="background: #fff5f5; border: 2px dashed ${COLOR_RED}; border-radius: 16px; padding: 30px; margin: 30px 0;">
                <span style="font-family: 'monospace'; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: ${COLOR_RED};">${code}</span>
              </div>
              <p style="font-size: 11px; color: #94a3b8;">Sync: ${time}</p>
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
    subject: `Status Update: ${newRole.toUpperCase()} Assigned`,
    html: `
      <div style="background: #f1f5f9; padding: 40px; font-family: 'Inter', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: ${COLOR_WHITE}; border-radius: 24px; overflow: hidden;">
          <div style="background: ${COLOR_GREEN}; padding: 40px; text-align: center;">
            ${LOGO_HTML}
            <h1 style="color: ${COLOR_WHITE}; margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">Role Assigned</h1>
          </div>
          <div style="padding: 40px; text-align: center;">
            <p>Greetings ${name}. Your operational sector is now: <strong>${newRole}</strong>.</p>
            <p style="font-size: 12px; color: #94a3b8;">Sync: ${time}</p>
          </div>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `
  });
}
