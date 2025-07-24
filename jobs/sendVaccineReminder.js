import cron from 'node-cron';
import nodemailer from 'nodemailer';
import db from '../knex/connection.js'; 
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// .env dosyasını yükle
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mail ayarları
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Her sabah 9'da çalışır
cron.schedule('15 18 * * *', async () => {
  try {
    const reminders = await db('vaccination_plan as vp')
      .join('materials as m', 'vp.m_id', 'm.id')
      .join('users_animals as ua', 'vp.animal_id', 'ua.id')
      .join('users as u', 'ua.user_id', 'u.id')
      .select('vp.planned_date', 'm.name as vaccine_name', 'u.email as owner_email')
      .where('vp.planned_date', '=', db.raw("CURRENT_DATE + INTERVAL 1 DAY"));

    for (const r of reminders) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: r.owner_email,
        subject: 'Aşı Hatırlatma',
        text: `${r.planned_date.toISOString().split('T')[0]} tarihine ${r.vaccine_name} aşısı planlanmıştır.`
      });
    }

    console.log(`${reminders.length} hatırlatma maili gönderildi.`);
  } catch (err) {
    console.error('Hatırlatma maili hatası:', err);
  }
});
