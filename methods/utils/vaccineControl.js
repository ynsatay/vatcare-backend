// vaccineControl.js
import connection from "../../knex/connection.js";
import cron from 'node-cron';

async function markOverdueVaccines() {
  try {
    const today = new Date();

    const updated = await connection('vaccination_plan')
      .where('is_applied', 0) // Planlandı
      .andWhere('planned_date', '<', today)
      .update({
        is_applied: 2 // Gecikti
      });

    console.log(`[AŞI] Geciken aşı sayısı: ${updated}`);
  } catch (err) {
    console.error('[AŞI] Gecikme kontrol hatası:', err);
  }
}

/**
 * CRON
 * Her gün 00:05'te çalışır
 */
cron.schedule('5 0 * * *', async () => {
  console.log('[AŞI] Gecikme kontrolü çalıştı');
  await markOverdueVaccines();
});

export default markOverdueVaccines;
