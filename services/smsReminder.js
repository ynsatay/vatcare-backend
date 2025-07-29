// api/services/smsReminder.js
// import cron from 'node-cron';
// import db from '../knex/connection.js';
// import { sendSMS } from '../methods/utils/smsSender.js';

// cron.schedule('0 10 * * *', async () => {
//   console.log('Cron job başladı - SMS gönderiliyor');

//   try {
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     const tomorrowStr = tomorrow.toISOString().split('T')[0];

//     const reminders = await db('vaccination_plan as vp')
//       .join('materials as m', 'vp.m_id', 'm.id')
//       .join('users_animals as ua', 'vp.animal_id', 'ua.id')
//       .join('users as u', 'ua.user_id', 'u.id')
//       .select('vp.planned_date', 'm.name as vaccine_name', 'u.phone as owner_phone')
//       .whereRaw('DATE(vp.planned_date) = ?', [tomorrowStr]);

//     for (const r of reminders) {
//       const msg = `${r.planned_date.toISOString().split('T')[0]} tarihinde ${r.vaccine_name} aşısı uygulanacaktır. VetCare`;
//       await sendSMS({
//         to: r.owner_phone,
//         message: msg,
//       });
//     }

//     console.log(`${reminders.length} adet hatırlatma SMS'i gönderildi.`);
//   } catch (err) {
//     console.error('Cron işinde hata:', err);
//   }
// });
