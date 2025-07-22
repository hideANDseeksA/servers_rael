const express = require('express');
const router = express.Router();
const { sendEmail } = require('../config/email'); // adjust path as needed

router.post('/send-notification', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required fields.' });
  }

  const subject = 'DepEd Registration Approval Notification';
  const text = `Dear ${name},

We are pleased to inform you that your registration has been formally approved.

If you have any questions or require further assistance, please do not hesitate to contact us.

Thank you for your interest and participation.

Sincerely,
Department of Education (DepEd) ICT Unit Team`;

  const html = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #fff; padding: 40px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 24px 0; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
          <img src="https://anlpvlzuvkhztupduebe.supabase.co/storage/v1/object/public/image/emailImage/466045489_8637936232910827_7378577773449258996_n.png" alt="DepEd Logo" style="height: 48px; display: block; margin: 0 auto;">
        </td>
      </tr>
      <tr>
        <td style="padding: 32px 40px 24px 40px;">
          <h2 style="margin-bottom: 16px; font-weight: 600; font-size: 22px; text-align: left;">Registration Approval Notification</h2>
          <p style="font-size: 15px; margin-bottom: 24px;">Dear <strong>${name}</strong>,</p>
          <p style="font-size: 15px; margin-bottom: 24px;">
            We are pleased to inform you that your registration has been <strong>formally approved</strong>.
          </p>
          <p style="font-size: 15px; margin-bottom: 24px;">
            If you have any questions or require further assistance, please do not hesitate to contact us.
          </p>
          <p style="font-size: 15px; margin-bottom: 0;">
            Thank you for your interest and participation.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; text-align: left;">
          <p style="margin: 0; font-size: 14px;"><strong>Sincerely,<br>Department of Education (DepEd) ICT Unit Team</strong></p>
        </td>
      </tr>
    </table>
  </div>
  `;

  try {
    await sendEmail(email, subject, text, html);
    res.status(200).json({ message: 'Email notification has been successfully sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while sending the email notification.' });
  }
});

module.exports = router;
