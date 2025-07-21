import express from 'express';
import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';

function methodStockMovements(app) {
    // 1. Fatura oluştur
    app.post("/api/material-invoice/create", authenticateToken, async (req, res) => {
        try {
            const { inv_no, inv_date, inv_type, total_amount } = req.body;

            if (!inv_no || !inv_date || !inv_type || total_amount == null)
                return res.status(400).json({ message: "Eksik alanlar var." });

            if (![1, 2, 3].includes(Number(inv_type))) {
                return res.status(400).json({ message: "Geçersiz fatura tipi." });
            }

            const exists = await connection("material_invoice") //Fatura no kontrolü
                .where({ inv_no })
                .first();
            if (exists) {
                return res
                    .status(409)
                    .json({ message: "Bu fatura numarası zaten kullanılmış." });
            }

            const [id] = await connection("material_invoice").insert({
                inv_no,
                inv_date,
                inv_type,
                total_amount,
            });

            res.json({ success: true, id });
        } catch (err) {
            console.error("Fatura ekleme hatası:", err);
            res.status(500).json({ message: "Sunucu hatası" });
        }
    });


    // 2. Fatura hareketi ekle + stok güncelle
    app.post("/api/material-movement/add", authenticateToken, async (req, res) => {
        const trx = await connection.transaction();
        try {
            const {
                mi_id,
                m_id,
                quantity,
                price,
                total_price,
                movement_date,
                inv_type: invTypeRaw
            } = req.body;

            const inv_type = Number(invTypeRaw);
            if (!mi_id || !m_id || !quantity || price == null || !movement_date || ![1, 2, 3].includes(inv_type)) {
                return res.status(400).json({ message: "Eksik veya geçersiz alanlar var." });
            }

            // Eğer stok çıkışıysa, önce stoğu kontrol et
            if (inv_type !== 1) {
                const material = await trx("materials").where("id", m_id).first();
                if (!material) {
                    await trx.rollback();
                    return res.status(404).json({ message: "Malzeme bulunamadı" });
                }
                if (material.quantity < quantity) {
                    await trx.rollback();
                    return res.status(400).json({ message: "Depo bakiyesi eksiye düşecektir. İşleminiz iptal edildi." });
                }
            }

            // Hareket kaydını ekle
            await trx("material_movements").insert({
                mi_id,
                m_id,
                quantity,
                price,
                total_price,
                movement_date,
                inv_type
            });

            // Stok miktarını güncelle
            if (inv_type === 1) {
                await trx("materials").where("id", m_id).increment("quantity", quantity);
            } else {
                await trx("materials").where("id", m_id).decrement("quantity", quantity);
            }

            await trx.commit();
            res.json({ success: true });
        } catch (err) {
            await trx.rollback();
            console.error("Stok hareket hatası:", err);
            res.status(500).json({ message: "Sunucu hatası" });
        }
    });


    // 3. Fatura listesini getir
    app.get("/api/material-invoice/list", authenticateToken, async (req, res) => {
        try {
            const { inv_no, startDate, endDate } = req.query;

            let query = connection("material_invoice");

            if (inv_no) {
                // Fatura numarasına göre arama (like ile kısmi arama)
                query = query.where("inv_no", `${inv_no}`);
            } else if (startDate && endDate) {
                // Tarih aralığı filtreleme
                query = query.whereBetween("inv_date", [startDate, endDate]);
            }

            const invoices = await query.orderBy("inv_date", "desc").select("*");

            res.json(invoices);
        } catch (err) {
            console.error("Fatura listesi alınamadı:", err);
            res.status(500).json({ message: "Fatura listesi alınamadı" });
        }
    });


    // 4. Belirli faturanın hareketlerini getir
    app.get("/api/material-invoice/:id/movement-list", authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const movements = await connection("material_movements")
                .where("mi_id", id)
                .leftJoin("materials", "material_movements.m_id", "materials.id")
                .select(
                    "material_movements.*",
                    "materials.name as material_name",
                    "materials.unit"
                );

            res.json(movements);
        } catch (err) {
            res.status(500).json({ message: "Hareket listesi alınamadı" });
        }
    });

    // 5. Belirli faturanın tüm hareketlerini sil
    app.delete("/api/material-invoice/:id/movement-delete", authenticateToken, async (req, res) => {
        const trx = await connection.transaction();
        try {
            const { id } = req.params;

            // Hareketleri silmeden önce stok miktarını güncellemek gerekebilir
            // Örneğin, silinen hareketlere göre stokları geri almak

            // 1. Faturaya ait tüm hareketleri al
            const movements = await trx("material_movements").where("mi_id", id);

            // 2. Her hareket için stok güncelle (stokları eski haline getir)
            for (const m of movements) {
                if (m.inv_type === 1) {
                    // Alım faturasındaki hareket ise stoktan düş
                    await trx("materials").where("id", m.m_id).decrement("quantity", m.quantity);
                } else {
                    // İade veya Tüketim ise stok ekle
                    await trx("materials").where("id", m.m_id).increment("quantity", m.quantity);
                }
            }

            // 3. Hareketleri sil
            await trx("material_movements").where("mi_id", id).del();

            await trx.commit();
            res.json({ success: true });
        } catch (err) {
            await trx.rollback();
            console.error("Fatura hareketleri silme hatası:", err);
            res.status(500).json({ message: "Fatura hareketleri silinemedi" });
        }
    });

    app.post("/api/material-invoice/full-create", authenticateToken, async (req, res) => {
        const trx = await connection.transaction();

        try {
            const {
                inv_no,
                inv_date,
                inv_type,
                total_amount,
                movements // hareketler arrayi: [{ m_id, quantity, price, total_price, movement_date, ... }, ...]
            } = req.body;

            if (!inv_no || !inv_date || !inv_type || total_amount == null || !Array.isArray(movements)) {
                return res.status(400).json({ message: "Eksik veya geçersiz alanlar var." });
            }

            // Fatura numarası kontrolü
            const exists = await trx("material_invoice").where({ inv_no }).first();
            if (exists) {
                await trx.rollback();
                return res.status(409).json({ message: "Bu fatura numarası zaten kullanılmış." });
            }

            // Faturayı oluştur
            const [mi_id] = await connection("material_invoice").insert({
                inv_no,
                inv_date,
                inv_type,
                total_amount,
            });

            // Her hareket için stok kontrolü ve kayıt
            for (const mv of movements) {
                const { m_id, quantity, price, total_price, movement_date } = mv;

                if (!m_id || !quantity || price == null || !movement_date) {
                    await trx.rollback();
                    return res.status(400).json({ message: "Eksik hareket alanları." });
                }

                if (inv_type !== 1) { // stok çıkışıysa
                    const material = await trx("materials").where("id", m_id).first();
                    if (!material) {
                        await trx.rollback();
                        return res.status(404).json({ message: `Malzeme ${m_id} bulunamadı` });
                    }
                    if (material.quantity < quantity) {
                        await trx.rollback();
                        return res.status(400).json({ message: "Depo bakiyesi eksiye düşecektir. İşlem iptal edildi." });
                    }
                }

                await trx("material_movements").insert({
                    mi_id,
                    m_id,
                    quantity,
                    price,
                    total_price,
                    movement_date,
                    inv_type
                });

                if (inv_type === 1) {
                    await trx("materials").where("id", m_id).increment("quantity", quantity);
                } else {
                    await trx("materials").where("id", m_id).decrement("quantity", quantity);
                }
            }

            await trx.commit();
            res.json({ success: true, mi_id });
        } catch (err) {
            await trx.rollback();
            console.error(err);
            res.status(500).json({ message: "Sunucu hatası" });
        }
    });

}

export default methodStockMovements;
