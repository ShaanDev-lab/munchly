import nodemailer from "nodemailer"
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

export const sendOtpMail = async (to, otp) => {
  if (!process.env.EMAIL || !process.env.PASS) {
    console.log(`[DEV MODE] Email credentials not set. Password Reset OTP for ${to}: ${otp}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Reset Your Password",
    html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });
};

export const sendDeliveryOtpMail = async (user, otp) => {
  if (!process.env.EMAIL || !process.env.PASS) {
    console.log(`[DEV MODE] Email credentials not set. Delivery OTP for ${user.email}: ${otp}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: "Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });
};
