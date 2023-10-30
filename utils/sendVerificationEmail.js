const { createTransport } = require("nodemailer");

// Create a Transporter to send email
const transporter = createTransport({
  host: process.env.MAIL_HOST,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendVerificationEmail({ from, to, subject, body }) {
  try {
    // Send email to user
    await transporter.sendMail({
      from,
      to,
      subject,
      html: body,
      text: body,
    });
  } catch (error) {
    console.error("Error occurred while sending email: ", error);
    throw error;
  }
}

module.exports = sendVerificationEmail;
