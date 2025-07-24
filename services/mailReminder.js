// api/services/mailReminder.js
import cron from 'node-cron';
import db from '../knex/connection.js'; // senin knex bağlantın
import { sendMail } from '../methods/utils/mailer.js';

cron.schedule('20 17 * * *', async () => {
  console.log('Cron job başladı - Mail gönderiliyor');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const reminders = await db('vaccination_plan as vp')
      .join('materials as m', 'vp.m_id', 'm.id')
      .join('users_animals as ua', 'vp.animal_id', 'ua.id')
      .join('users as u', 'ua.user_id', 'u.id')
      .select('vp.planned_date', 'm.name as vaccine_name', 'u.email as owner_email')
      .whereRaw('DATE(vp.planned_date) = ?', [tomorrowStr]);

    for (const r of reminders) {
      const mailText = `${r.planned_date.toISOString().split('T')[0]} tarihine ${r.vaccine_name} aşısı planlanmıştır.`;
      await sendMail({
        to: r.owner_email,
        subject: 'Aşı Hatırlatma',
        text: mailText,
      });
    }

    console.log(`${reminders.length} adet hatırlatma maili gönderildi.`);
  } catch (err) {
    console.error('Cron işinde hata:', err);
  }
});
