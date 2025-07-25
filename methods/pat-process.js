import { response } from "express";
import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';
import logFeed from './utils/logFeed.js';
import { deleteFeedWithReference } from './utils/deleteFeed.js';

function methodPatProcess(app) {

    // 1️⃣ pa_id'ye göre tüm işlemleri çekme
    app.get('/api/patient-process/:pa_id', authenticateToken, async (req, res) => {
        try {
            const { pa_id } = req.params;

            const result = await connection('patient_process as pp')
                .leftJoin('materials as m', function () {
                    this.on('pp.process_id', '=', 'm.id').andOn('pp.row_type', '=', connection.raw('?', ['M']));
                })
                .leftJoin('services as s', function () {
                    this.on('pp.process_id', '=', 's.id').andOn('pp.row_type', '=', connection.raw('?', ['H']));
                })
                .where('pp.pa_id', pa_id)
                .select(
                    'pp.*',
                    connection.raw(`CASE WHEN pp.row_type = 'M' THEN m.name ELSE s.name END as process_name`),
                    connection.raw(`CASE WHEN pp.row_type = 'M' THEN pp.unit_prices ELSE 0 END as unit_price`)
                );

            res.json(result);
        } catch (error) {
            res.status(500).json({ message: 'Veri çekilirken hata oluştu', error });
        }
    });


    // 2️⃣ Malzeme veya hizmet ekleme
    app.post('/api/add-patient-process', authenticateToken, async (req, res) => {
        const trx = await connection.transaction();
        try {
            const { pa_id, process_id, row_type, count, total_prices, unit_prices, ptime, note } = req.body;

            if (!count || count <= 0) {
                await trx.rollback();
                return res.status(400).json({ message: 'Adet değeri geçersiz' });
            }

            let material = null;

            if (row_type === 'M') {
                material = await trx('materials')
                    .where({ id: process_id })
                    .first();

                if (!material) {
                    await trx.rollback();
                    return res.status(404).json({ message: 'Materyal bulunamadı' });
                }

                if (material.quantity < count) {
                    await trx.rollback();
                    return res.status(400).json({ message: 'Yetersiz stok miktarı', available: material.quantity });
                }
            }

            // Hasta süreci kaydı
            const [insertedId] = await trx('patient_process').insert({
                pa_id,
                process_id,
                row_type,
                count,
                total_prices,
                unit_prices,
                ptime,
                note
            });

            if (row_type === 'M') {
                // Stoktan düş
                await trx('materials')
                    .where({ id: process_id })
                    .decrement('quantity', count);

                // Stok hareketi kaydı
                await trx('material_movements').insert({
                    mi_id: null,
                    pp_id: insertedId,
                    m_id: process_id,
                    quantity: count,
                    price: unit_prices,
                    total_price: total_prices,
                    movement_date: new Date(),
                    inv_type: 3,
                    created_at: new Date()
                });
            }

            // Log için kullanıcı id'si al
            const patientArrival = await trx('patient_arrivals')
                .select('u_id')
                .where({ id: pa_id })
                .first();

            // İşlem adı
            const processData = await trx(row_type === 'M' ? 'materials' : 'services')
                .select('name')
                .where({ id: process_id })
                .first();

            const processName = processData ? processData.name : 'işlem';

            // Log feed
            await logFeed({
                user_id: patientArrival ? patientArrival.u_id : null,
                title: `Hastaya ${processName} işlemi eklendi`,
                icon: row_type === 'M' ? "bi bi-box" : "bi bi-gear",
                color: "info",
                feed_date: new Date(),
                reference_table: 'patient_process',
                reference_id: insertedId
            }, trx);

            await trx.commit();
            res.json({ id: insertedId, message: "İşlem başarıyla eklendi." });

        } catch (error) {
            await trx.rollback();
            console.error("API add-patient-process error:", error);
            res.status(500).json({ message: 'Ekleme sırasında hata oluştu', error });
        }
    });


    // 3️⃣ İşlem silme
    app.delete('/api/delete-patient-process/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const process = await connection('patient_process').where({ id }).first();

            if (!process) {
                return res.status(404).json({ message: 'Kayıt bulunamadı' });
            }

            if (process.is_paid) {
                return res.status(400).json({ message: 'Ödenmiş kayıt silinemez.' });
            }

            // Materyalse işlem
            if (process.row_type === 'M') {
                // Hareket kaydını bul
                const movement = await connection('material_movements')
                    .where({
                        pp_id: process.id,
                        inv_type: 3 // Tüketim
                    })
                    .first();

                if (movement) {
                    // Stok geri yükleniyor
                    await connection('materials')
                        .where({ id: process.process_id })
                        .increment('quantity', movement.quantity);

                    // Hareket kaydı siliniyor
                    await connection('material_movements')
                        .where({ id: movement.id })
                        .del();
                }
            }

            // Feed sil (jenerik)
            const feed = await connection('feeds')
                .where({ reference_table: 'patient_process', reference_id: id })
                .first();

            if (feed) {
                await deleteFeedWithReference(feed.id);
            }

            // Hasta süreci kaydını sil
            await connection('patient_process').where({ id }).del();

            res.json({ message: 'Kayıt ve ilişkili işlemler başarıyla silindi.' });
        } catch (error) {
            console.error("API delete-patient-process error:", error);
            res.status(500).json({ message: 'Silme sırasında hata oluştu', error });
        }
    });



    // 4️⃣ İşlem güncelleme
    app.put('/api/patient-process/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const process = await connection('patient_process').where({ id }).first();

            if (!process) {
                return res.status(404).json({ message: "Kayıt bulunamadı." });
            }

            if (process.is_paid) {
                return res.status(400).json({ message: "Ödenmiş kayıt güncellenemez." });
            }

            const { process_id, row_type, count, total_price, ptime, note } = req.body;

            const updated = await connection('patient_process').where({ id }).update({
                process_id,
                row_type,
                count,
                total_price,
                ptime,
                note
            });

            res.json({ message: "Güncelleme başarılı." });
        } catch (error) {
            res.status(500).json({ message: 'Güncelleme sırasında hata oluştu', error });
        }
    });

    //Geliş dosyasından animal_id getir
    app.get('/api/patient-arrival/:id/animal', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const result = await connection('patient_arrivals')
                .select('animal_id')
                .where({ id })
                .first();

            if (!result) {
                return res.status(404).json({ error: 'Geliş dosyası bulunamadı' });
            }

            res.json({ animal_id: result.animal_id });
        } catch (error) {
            console.error('Hayvan ID alınırken hata:', error);
            res.status(500).json({ error: 'Hayvan ID alınırken sunucu hatası' });
        }
    });

}

export default methodPatProcess;
