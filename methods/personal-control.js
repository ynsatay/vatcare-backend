import { response } from "express";
import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';

function MethodPersoneSearch(app) {
    // TC YE GORE KULLANICI SORGULAMA
    app.get('/api/getpersonelsearch', authenticateToken, (req, res) => {
        const off_id = req.user.off_id; // off_id'yi token'dan aldık
        const { tc } = req.query;

        if (!tc) {
            return res.status(400).json({ error: 'TC kimlik numarası gerekli', status: 'error' });
        }

        connection('users')
            .where('identity', tc)
            .andWhere('off_id', off_id) // off_id filtresi eklendi
            .first()
            .then(user => {
                if (!user) {
                    return res.status(404).json({ error: 'Kullanıcı bulunamadı', status: 'error' });
                }
                res.json({ status: 'success', user });
            })
            .catch(err => {
                console.error("DB error:", err);
                res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });

    app.get('/api/getanimalsearch', authenticateToken, async (req, res) => {
        const off_id = req.user.off_id;
        const { tc } = req.query;
        const IsAnimalId = req.query.IsAnimalId;

        if (!tc) {
            return res.status(400).json({ error: 'TC / Hayvan ID gerekli', status: 'error' });
        }

        try {
            const query = connection
                .select('users_animals.*')
                .select('users_animals.id as data_id')
                .select('animals.name as animal_name')
                .select('animals_species.species_name as species_name')
                .select('animals_species.id as species_id')
                .select(connection.raw('DATE_FORMAT(users_animals.birthdate, "%Y-%m-%d") as birthdate'))
                .select(connection.raw('DATE_FORMAT(users_animals.deathdate, "%Y-%m-%d") as deathdate'))
                .select('users.name as user_name')
                .from('users_animals')
                .join('animals', 'users_animals.animal_id', 'animals.id')
                .join('animals_species', 'users_animals.animal_species_id', 'animals_species.id')
                .join('users', 'users_animals.user_id', 'users.id')
                .where('users_animals.off_id', off_id); // off_id filtresi

            if (IsAnimalId == 1) {
                query.andWhere('users_animals.animalidentnumber', tc);
            } else {
                query.andWhere('users.identity', tc);
            }

            const data = await query;
            if (!data || data.length === 0) {
                return res.status(404).json({ error: 'Kayıt bulunamadı', status: 'error' });
            }

            return res.status(200).json({ status: 'success', data });

        } catch (err) {
            console.error("Veritabanı hatası:", err);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        }
    });


    app.get('/api/getpersonelsearchuid', authenticateToken, (req, res) => {
        const off_id = req.user.off_id;
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'User ID gerekli', status: 'error' });
        }

        connection('users')
            .where('id', user_id)
            .andWhere('off_id', off_id) // off_id filtresi
            .first()
            .then(user => {
                if (!user) {
                    return res.status(404).json({ error: 'Kullanıcı bulunamadı', status: 'error' });
                }
                res.json({ status: 'success', user });
            })
            .catch(err => {
                console.error("DB error:", err);
                res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });


    app.get('/api/getappointmentAnimal', authenticateToken, (req, res) => {
        const off_id = req.user.off_id;
        const { tc } = req.query;

        if (!tc) {
            return res.status(400).json({ error: 'TC kimlik numarası gerekli', status: 'error' });
        }

        connection('appointment_process')
            .join('users_animals', 'users_animals.id', 'appointment_process.user_animal_id')
            .join('users', 'users.id', 'users_animals.user_id')
            .select(
                'appointment_process.*',
                'users.name as user_name',
                'users.id as user_id',
                'users_animals.animalname as animal_name',
                'users_animals.animalidentnumber'
            )
            .where('users_animals.animalidentnumber', tc)
            .andWhere('appointment_process.off_id', off_id) // off_id filtresi
            .then((appointments) => {
                if (appointments.length === 0) {
                    return res.status(404).json({ error: 'Randevu bulunamadı', status: 'error' });
                }
                return res.status(200).json({ status: 'success', data: appointments });
            })
            .catch(err => {
                console.error("DB error:", err);
                return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });


    app.post('/api/AddPatientfile', authenticateToken, (req, res) => {
        try {
            const off_id = req.user.off_id;

            const {
                u_id, animal_id, vet_u_id, type,
                status, notes, is_discharge, arrival_reason, diagnosis,
                treatment_plan
            } = req.body;

            connection('patient_arrivals').insert({
                u_id: u_id,
                animal_id: animal_id,
                vet_u_id: vet_u_id,
                type: type,
                status: status,
                notes: notes,
                is_discharge: is_discharge,
                arrival_reason: arrival_reason,
                diagnosis: diagnosis,
                treatment_plan: treatment_plan,
                off_id // off_id eklendi
            }).then((result) => {
                const insertedId = result[0];
                var response = {
                    status: 'success',
                    message: 'Kayıt işlemi tamamlandı.',
                    patFileId: insertedId,
                }
                return res.status(200).json(response);
            }).catch(err => {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error', status: 'error' });
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        }

    });

    app.get('/api/getPatientFileInfo', authenticateToken, (req, res) => {
        const off_id = req.user.off_id;
        const { patFileId } = req.query;

        connection('patient_arrivals')
            .join('users as patient', 'patient.id', 'patient_arrivals.u_id')
            .join('users as vet', 'vet.id', 'patient_arrivals.vet_u_id')
            .join('users_animals as animal', 'animal.id', 'patient_arrivals.animal_id')
            .select(
                'patient_arrivals.*',
                'patient.name as patient_name',
                'patient.surname as patient_surname',
                'vet.name as vet_name',
                'vet.surname as vet_surname',
                'animal.animalname AS animal_name'
            )
            .where('patient_arrivals.id', parseInt(patFileId))
            .andWhere('patient_arrivals.off_id', off_id) // off_id filtresi
            .then((patFileInfo) => {
                if (patFileInfo.length === 0) {
                    return res.status(404).json({ error: 'Geliş Dosyası Bulunamadı.', status: 'error' });
                }
                return res.status(200).json({ status: 'success', data: patFileInfo });
            })
            .catch(err => {
                console.error("DB error:", err);
                return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });

    app.get('/api/arrivals', authenticateToken, (req, res) => {
        const off_id = req.user.off_id;
        const { animalId } = req.query;
        if (isNaN(animalId)) {
            return res.status(400).json({ error: 'Geçersiz animal_id parametresi.', status: 'error' });
        }

        connection('patient_arrivals')
            .select('*')
            .where('animal_id', animalId)
            .andWhere('off_id', off_id) // off_id filtresi
            .orderBy('id', 'desc')
            .then(arrivals => {
                if (!arrivals.length) {
                    return res.status(404).json({ error: 'Geliş bulunamadı.', status: 'error' });
                }
                return res.status(200).json({ status: 'success', data: arrivals });
            })
            .catch(err => {
                console.error('DB error:', err);
                return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });

    app.put('/api/patient-arrival/:id/discharge', authenticateToken, async (req, res) => {
        const arrivalId = req.params.id;

        try {
            // 1. Geliş kaydını al
            const arrival = await connection('patient_arrivals').where({ id: arrivalId }).first();

            if (!arrival) {
                return res.status(404).json({ message: "Geliş kaydı bulunamadı." });
            }

            const paId = arrival.id;

            // 2. patient_process tablosundan toplam işlem tutarını al
            const processSumRow = await connection('patient_process')
                .where({ pa_id: paId })
                .sum({ total: 'total_prices' })
                .first();

            const totalProcess = parseFloat(processSumRow.total || 0);

            // 3. patient_revenues tablosundan toplam tahsilatı al
            const revenueSumRow = await connection('patient_revenues')
                .where({ pa_id: paId, is_refund: false })
                .sum({ total: 'amount' })
                .first();

            const totalRevenue = parseFloat(revenueSumRow.total || 0);

            const remaining = totalProcess - totalRevenue;

            // 4. Borç kontrolü
            if (remaining > 0.01) {
                return res.status(400).json({
                    message: `Hastanın ${remaining.toFixed(2)} ₺ borcu bulunmaktadır. Çıkış yapılamaz.`
                });
            }

            // 5. Çıkışı tamamla
            await connection('patient_arrivals')
                .where({ id: arrivalId })
                .update({
                    is_discharge: true,
                    discharge_time: new Date()
                });

            res.json({ message: "Çıkış başarıyla yapıldı." });

        } catch (err) {
            console.error("Çıkış hatası:", err);
            res.status(500).json({ message: "Çıkış sırasında sunucu hatası oluştu." });
        }
    });

    app.put('/api/patient-arrival/:id/undo-discharge', authenticateToken, async (req, res) => {
        try {
            await connection("patient_arrivals")
                .where("id", req.params.id)
                .update({
                    is_discharge: false,
                    discharge_time: null
                });
            res.json({ message: "Çıkış iptal edildi." });
        } catch (err) {
            res.status(500).json({ message: "Çıkış iptali yapılamadı." });
        }
    });
}

export default MethodPersoneSearch;
