import connection from "../knex/connection.js";
import authenticateToken from "./Middleware/index.js";
import logFeed from './utils/logFeed.js';
import { deleteFeedWithReference } from './utils/deleteFeed.js';

function methodappointment(app) {
    app.post('/api/addappointment', authenticateToken, async (req, res) => {
        try {
            const off_id = req.user.off_id;

            let { user_animal_id, process_date, start_time, end_time, notes, status, app_type } = req.body;

            if (!user_animal_id || !process_date || !start_time || !end_time) {
                return res.status(400).json({ error: 'Zorunlu alanları doldurunuz', status: 'error' });
            }

            // Tarihleri MySQL formatına çevir
            const formatDateTime = (dateTimeStr) =>
                new Date(dateTimeStr).toISOString().slice(0, 19).replace("T", " ");

            process_date = formatDateTime(process_date);
            start_time = formatDateTime(start_time);
            end_time = formatDateTime(end_time);

            // Randevu ekle
            const [insertedId] = await connection('appointment_process').insert({
                user_animal_id,
                process_date,
                start_time,
                end_time,
                notes: notes || null,
                status: status || 0,
                app_type: app_type || 0,
                off_id, 
            });

            const userAnimal = await connection('users_animals')
                .select('user_id')
                .where({ id: user_animal_id })
                .first();

            await logFeed({
                user_id: userAnimal ? userAnimal.user_id : null,
                title: `Yeni randevu eklendi.`,
                icon: "bi bi-calendar-plus",
                color: "success",
                feed_date: new Date(),
                reference_table: 'appointment_process',
                reference_id: insertedId,
                off_id, 
            });

            res.status(200).json({ status: 'success', message: 'Randevu başarıyla eklendi.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Sunucu hatası', status: 'error', err });
        }
    });

    app.get('/api/getuseranimal', authenticateToken, (req, res) => {
        const off_id = req.user.off_id;

        connection('users_animals')
            .join('users', 'users.id', 'users_animals.user_id')
            .select('users_animals.*', 'users.name')
            .where('users_animals.off_id', off_id) 
            .then((animals) => {
                if (animals.length === 0) {
                    return res.status(404).json({ error: 'Hayvan bulunamadı', status: 'error' });
                }
                return res.status(200).json({ status: 'success', data: animals });
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });

    app.get('/api/getappointment', authenticateToken, (req, res) => {
        const off_id = req.user.off_id;

        connection('appointment_process')
            .join('users_animals', 'users_animals.id', 'appointment_process.user_animal_id')
            .join('users', 'users.id', 'users_animals.user_id')
            .select(
                'appointment_process.*',
                'users.name as user_name',
                'users.id as user_id',
                'users_animals.animalname as animal_name'
            )
            .where('appointment_process.off_id', off_id) 
            .orderBy('appointment_process.start_time', 'desc')
            .then((appointments) => {
                if (appointments.length === 0) {
                    return res.status(404).json({ error: 'Randevu bulunamadı', status: 'error' });
                }
                return res.status(200).json({ status: 'success', data: appointments });
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });

    app.post('/api/updateappointment', authenticateToken, (req, res) => {
        const off_id = req.user.off_id;
        const { id, start_time, end_time, status } = req.body;

        if (!id || !start_time || !end_time) {
            return res.status(400).json({ error: 'Zorunlu alanları doldurunuz', status: 'error' });
        }

        connection('appointment_process')
            .where({ id, off_id }) 
            .update({
                start_time,
                end_time,
                status
            })
            .then(() => {
                return res.status(200).json({ status: 'success', message: 'Randevu başarıyla güncellendi.' });
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });

    app.delete('/api/deleteappointment/:id', authenticateToken, async (req, res) => {
        const off_id = req.user.off_id;
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Randevu ID gerekli', status: 'error' });
        }

        try {
            const feed = await connection('feeds')
                .where({ reference_table: 'appointment_process', reference_id: id, off_id }) 
                .first();

            if (feed) {
                await deleteFeedWithReference(feed.id); 
            } else {
                const deletedCount = await connection('appointment_process')
                    .where({ id, off_id }) 
                    .del();

                if (deletedCount === 0) {
                    return res.status(404).json({ error: 'Randevu bulunamadı', status: 'error' });
                }
            }

            res.status(200).json({ status: 'success', message: 'Randevu başarıyla silindi.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        }
    });
}

export default methodappointment;
