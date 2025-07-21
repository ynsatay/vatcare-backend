import { response } from "express";
import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';

function methodProcess(app) {
    app.post('/api/addMaterial', authenticateToken, async (req, res) => {
        try {
            const { name, price, quantity, unit, category, min_stock_level, barcode, supplier_name, description } = req.body;
            // if (!name || !quantity || !unit) { //Stok Alım Ekanı için kaldırıldı.
            //     return res.status(400).json({ error: 'Bütün alanları doldurunuz', status: 'error' });
            // }

            if (!name || !unit) {
                return res.status(400).json({ error: 'Bütün alanları doldurunuz', status: 'error' });
            }

            connection('materials').insert({
                name: name,
                price: price,
                quantity: 0,
                unit: unit,
                category: category,
                min_stock_level: min_stock_level,
                barcode: barcode,
                supplier_name: supplier_name,
                description: description
            }).then(() => {
                var response = {
                    status: 'success',
                    message: 'Kayıt işlemi tamamlandı.',
                }
                return res.status(200).json(response);
            }).catch(err => {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error', status: 'error' });
            });
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Server error', status: 'error' });
        }
    });

    app.get('/api/getMaterials', authenticateToken, async (req, res) => {
        try {
            const materials = await connection('materials').select('*');
            return res.status(200).json({
                status: 'success',
                data: materials
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error', status: 'error' });
        }
    });

    app.delete('/api/deleteMaterial/:id', authenticateToken, async (req, res) => {
        const id = req.params.id;
        try {
            const relatedProcesses = await connection('patient_process')
                .where({ process_id: id, row_type: 'M' })
                .select('id')
                .limit(1);

            if (relatedProcesses.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Bu malzeme, geliş dosyasında işlem olarak kullanıldığı için silinemez.'
                });
            }

            const deletedCount = await connection('materials').where('id', id).del();

            if (deletedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Malzeme bulunamadı' });
            }

            return res.status(200).json({ status: 'success', message: 'Malzeme başarıyla silindi' });
        } catch (error) {
            console.error('Malzeme silme hatası:', error);
            return res.status(500).json({ status: 'error', message: 'Sunucu hatası' });
        }
    });

    app.put('/api/updateMaterial/:id', authenticateToken, async (req, res) => {
        const id = req.params.id;
        const {
            name,
            price,
            //quantity,
            unit,
            category,
            min_stock_level,
            barcode,
            supplier_name,
            description
        } = req.body;

        // if (!name || quantity === undefined || unit === undefined) { //Stok Alım Ekanı için kaldırıldı.
        //     return res.status(400).json({ error: 'Zorunlu alanlar eksik', status: 'error' });
        // }

         if (!name || unit === undefined) {
            return res.status(400).json({ error: 'Zorunlu alanlar eksik', status: 'error' });
        }

        try {
            const updatedCount = await connection('materials')
                .where({ id })
                .update({
                    name,
                    price,
                    //quantity,
                    unit,
                    category,
                    min_stock_level,
                    barcode,
                    supplier_name,
                    description
                });

            if (updatedCount === 0) {
                return res.status(404).json({ status: 'error', message: 'Malzeme bulunamadı' });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Malzeme başarıyla güncellendi'
            });
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            return res.status(500).json({ status: 'error', message: 'Sunucu hatası' });
        }
    });

    //HIZMET APILERI

    app.post('/api/addService', authenticateToken, async (req, res) => {
        const { name, price, category, description } = req.body;

        if (!name) {
            return res.status(400).json({ status: 'error', error: 'Hizmet adı zorunludur' });
        }

        try {
            await connection('services').insert({
                name,
                price,
                category,
                description
            });

            return res.status(200).json({ status: 'success', message: 'Hizmet eklendi' });
        } catch (error) {
            console.error('Hizmet ekleme hatası:', error);
            return res.status(500).json({ status: 'error', error: 'Sunucu hatası' });
        }
    });


    app.get('/api/getServices', authenticateToken, async (req, res) => {
        try {
            const services = await connection('services').select('*');
            return res.status(200).json({ status: 'success', data: services });
        } catch (error) {
            console.error('Hizmetleri çekme hatası:', error);
            return res.status(500).json({ status: 'error', error: 'Sunucu hatası' });
        }
    });


    app.delete('/api/deleteService/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            // Önce patient_process tablosunda ilgili hizmet kullanımını kontrol et
            const relatedProcesses = await connection('patient_process')
                .where({ process_id: id, row_type: 'H' })
                .select('id')
                .limit(1);

            if (relatedProcesses.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Bu hizmet, geliş dosyasında işlem olarak kullanıldığı için silinemez.'
                });
            }

            const deleted = await connection('services').where({ id }).del();

            if (deleted === 0) {
                return res.status(404).json({ status: 'error', message: 'Hizmet bulunamadı' });
            }

            return res.status(200).json({ status: 'success', message: 'Hizmet silindi' });
        } catch (error) {
            console.error('Hizmet silme hatası:', error);
            return res.status(500).json({ status: 'error', message: 'Sunucu hatası' });
        }
    });



    app.put('/api/updateService/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { name, price, category, description } = req.body;

        if (!name) {
            return res.status(400).json({ status: 'error', error: 'Hizmet adı zorunludur' });
        }

        try {
            const updated = await connection('services').where({ id }).update({
                name,
                price,
                category,
                description
            });

            if (updated === 0) {
                return res.status(404).json({ status: 'error', message: 'Hizmet bulunamadı' });
            }

            return res.status(200).json({ status: 'success', message: 'Hizmet güncellendi' });
        } catch (error) {
            console.error('Hizmet güncelleme hatası:', error);
            return res.status(500).json({ status: 'error', message: 'Sunucu hatası' });
        }
    });

    //Aşı kullanımı
    app.get('/api/vaccine-usage-last-month', authenticateToken, async (req, res) => {
        try {
            const result = await connection('patient_process as pp')
                .join('materials as m', 'pp.process_id', 'm.id')
                .where('pp.row_type', 'M')
                .andWhere('m.category', 5) // Aşı kategorisi
                .andWhere('pp.ctime', '>=', connection.raw("DATE_SUB(NOW(), INTERVAL 30 DAY)"))
                .select('m.name')
                .sum('pp.count as usage_count')
                .groupBy('m.name')
                .orderBy('usage_count', 'desc');

            res.json(result);
        } catch (error) {
            console.error("Vaccine usage API error:", error);
            res.status(500).json({ message: 'Veri alınırken hata oluştu.', error });
        }
    });

    app.get('/api/simple-vaccine-usage', async (req, res) => {
        try {
            const result = await connection('patient_process as pp')
                .join('materials as m', 'pp.process_id', 'm.id')
                .where('pp.row_type', 'M')         // sadece stok kullanımı
                .andWhere('m.category', 5)         // aşı kategorisi
                .andWhere('pp.ctime', '>=', connection.raw('DATE_SUB(CURDATE(), INTERVAL 12 MONTH)'))
                .select([
                    connection.raw('MONTH(pp.ctime) as month'),
                    'm.name as vaccine_name'
                ])
                .sum('pp.count as usage')
                .groupBy('vaccine_name', 'month');

            res.json(result);
        } catch (err) {
            res.status(500).json({ error: "Veri alınamadı", details: err });
        }
    });




}

export default methodProcess;