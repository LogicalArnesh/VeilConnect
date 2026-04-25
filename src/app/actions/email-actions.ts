
'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.veilconfessions@gmail.com',
    pass: 'vowg csze pfdx vway',
  },
});

const PRIMARY_RED: string = '#e11d48'; // Red
const SECONDARY_GREEN: string = '#16a34a'; // Emerald Green
const HEAD_ADMIN_EMAIL: string = 'veilconfessions@gmail.com';
const LOGO_URL: string = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop';

function getISTDateString() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  }) + ' (IST)';
}

const EMAIL_FOOTER = `
  <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 25px; color: #888; font-size: 11px; text-align: center; font-family: 'Inter', sans-serif;">
    <p style="margin: 0; font-weight: 700; color: ${PRIMARY_RED}; text-transform: uppercase; letter-spacing: 2px;">VeilConnect Operations Command</p>
    <p style="margin: 6px 0;">This is a secure, automated system message. Please do not reply.</p>
    <p style="margin: 6px 0;">&copy; ${new Date().getFullYear()} Veil Confessions Intelligence Unit. Unauthorized access is prohibited.</p>
    <p style="margin: 6px 0;">Contact: <a href="mailto:veilconfessions@gmail.com" style="color: ${SECONDARY_GREEN}; font-weight: bold; text-decoration: none;">veilconfessions@gmail.com</a></p>
  </div>
`;

const LOGO_HTML = `
  <div style="text-align: center; margin-bottom: 25px;">
    <img src="${LOGO_URL}" alt="VEIL" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid ${PRIMARY_RED}; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
  </div>
`;

export async function sendConfessionAlertToAdmins(confessionData: any, adminEmails: string[]) {
  const recipients = Array.from(new Set([...adminEmails, HEAD_ADMIN_EMAIL]));
  const time = getISTDateString();

  const mailPromises = recipients.map(email => 
    transporter.sendMail({
      from: '"VeilConnect Intelligence" <noreply.veilconfessions@gmail.com>',
      to: email,
      subject: `[ALERT] New Confession Received: #${confessionData.confessionNo}`,
      html: `
        <div style="background: #f8fafc; padding: 40px; font-family: 'Inter', sans-serif; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, ${PRIMARY_RED}, ${SECONDARY_GREEN}); padding: 40px; text-align: center;">
              ${LOGO_HTML}
              <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">Incoming Submission</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 16px; line-height: 1.6;">Greetings. A new anonymous operative submission has been logged into the secure database.</p>
              <div style="background: #f1f5f9; padding: 30px; border-left: 6px solid ${PRIMARY_RED}; border-radius: 12px; margin: 25px 0;">
                <p style="font-style: italic; color: #334155; font-size: 18px; margin: 0; line-height: 1.6;">"${confessionData.content}"</p>
              </div>
              <div style="font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 5px 0;"><strong>Submission ID:</strong> <span style="font-family: monospace; color: #0f172a;">${confessionData.submissionId}</span></p>
                <p style="margin: 5px 0;"><strong>Log Index:</strong> <span style="color: ${PRIMARY_RED}; font-weight: bold;">#${confessionData.confessionNo}</span></p>
                <p style="margin: 5px 0;"><strong>Origin IP:</strong> <span style="font-family: monospace;">${confessionData.ipAddress}</span></p>
                <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${time}</p>
              </div>
              <div style="margin-top: 30px; text-align: center;">
                <a href="https://veilconnect.netlify.app/dashboard" style="display: inline-block; padding: 14px 28px; background: ${SECONDARY_GREEN}; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Access Command Dashboard</a>
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
      from: '"VeilConnect Identity" <noreply.veilconfessions@gmail.com>',
      to,
      subject: 'Security Protocol: Identity Verification Key',
      html: `
        <div style="background: #f8fafc; padding: 40px; font-family: 'Inter', sans-serif; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, ${PRIMARY_RED}, ${SECONDARY_GREEN}); padding: 40px; text-align: center;">
              ${LOGO_HTML}
              <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900; text-transform: uppercase;">Verification Key</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 16px;">Greetings, <strong>${name}</strong>.</p>
              <p style="font-size: 16px;">Please utilize the unique authorization key below to verify your operational identity:</p>
              <div style="background: #fff5f5; border: 2px dashed ${PRIMARY_RED}; border-radius: 15px; padding: 35px; margin: 30px 0; text-align: center;">
                <span style="font-family: 'Roboto Mono', monospace; font-size: 48px; font-weight: 900; letter-spacing: 12px; color: ${PRIMARY_RED}; text-shadow: 0 2px 4px rgba(0,0,0,0.05);">${code}</span>
              </div>
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">Issued at: ${time}</p>
            </div>
            ${EMAIL_FOOTER}
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err: any) {
    console.error('Email send error:', err);
    return { success: false, error: err.message };
  }
}

export async function sendRoleChangeEmail(to: string, name: string, newRole: string) {
  const time = getISTDateString();
  await transporter.sendMail({
    from: '"VeilConnect Interactive" <noreply.veilconfessions@gmail.com>',
    to,
    subject: `Operational Update: Role Assignment to ${newRole.toUpperCase()}`,
    html: `
      <div style="background: #f8fafc; padding: 40px; font-family: 'Inter', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="background: ${SECONDARY_GREEN}; padding: 40px; text-align: center;">
            ${LOGO_HTML}
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">Role Assigned</h1>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px;">Greetings, ${name}. Your operational status has been updated. Your new role is:</p>
            <div style="background: #f1f5f9; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0;">
              <h2 style="color: ${PRIMARY_RED}; margin: 0; text-transform: uppercase; font-size: 28px; font-weight: 900; letter-spacing: 1px;">${newRole}</h2>
            </div>
            <p style="font-size: 16px;">You may now access dashboard features associated with this identity level.</p>
            <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 30px;">Timestamp: ${time}</p>
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
      from: '"VeilConnect Identity" <noreply.veilconfessions@gmail.com>',
      to: email,
      subject: `[ALERT] New Registration Request: ${userData.fullName}`,
      html: `
        <div style="background: #f8fafc; padding: 40px; font-family: 'Inter', sans-serif;">
          ${LOGO_HTML}
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; padding: 40px; border: 1px solid #e2e8f0;">
            <h2 style="color: ${PRIMARY_RED}; margin-top: 0; font-weight: 900; text-transform: uppercase;">New Identity Access Request</h2>
            <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; border-left: 6px solid ${SECONDARY_GREEN}; margin: 25px 0;">
              <p style="margin: 8px 0; font-size: 14px;"><strong>Name:</strong> ${userData.fullName}</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>User ID:</strong> ${userData.id}</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> ${userData.email}</p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Requested At:</strong> ${time}</p>
            </div>
            <p style="font-size: 15px;">Please log in to the command dashboard to assign a role and approve this operative.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="https://veilconnect.netlify.app/dashboard" style="display: inline-block; padding: 14px 28px; background: ${PRIMARY_RED}; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">Review Request</a>
            </div>
          </div>
          ${EMAIL_FOOTER}
        </div>
      `
    })
  );
  await Promise.all(mailPromises);
}
