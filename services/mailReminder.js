import cron from 'node-cron';
import db from '../knex/connection.js';
import { sendMail } from '../methods/utils/mailer.js';

cron.schedule('00 8 * * *', async () => {
 // console.log('Cron job başladı - Mail gönderiliyor');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const reminders = await db('vaccination_plan as vp')
      .join('materials as m', 'vp.m_id', 'm.id')
      .join('users_animals as ua', 'vp.animal_id', 'ua.id')
      .join('users as u', 'ua.user_id', 'u.id')
      .join('hr_offices as ho', 'vp.off_id', 'ho.id')
      .join('clinic as c', 'ho.clinic_id', 'c.id')
      .select(
        'vp.planned_date',
        'm.name as vaccine_name',
        'u.email as owner_email',
        'c.name as clinic_name',
        'u.name as owner_name'
      )
      .whereRaw('DATE(vp.planned_date) = ?', [tomorrowStr]);

    for (const r of reminders) {
      const plannedDateFormatted = new Date(r.planned_date).toLocaleDateString('tr-TR');
      
      const mailHtml = `
        <h2>Aşı Hatırlatma - ${r.clinic_name}</h2>
        <p>Merhaba ${r.owner_name},</p>
        <p>${plannedDateFormatted} tarihinde, <strong>${r.vaccine_name}</strong> aşısı planlanmıştır.</p>
        <p>Lütfen gerekli hazırlıkları yapmayı unutmayınız.</p>
        <br/>
        <p>İyi günler dileriz,<br/>${r.clinic_name} Yönetimi</p>
      `;

      const mailText = `
        Aşı Hatırlatma - ${r.clinic_name}

        Merhaba ${r.owner_name},

        ${plannedDateFormatted} tarihinde, ${r.vaccine_name} aşısı planlanmıştır.

        Lütfen gerekli hazırlıkları yapmayı unutmayınız.

        İyi günler dileriz,
        ${r.clinic_name} Yönetimi
      `;

      await sendMail({
        to: r.owner_email,
        subject: `${r.clinic_name} - Aşı Hatırlatma`,
        text: mailText,
        html: mailHtml,
      });
    }

  //  console.log(`${reminders.length} adet hatırlatma maili gönderildi.`);
  } catch (err) {
    console.error('Cron işinde hata:', err);
  }
});
