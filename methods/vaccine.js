import { response } from "express";
import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';

function methodVaccine(app) {
    //1. Planlanan aşıların Ay'a göre listelenmesi
    app.get('/api/vaccine/calendarEvents', authenticateToken, async (req, res) => {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Başlangıç ve bitiş tarihleri gereklidir.' });
        }

        try {
            const plans = await connection('vaccination_plan as vp')
                .join('materials as m', 'vp.m_id', 'm.id')
                .join('users_animals as ua', 'vp.animal_id', 'ua.id')
                .select(
                    'vp.id',
                    connection.raw(`CASE WHEN vp.is_applied = 0 THEN vp.planned_date ELSE vp.applied_on END as date`),
                    'vp.is_applied',
                    'vp.animal_id',
                    'm.name as vaccine_name',
                    'ua.animalname as animal_name'
                )
                .where(function () {
                    this.whereBetween('vp.planned_date', [startDate, endDate])
                        .orWhereBetween('vp.applied_on', [startDate, endDate]);
                });

            res.json(plans);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Aşı takvimi getirilirken hata oluştu.' });
        }
    });

    //2. Hayvana ait uygulanmaya aşı planları 
    app.get('/api/vaccine/plans/unapplied/:animalId', authenticateToken, async (req, res) => {
        const { animalId } = req.params;

        try {
            const planned = await connection('vaccination_plan as vp')
                .join('materials as m', 'vp.m_id', 'm.id')
                .select(
                    'vp.id',
                    connection.raw("DATE_FORMAT(vp.planned_date, '%Y-%m-%d') as planned_date"),
                    'vp.notes',
                    'vp.animal_id',
                    'm.name as vaccine_name',
                    'vp.m_id'
                )
                .where({ 'vp.animal_id': animalId, 'vp.is_applied': false })
                .orderBy('vp.planned_date', 'asc');

            res.json(planned);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Planlanan aşılar getirilirken hata oluştu.' });
        }
    });

    //3. Hayvana ait uygulanan aşı planları 
    app.get('/api/vaccine/plans/applied/:animalId', authenticateToken, async (req, res) => {
        const { animalId } = req.params;

        try {
            const applied = await connection('vaccination_plan as vp')
                .join('materials as m', 'vp.m_id', 'm.id')
                .select(
                    'vp.id',
                    'vp.planned_date',
                    'vp.applied_on',
                    'vp.notes',
                    'vp.animal_id',
                    'm.name as vaccine_name'
                )
                .where({ 'vp.animal_id': animalId, 'vp.is_applied': true })
                .orderBy('vp.applied_on', 'desc');

            res.json(applied);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Uygulanan aşılar getirilirken hata oluştu.' });
        }
    });

    //4. hayvana aşı planı oluşturma
    app.post('/api/vaccine/plan-multiple', authenticateToken, async (req, res) => {
        const { animal_id, m_id, planned_date, repeat_interval_months, repeat_count, notes, created_by } = req.body;

        if (!animal_id || !m_id || !planned_date || !repeat_interval_months || !repeat_count) {
            return res.status(400).json({ error: "Eksik parametreler" });
        }

        try {
            const plans = [];

            for (let i = 0; i < repeat_count; i++) {
                const date = new Date(planned_date);
                date.setMonth(date.getMonth() + i * repeat_interval_months);
                const plannedDateStr = date.toISOString().split("T")[0];

                plans.push({
                    animal_id,
                    m_id,
                    planned_date: plannedDateStr,
                    is_applied: false,
                    applied_on: null,
                    notes,
                    created_by,
                    created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
                });
            }

            const inserted = await connection('vaccination_plan').insert(plans);

            const firstId = inserted[0];
            const insertedIds = plans.map((_, i) => firstId + i);

            res.json({
                message: `${insertedIds.length} aşı planı başarıyla oluşturuldu.`,
                inserted_ids: insertedIds
            });
        } catch (err) {
            console.error("Hızlı aşı planlama hatası:", err);
            res.status(500).json({ error: "Sunucu hatası", err });
        }
    });

    //5. aşı planı güncelleme
    app.put('/api/vaccine/plan/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { planned_date, notes } = req.body;

        try {
            const plan = await connection('vaccination_plan').where({ id }).first();

            if (!plan) {
                return res.status(404).json({ error: 'Plan kaydı bulunamadı' });
            }

            if (plan.is_applied) {
                return res.status(400).json({ error: 'Uygulanan plan güncellenemez' });
            }

            await connection('vaccination_plan')
                .where({ id })
                .update({
                    planned_date,
                    notes
                });

            res.json({ message: 'Plan kaydı güncellendi' });
        } catch (err) {
            console.error("Güncelleme hatası:", err);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });

    //6. Aşı planını silme
    app.delete('/api/vaccine/plan/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const plan = await connection('vaccination_plan').where({ id }).first();

            if (!plan) {
                return res.status(404).json({ error: 'Plan kaydı bulunamadı' });
            }

            if (plan.is_applied) {
                return res.status(400).json({ error: 'Uygulanan plan silinemez' });
            }

            await connection('vaccination_plan').where({ id }).delete();

            res.json({ message: 'Plan kaydı silindi' });
        } catch (err) {
            console.error("Silme hatası:", err);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });


    //6. Seçilen aşı planının detayını getirme
    app.get('/api/vaccine/plan/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const plan = await connection('vaccination_plan as vp')
                .join('materials as m', 'vp.m_id', 'm.id')
                .join('users_animals as ua', 'vp.animal_id', 'ua.id')
                .join('users as u', 'ua.user_id', 'u.id')
                .select(
                    'vp.id',
                    'vp.planned_date',
                    'vp.notes',
                    'vp.is_applied',
                    'vp.animal_id',
                    'm.name as vaccine_name',
                    'ua.animalname as animal_name',
                    connection.raw("CONCAT(u.name, ' ', u.surname) as owner_name")
                )
                .where('vp.id', id)
                .first();

            if (!plan) {
                return res.status(404).json({ error: 'Aşı planı bulunamadı.' });
            }

            res.json(plan);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Aşı planı getirilirken hata oluştu.' });
        }
    });

    //7. Aşı planının uygulanması
    app.put('/api/vaccine/plan/:id/apply', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { pp_id } = req.body;

        try {
            const updated = await connection('vaccination_plan')
                .where({ id })
                .update({
                    is_applied: true,
                    applied_on: new Date(),
                    pp_id: pp_id || null
                });

            if (updated) {
                res.json({ message: 'Aşı uygulandı olarak işaretlendi.' });
            } else {
                res.status(404).json({ error: 'Plan kaydı bulunamadı.' });
            }
        } catch (err) {
            console.error("Güncelleme hatası:", err);
            res.status(500).json({ error: 'Plan güncellenirken hata oluştu.' });
        }
    });

    //EKSTRA - Aşıları getirir.
    app.get('/api/vaccine/materials', authenticateToken, async (req, res) => {
        try {
            const materials = await connection('materials').select('*').whereRaw("category = 5");
            return res.status(200).json({
                status: 'success',
                data: materials
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error', status: 'error' });
        }
    });


}

export default methodVaccine;
