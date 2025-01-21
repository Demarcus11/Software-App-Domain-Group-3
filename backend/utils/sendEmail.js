import nodemailer from "nodemailer";

const asyncSendEmail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const result = await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to,
    subject,
    text,
  });

  console.log(JSON.stringify(result, null, 4));
};

export default asyncSendEmail;
