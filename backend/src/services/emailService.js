const nodemailer = require('nodemailer');
const { createTransporter } = require('../config/mailer');

/**
 * Sends notification email when a user submits the Contact Us form
 * @param {Object} contactData - { name, email, subject, message }
 */
const sendContactNotification = async (contactData) => {
  console.log('[EmailService] Starting contact email send');

  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const receiver = process.env.CONTACT_RECEIVER_EMAIL || user || 'admin@notesofani.com';

  console.log('[EmailService] SMTP configuration loaded:');
  console.log(`host=${host}`);
  console.log(`port=${port}`);
  console.log(`user=${user || 'None'}`);
  console.log(`receiver=${receiver}`);

  if (!user || !pass || user.includes('your_email')) {
    console.log('[EmailService] Missing SMTP configuration');
    console.error('[EmailService] Contact email failed');
    console.error('Error: Missing SMTP configuration');
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
    console.log('[EmailService] Contact email sent successfully');
    console.log(`Message ID: ${info.messageId}`);

    let previewUrl = null;
    if (typeof nodemailer.getTestMessageUrl === 'function') {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }
    if (previewUrl) {
      console.log('[EmailService] Ethereal preview:');
      console.log(previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  } catch (error) {
    console.error('[EmailService] Contact email failed');
    console.error(`Error: ${error.message || error}`);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
};

module.exports = { sendContactNotification };

