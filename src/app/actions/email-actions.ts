
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
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good night';
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
          <p>${greeting},</p>
          <p>Your security verification key for VeilConnect is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">This key will expire in 10 minutes.</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold;">From Team Veil Confessions</p>
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
      subject: 'ALERT: New User ID Verification Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid #6366f1; border-radius: 10px;">
          <h2 style="color: #6366f1;">Greetings Admin,</h2>
          <p>A new user has successfully verified their email address and is requesting access to the VeilConnect platform.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Details:</h3>
            <p><strong>Full Name:</strong> ${userData.fullName}</p>
            <p><strong>System ID:</strong> ${userData.userId}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
          </div>
          <p>Please log in to the <strong>VeilConnect Admin Portal</strong> to review, approve/deny, and assign a professional role to this user.</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold; color: #6366f1;">Intelligence Notification System</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error notifying admin of new request:', error);
    return { success: false, error: error.message };
  }
}

export async function sendApprovalStatusEmail(to: string, name: string, status: 'approved' | 'denied', role?: string) {
  const subject = status === 'approved' ? 'Welcome to VeilConnect - Account Approved' : 'VeilConnect Account Status Update';
  const message = status === 'approved' 
    ? `We are pleased to inform you that your account has been approved. You have been assigned the professional role of <strong>${role}</strong>. You may now log in to the dashboard to begin your assignments.`
    : `We regret to inform you that your registration request for VeilConnect could not be approved at this time. Please contact system support for further inquiries.`;

  try {
    // Email to User
    await transporter.sendMail({
      from: '"VeilConnect Team" <noreply.veilconfessions@gmail.com>',
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2>Greetings, ${name}</h2>
          <p>${message}</p>
          ${status === 'approved' ? '<p style="margin-top: 20px;"><a href="https://veilconnect.netlify.app" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access Dashboard</a></p>' : ''}
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-weight: bold;">From Team Veil Confessions</p>
        </div>
      `,
    });

    // Email to Admin (for Approval Confirmation)
    if (status === 'approved') {
      await transporter.sendMail({
        from: '"VeilConnect System" <noreply.veilconfessions@gmail.com>',
        to: 'noreply.veilconfessions@gmail.com',
        subject: `CONFIRMED: User Activated - ${name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 10px;">
            <h2 style="color: #10b981;">User Successfully Activated</h2>
            <p>This is a confirmation that you have approved and activated the following user account:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #10b981;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${to}</p>
              <p><strong>Assigned Role:</strong> ${role}</p>
              <p><strong>Activation Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">This user now has operational access based on their assigned role.</p>
          </div>
        `
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending approval status email:', error);
    return { success: false, error: error.message };
  }
}
