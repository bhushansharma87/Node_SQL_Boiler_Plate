const nodemailer = require("nodemailer");
const { getHtmlContent } = require("./htmlContent");

async function sendMail({ email, subject, htmlContent }) {
  const HOST = `${process.env.EMAIL_HOST || ""}`;
  const NO_REPLY_EMAIL = `${process.env.NO_REPLY_EMAIL || ""}`;
  const USER = `${process.env.ADMIN_EMAIL || ""}`;
  const PASSWORD = `${process.env.EMAIL_PASSWORD || ""}`;
  const PORT = `${process.env.EMAIL_PORT || 587}`;

  try {
    const transporter = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      //service: "gmail",
      secure: true,
      auth: {
        user: USER,
        pass: PASSWORD,
      },
    });

    const mailOptions = {
      from: NO_REPLY_EMAIL,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function forgotPasswordOtpVerifyMail({
  email,
  subject,
  text,
  verificationOTP,
}) {
  let replaceData = {
    text,
    verificationCode: verificationOTP,
  };

  const htmlContent = await getHtmlContent(
    "forgot_password_otp_verify",
    replaceData
  );
  await sendMail({ email, subject, htmlContent });
  return;
}

async function verifyEmailAfterSignup({
  email,
  subject,
  text,
  verificationOTP,
  link,
}) {
  let replaceData = {
    text,
    verificationCode: verificationOTP,
    link,
  };

  const htmlContent = await getHtmlContent("verify_signup_email", replaceData);
  await sendMail({ email, subject, htmlContent });
  return;
}



module.exports = {
  sendMail,
  forgotPasswordOtpVerifyMail,
  verifyEmailAfterSignup,
};
