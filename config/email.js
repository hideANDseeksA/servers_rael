const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email with optional attachments
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @param {Array} attachments - Optional array of attachment objects
 * 
 */
const sendEmail = async (to, subject, text, html, attachments = []) => {
  const mailOptions = {
    from: `Easy Docs <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments, // ← Attach files here
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

module.exports = { sendEmail };
