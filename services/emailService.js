const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const buildTransporter = () => {
  const EMAIL_HOST = String(process.env.EMAIL_HOST || '').trim();
  const EMAIL_PORT = String(process.env.EMAIL_PORT || '587').trim();
  const EMAIL_USER = String(process.env.EMAIL_USER || '').trim();
  const EMAIL_PASS = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT || 587),
    secure: Number(EMAIL_PORT || 587) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

const sendInvoiceEmail = async ({ to, subject, html, text, attachments = [] }) => {
  const transporter = buildTransporter();

  console.log('Sending email with the following details:', {
    user: process.env.EMAIL_USER,
    to,
    subject,
    attachmentCount: attachments.length,
  });

  if (!transporter) {
    return {
      success: false,
      type: 'SMTP_NOT_CONFIGURED',
      message: 'SMTP email settings are not configured.',
    };
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  try {
    await transporter.verify();
  } catch (verifyError) {
    console.error('SMTP verification failed:', verifyError);
    return {
      success: false,
      type: 'SMTP_AUTH_FAILED',
      message: verifyError.message || 'SMTP authentication failed.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (sendError) {
    console.error('SMTP send failed:', sendError);
    return {
      success: false,
      type: 'SMTP_SEND_FAILED',
      message: sendError.message || 'SMTP send failed.',
    };
  }
};

module.exports = {
  sendInvoiceEmail,
};
