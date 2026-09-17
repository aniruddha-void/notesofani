const nodemailer = require('nodemailer');

/**
 * Creates Nodemailer transporter using environment variables
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || user.includes('your_email')) {
    // Return dummy transporter for local development if credentials not set
    return {
      isSimulated: true,
      verify: async () => true,
      sendMail: async (mailOptions) => {
        console.log('[Nodemailer Dev Mode] Simulating email delivery:');
        console.log(`  To: ${mailOptions.to}`);
        console.log(`  Subject: ${mailOptions.subject}`);
        console.log(`  Body preview: ${mailOptions.text.substring(0, 100)}...`);
        return { messageId: 'simulated-dev-message-id' };
      },
    };
  }

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

/**
 * Verifies SMTP connection using Nodemailer transporter.verify()
 */
const verifySmtpConnection = async () => {
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
    return false;
  }

  try {
    const transporter = createTransporter();
    if (transporter.isSimulated) {
      console.log('[EmailService] SMTP connection verified');
      return true;
    }
    await transporter.verify();
    console.log('[EmailService] SMTP connection verified');
    return true;
  } catch (error) {
    console.error(`[EmailService] SMTP verification failed: ${error.message || error}`);
    return false;
  }
};

module.exports = {
  createTransporter,
  verifySmtpConnection,
};

