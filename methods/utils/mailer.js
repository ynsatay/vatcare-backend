import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendMail({ to, subject, text }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Mail gönderildi: ${info.response} - Alıcı: ${to}`);
    return info;
  } catch (error) {
    console.error(`Mail gönderme hatası (alıcı: ${to}):`, error);
    throw error;
  }
}