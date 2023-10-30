const { createTransport } = require("nodemailer");

// Create a Transporter to send email
const transporter = createTransport({
  host: process.env.MAIL_HOST,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendVerificationEmail({ to, subject, body }) {
  try {
    // Send email to user
    await transporter.sendMail({
      from: '"Meetmax" <adebayoluborode@gmail.com>',
      to,
      subject,
      html: body,
    });
  } catch (error) {
    console.error("Error occurred while sending email: ", error);
    throw error;
  }
}

module.exports = sendVerificationEmail;
