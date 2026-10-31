const nodemailer = require('nodemailer');
const { createTransporter } = require('../config/mailer');

const sendContactNotification = async (contactData) => {
  console.log('[EmailService] Starting contact email send');

  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const receiver = process.env.CONTACT_RECEIVER_EMAIL || user || 'admin@notesofani.com';

  if (!user || !pass || user.includes('your_email')) {
    console.log('[EmailService] Missing SMTP configuration');
    return { success: false, error: 'Missing SMTP configuration' };
  }

  try {
    const transporter = createTransporter();
    const emailSubject = contactData.subject ? `NotesofAni Contact: ${contactData.subject}` : 'NotesofAni Contact: New Message';

    const mailOptions = {
      from: `"NotesofAni Contact Form" <${user}>`,
      to: receiver,
      replyTo: contactData.email,
      subject: emailSubject,
      text: `New contact form submission received on NotesofAni:

Name: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject}

Message:
${contactData.message}
`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #090D16; color: #E2E8F0;">
          <h2 style="color: #38bdf8;">New Contact Message — NotesofAni</h2>
          <p><strong>From:</strong> ${contactData.name} (&lt;${contactData.email}&gt;)</p>
          <p><strong>Subject:</strong> ${contactData.subject}</p>
          <hr style="border-color: #171F30;" />
          <p><strong>Message:</strong></p>
          <p style="background-color: #0F1420; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${contactData.message}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Contact email sent successfully, Message ID:', info.messageId);

    let previewUrl = null;
    if (typeof nodemailer.getTestMessageUrl === 'function') {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  } catch (error) {
    console.error('[EmailService] Contact email failed:', error.message || error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
};

const sendPurchaseRequestNotification = async ({ user: reqUser, resource, purchase }) => {
  console.log('[EmailService] Starting purchase request admin notification send');

  const senderUser = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const adminReceiver = process.env.CONTACT_RECEIVER_EMAIL || senderUser || 'admin@notesofani.com';

  if (!senderUser || !pass || senderUser.includes('your_email')) {
    console.log('[EmailService] Missing SMTP configuration, running in simulated mode if available');
  }

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"NotesofAni Orders" <${senderUser || 'no-reply@notesofani.com'}>`,
      to: adminReceiver,
      subject: `[New Purchase Request] ₹${purchase.amount} for "${resource.title}"`,
      text: `New Premium Resource Purchase Request on NotesofAni:

Resource: ${resource.title}
Amount: ₹${purchase.amount}
User: ${reqUser.name} (${reqUser.email})
UPI Reference ID: ${purchase.transactionId}
Payment Note: ${purchase.paymentNote || 'None'}
Requested At: ${purchase.createdAt ? new Date(purchase.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}

Please check your PhonePe / bank statement for Ref: ${purchase.transactionId} and approve or reject this request in the Admin Dashboard:
/admin/purchases
`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #090D16; color: #E2E8F0; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1E293B;">
          <div style="border-bottom: 1px solid #1E293B; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #38BDF8; margin: 0 0 6px 0; font-size: 20px;">New Purchase Request</h2>
            <p style="color: #94A3B8; font-size: 13px; margin: 0;">A user has submitted a manual UPI payment for verification.</p>
          </div>

          <div style="background-color: #0F1420; border: 1px solid #1E293B; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="color: #94A3B8; padding: 6px 0; width: 140px;">Resource:</td>
                <td style="color: #FFFFFF; font-weight: 600; padding: 6px 0;">${resource.title}</td>
              </tr>
              <tr>
                <td style="color: #94A3B8; padding: 6px 0;">Amount:</td>
                <td style="color: #38BDF8; font-weight: bold; font-size: 16px; padding: 6px 0;">₹${purchase.amount}</td>
              </tr>
              <tr>
                <td style="color: #94A3B8; padding: 6px 0;">Requester:</td>
                <td style="color: #FFFFFF; padding: 6px 0;">${reqUser.name} (&lt;${reqUser.email}&gt;)</td>
              </tr>
              <tr>
                <td style="color: #94A3B8; padding: 6px 0;">UPI Reference / UTR:</td>
                <td style="color: #FCD34D; font-family: monospace; font-size: 15px; font-weight: bold; padding: 6px 0;">${purchase.transactionId}</td>
              </tr>
              ${purchase.paymentNote ? `
              <tr>
                <td style="color: #94A3B8; padding: 6px 0; vertical-align: top;">Note:</td>
                <td style="color: #CBD5E1; padding: 6px 0;">${purchase.paymentNote}</td>
              </tr>` : ''}
              <tr>
                <td style="color: #94A3B8; padding: 6px 0;">Time:</td>
                <td style="color: #94A3B8; padding: 6px 0;">${new Date().toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94A3B8; margin-bottom: 20px;">
            Verify this transaction in your bank/PhonePe statement before approving.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Purchase request notification sent successfully, Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Purchase request notification failed (non-fatal):', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
};

const sendPurchaseStatusNotification = async ({ user: reqUser, resource, purchase, status, reason = '' }) => {
  console.log(`[EmailService] Starting purchase status notification send (${status}) to:`, reqUser.email);

  const senderUser = process.env.SMTP_USER;
  const isApproved = status === 'approved';

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"NotesofAni" <${senderUser || 'no-reply@notesofani.com'}>`,
      to: reqUser.email,
      subject: isApproved
        ? `Purchase Approved: "${resource.title}" — NotesofAni`
        : `Update on your purchase request for "${resource.title}" — NotesofAni`,
      text: isApproved
        ? `Hi ${reqUser.name},

Great news! Your payment of ₹${purchase.amount} for "${resource.title}" (Ref: ${purchase.transactionId}) has been successfully verified.

You now have full lifetime access to this premium study resource on NotesofAni.

Log in to access your resource under "My Purchases" or open the resource directly:
${process.env.FRONTEND_URL || 'https://notesofani-z8fp.vercel.app'}/resources/${resource._id}

Thank you,
Team NotesofAni
`
        : `Hi ${reqUser.name},

We reviewed your purchase request for "${resource.title}" (Ref: ${purchase.transactionId}).

Unfortunately, we were unable to verify this transaction against our bank records.
${reason ? `Reason: ${reason}\n` : ''}
If you believe this is an error or already completed the payment, please double check the UPI reference ID or reach out to our team via the Contact page.

Thank you,
Team NotesofAni
`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #090D16; color: #E2E8F0; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1E293B;">
          <div style="border-bottom: 1px solid #1E293B; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: ${isApproved ? '#34D399' : '#F87171'}; margin: 0 0 6px 0; font-size: 20px;">
              ${isApproved ? 'Payment Verified & Resource Unlocked!' : 'Purchase Request Update'}
            </h2>
            <p style="color: #94A3B8; font-size: 13px; margin: 0;">NotesofAni Premium Resource Access</p>
          </div>

          <p style="font-size: 14px; color: #E2E8F0; line-height: 1.6;">
            Hi <strong>${reqUser.name}</strong>,
          </p>

          <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
            ${isApproved
              ? `Your payment of <strong>₹${purchase.amount}</strong> for <strong>"${resource.title}"</strong> has been approved. You now have lifetime access!`
              : `Your purchase request for <strong>"${resource.title}"</strong> (Ref: <code style="color: #FCD34D;">${purchase.transactionId}</code>) could not be verified.`}
          </p>

          ${!isApproved && reason ? `
          <div style="background-color: #1E1B24; border-left: 3px solid #F87171; padding: 12px; margin: 16px 0; border-radius: 4px; font-size: 13px; color: #FCA5A5;">
            <strong>Note from Admin:</strong> ${reason}
          </div>` : ''}

          <div style="background-color: #0F1420; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="color: #94A3B8; padding: 4px 0;">Resource:</td>
                <td style="color: #FFFFFF; font-weight: 600; padding: 4px 0;">${resource.title}</td>
              </tr>
              <tr>
                <td style="color: #94A3B8; padding: 4px 0;">Amount:</td>
                <td style="color: #FFFFFF; padding: 4px 0;">₹${purchase.amount}</td>
              </tr>
              <tr>
                <td style="color: #94A3B8; padding: 4px 0;">Status:</td>
                <td style="color: ${isApproved ? '#34D399' : '#F87171'}; font-weight: bold; padding: 4px 0; text-transform: uppercase;">
                  ${status}
                </td>
              </tr>
            </table>
          </div>

          ${isApproved ? `
          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://notesofani-z8fp.vercel.app'}/resources/${resource._id}"
               style="background-color: #38BDF8; color: #090D16; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
              Access Resource Now
            </a>
          </div>` : ''}

          <p style="font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 16px; margin-top: 24px;">
            NotesofAni — Academic Excellence & Engineering Resources.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Purchase status email sent successfully, Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Purchase status email failed (non-fatal):', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
};

module.exports = {
  sendContactNotification,
  sendPurchaseRequestNotification,
  sendPurchaseStatusNotification,
};
