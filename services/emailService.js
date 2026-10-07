const { randomUUID } = require('crypto');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
let transporter;
let transporterConfigKey;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const getMailConfig = () => {
  const fromAddress = normalizeEmail(process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_USER);
  const config = {
    host: String(process.env.SMTP_HOST || process.env.EMAIL_HOST || '').trim(),
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
    user: String(process.env.SMTP_USER || process.env.EMAIL_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || process.env.EMAIL_PASS || ''),
    fromName: 'DIEA',
    fromAddress,
    replyTo: 'diea.acc.24@gmail.com',
    domain: String(process.env.MAIL_DOMAIN || fromAddress.split('@').pop() || '').trim().toLowerCase(),
  };
  const missing = Object.entries({
    SMTP_HOST: config.host,
    SMTP_USER: config.user,
    SMTP_PASS: config.pass,
    MAIL_FROM_ADDRESS: config.fromAddress,
    MAIL_REPLY_TO: config.replyTo,
    MAIL_DOMAIN: config.domain,
  }).filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    throw new Error(`Email configuration is incomplete: ${missing.join(', ')}`);
  }
  if (![465, 587].includes(config.port)) {
    throw new Error('SMTP_PORT must be 465 or 587.');
  }
  if (!EMAIL_PATTERN.test(config.fromAddress) || !EMAIL_PATTERN.test(config.replyTo)) {
    throw new Error('MAIL_FROM_ADDRESS and MAIL_REPLY_TO must be valid email addresses.');
  }
  if (config.fromAddress.split('@').pop() !== config.domain) {
    throw new Error('MAIL_FROM_ADDRESS must use the configured MAIL_DOMAIN.');
  }
  const isConsumerGmail = ['gmail.com', 'googlemail.com'].includes(config.domain);
  const gmailOptIn = String(process.env.ALLOW_CONSUMER_GMAIL || '').trim().toLowerCase() === 'true';
  if (isConsumerGmail && !gmailOptIn) {
    throw new Error('Use an authenticated business-domain sender, not a consumer Gmail address.');
  }

  return config;
};

const getTransporter = (config) => {
  const configKey = [config.host, config.port, config.user, config.pass].join('|');
  if (!transporter || configKey !== transporterConfigKey) {
    transporter?.close();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      pool: true,
      maxConnections: 2,
      maxMessages: 25,
      rateLimit: 50,
      rateDelta: 60 * 60 * 1000,
      auth: { user: config.user, pass: config.pass },
    });
    transporterConfigKey = configKey;
  }
  return transporter;
};

const formatMonth = (month) => {
  const match = String(month || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return String(month || 'the billing period');
  return new Date(Number(match[1]), Number(match[2]) - 1, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

const buildInvoiceEmailSubject = (invoice) => {
  const month = formatMonth(invoice.month);
  return `Demand Note for ${month} – Invoice ${invoice.invoiceNo}`;
};

const buildInvoiceEmail = (invoice) => {
  const config = getMailConfig();
  const invoiceNo = String(invoice.invoiceNo);
  const month = formatMonth(invoice.month);
  const subject = buildInvoiceEmailSubject(invoice);
  const paragraphs = [
    { text: 'Hello Sir,', html: '<strong>Hello Sir,</strong>' },
    { text: 'I hope you are doing well.' },
    {
      text: `Please find attached the Demand Note for ${month} (Invoice ${invoiceNo}) from DIEA.`,
      html: `Please find attached the Demand Note for ${escapeHtml(month)} (Invoice ${escapeHtml(invoiceNo)}) from DIEA.`,
    },
    {
      text: 'For any questions about the Demand Note, you can write to us at diea.acc.24@gmail.com. We will be happy to help.',
      html: 'For any questions about the Demand Note, you can write to us at <a href="mailto:diea.acc.24@gmail.com">diea.acc.24@gmail.com</a>. We will be happy to help.',
    },
    {
      text: 'Regards,\nDIEA\n+91 9901371386\ndiea.acc.24@gmail.com',
      html: 'Regards,<br>\nDIEA<br>\n+91 9901371386<br>\ndiea.acc.24@gmail.com',
    },
  ];
  const attribution = 'This Demand Note was prepared and sent through the DIEA accounts system, built by Excerpt Technologies Pvt Ltd (ERP, web and data solutions).';
  const text = `${paragraphs.map(({ text: paragraph }) => paragraph).join('\n\n')}\n\n---\n${attribution}`;
  const html = `${paragraphs.map(({ text: paragraph, html: htmlParagraph }) => `<p>${htmlParagraph || escapeHtml(paragraph)}</p>`).join('')}<hr><p style="font-size:12px;color:#666;">${escapeHtml(attribution)}</p>`;
  const monthParts = month.match(/^([A-Za-z]+)\s+(\d{4})$/);
  const monthForFilename = monthParts
    ? `${monthParts[1].slice(0, 3)}${monthParts[2]}`
    : month.replace(/[^A-Za-z0-9]+/g, '');

  return {
    subject,
    text,
    html,
    filename: `DIEA_Demand_Note_${monthForFilename}_${invoiceNo}.pdf`,
    config,
  };
};

const sendInvoiceEmail = async ({ to, subject, html, text, attachments = [], config: suppliedConfig }) => {
  const recipient = normalizeEmail(to);
  if (!EMAIL_PATTERN.test(recipient)) {
    throw new Error('A valid recipient email address is required.');
  }
  const config = suppliedConfig || getMailConfig();
  if (!Array.isArray(attachments) || attachments.length !== 1) {
    throw new Error('Invoice email must contain exactly one PDF attachment.');
  }
  const attachment = attachments[0];
  const content = Buffer.isBuffer(attachment.content)
    ? attachment.content
    : Buffer.from(attachment.content || '');
  if (content.length > MAX_ATTACHMENT_BYTES) {
    throw new Error('The PDF exceeds 2 MB. Regenerate it with a lower image quality and retry.');
  }
  if (content.length < 5 || content.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error('The invoice attachment is not a valid PDF.');
  }

  const info = await getTransporter(config).sendMail({
    from: { name: config.fromName, address: config.fromAddress },
    replyTo: config.replyTo,
    to: recipient,
    subject,
    text,
    html,
    date: new Date(),
    messageId: `<${randomUUID()}@${config.domain}>`,
    xMailer: false,
    attachments: [{
      filename: attachment.filename,
      content,
      contentType: 'application/pdf',
      contentDisposition: 'attachment',
    }],
  });
  const accepted = (info.accepted || []).map(normalizeEmail);
  const rejected = (info.rejected || []).map(normalizeEmail);
  if (rejected.includes(recipient) || !accepted.includes(recipient)) {
    throw new Error('The SMTP provider did not accept the recipient address.');
  }

  return {
    messageId: info.messageId,
    response: info.response || '',
    accepted: info.accepted || [],
    rejected: info.rejected || [],
  };
};

const verifyTransport = async () => {
  const config = getMailConfig();
  await getTransporter(config).verify();
  return true;
};

module.exports = {
  buildInvoiceEmail,
  buildInvoiceEmailSubject,
  getMailConfig,
  normalizeEmail,
  sendInvoiceEmail,
  verifyTransport,
};
