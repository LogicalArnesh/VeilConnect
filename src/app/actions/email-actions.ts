'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.veilconfessions@gmail.com',
    pass: 'vowg csze pfdx vway',
  },
});

const PRIMARY_COLOR: string = '#e11d48'; // Red
const SECONDARY_COLOR: string = '#16a34a'; // Green
const ACCENT_COLOR: string = '#15803d'; // Darker Green
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
  <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 25px; color: #888; font-size: 11px; text-align: center; font-family: sans-serif;">
    <p style="margin: 0; font-weight: 700; color: ${PRIMARY_COLOR}; text-transform: uppercase; letter-spacing: 1px;">VeilConnect Operations Command</p>
    <p style="margin: 6px 0;">This is a secure, automated system message. Please do not reply.</p>
    <p style="margin: 6px 0;">&copy; ${new Date().getFullYear()} Veil Confessions Intelligence Unit. Unauthorized access is prohibited.</p>
  </div>
`;

const LOGO_HTML = `
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="${LOGO_URL}" alt="VEIL" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid ${PRIMARY_COLOR};" />
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
        <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR}); padding: 30px; text-align: center;">
              ${LOGO_HTML}
              <h1 style="color: white; margin: 0; font-size: 24px;">New Confession</h1>
            </div>
            <div style="padding: 35px;">
              <p>Greetings. A new anonymous submission has been logged into the secure database.</p>
              <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid ${PRIMARY_COLOR}; border-radius: 4px; margin: 20px 0;">
                <p style="font-style: italic; color: #555;">"${confessionData.content}"</p>
              </div>
              <div style="font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
                <p><strong>Submission ID:</strong> ${confessionData.submissionId}</p>
                <p><strong>IP Address:</strong> ${confessionData.ipAddress}</p>
                <p><strong>Timestamp:</strong> ${time}</p>
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
        <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR}); padding: 30px; text-align: center;">
              ${LOGO_HTML}
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
      <div style="background: #fdfdfd; padding: 30px; font-family: sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
          <div style="background: ${SECONDARY_COLOR}; padding: 30px; text-align: center;">
            ${LOGO_HTML}
            <h1 style="color: white; margin: 0; font-size: 20px;">Role Assignment Confirmed</h1>
          </div>
          <div style="padding: 35px;">
            <p>Greetings, ${name}. Your operational status has been updated. Your new role is:</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="color: ${PRIMARY_COLOR}; margin: 0; text-transform: uppercase;">${newRole}</h2>
            </div>
            <p>You may now access dashboard features associated with this identity level.</p>
            <p style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">Timestamp: ${time}</p>
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
        <div style="background: #fff; padding: 30px; font-family: sans-serif;">
          ${LOGO_HTML}
          <h2 style="color: ${PRIMARY_COLOR};">New Identity Access Request</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid ${SECONDARY_COLOR};">
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
        ${LOGO_HTML}
        <h2 style="color: ${SECONDARY_COLOR};">Access Granted</h2>
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
          ${LOGO_HTML}
          <h2 style="color: ${SECONDARY_COLOR};">Activation Confirmed</h2>
          <p>Operative <strong>${userData.fullName}</strong> has been successfully activated by an administrator.</p>
          <p>Update Timestamp: ${time}</p>
          ${EMAIL_FOOTER}
        </div>
      `
    })
  );
  await Promise.all(adminMailPromises);
}
