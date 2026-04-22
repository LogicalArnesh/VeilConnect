
'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.veilconfessions@gmail.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'good morning';
  if (hour < 17) return 'good afternoon';
  return 'good night';
}

export async function sendSecurityEmail(to: string, code: string, name: string) {
  const greeting = getTimeGreeting();
  try {
    const info = await transporter.sendMail({
      from: '"VeilConnect Security" <noreply.veilconfessions@gmail.com>',
      to,
      subject: 'Your VeilConnect Security Key',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #6366f1;">Greetings, ${name}</h2>
          <p>Very ${greeting},</p>
          <p>Your security verification key for VeilConnect is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">This key will expire in 10 minutes.</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; pt-10px; font-weight: bold;">From Team Veil Confessions</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending security email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAdminNotification(userData: { userId: string; email: string; fullName: string }) {
  try {
    await transporter.sendMail({
      from: '"VeilConnect System" <noreply.veilconfessions@gmail.com>',
      to: 'noreply.veilconfessions@gmail.com', // Primary Admin Email
      subject: 'ID creation verification',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Greetings Admin,</h2>
          <p>A new user has requested account creation and verified their email address.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
            <p><strong>Name:</strong> ${userData.fullName}</p>
            <p><strong>User ID:</strong> ${userData.userId}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
          </div>
          <p>Please log in to the VeilConnect Admin Portal to approve or deny this request and assign a professional role.</p>
          <p style="margin-top: 30px;">From Team Veil Confessions</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendApprovalStatusEmail(to: string, name: string, status: 'approved' | 'denied', role?: string) {
  const subject = status === 'approved' ? 'Welcome to VeilConnect - Account Approved' : 'VeilConnect Account Status Update';
  const message = status === 'approved' 
    ? `We are pleased to inform you that your account has been approved. You have been assigned the role of <strong>${role}</strong>. You may now log in to the dashboard.`
    : `We regret to inform you that your registration request for VeilConnect could not be approved at this time.`;

  try {
    await transporter.sendMail({
      from: '"VeilConnect Team" <noreply.veilconfessions@gmail.com>',
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2>Greetings, ${name}</h2>
          <p>${message}</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold;">From Team Veil Confessions</p>
        </div>
      `,
    });

    // Notify other admins about the approval
    if (status === 'approved') {
      await transporter.sendMail({
        from: '"VeilConnect System" <noreply.veilconfessions@gmail.com>',
        to: 'noreply.veilconfessions@gmail.com',
        subject: `User Activated: ${name}`,
        html: `<p>User ${name} (${to}) has been approved and assigned the role of ${role}.</p>`
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
