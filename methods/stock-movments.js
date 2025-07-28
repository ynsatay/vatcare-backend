import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';

function methodStockMovements(app) {
    // 1. Fatura oluştur
    app.post("/api/material-invoice/create", authenticateToken, async (req, res) => {
        try {
            const off_id = req.user.off_id;
            const { inv_no, inv_date, inv_type, total_amount } = req.body;

            if (!inv_no || !inv_date || !inv_type || total_amount == null)
                return res.status(400).json({ message: "Eksik alanlar var." });

            if (![1, 2, 3].includes(Number(inv_type))) {
                return res.status(400).json({ message: "Geçersiz fatura tipi." });
            }

            const exists = await connection("material_invoice") //Fatura no kontrolü
                .where({ inv_no, off_id })
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
                off_id
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
            const off_id = req.user.off_id;
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
                await trx.rollback();
                return res.status(400).json({ message: "Eksik veya geçersiz alanlar var." });
            }

            // mi_id faturası off_id ile eşleşmeli
            const invoice = await trx("material_invoice").where({ id: mi_id, off_id }).first();
            if (!invoice) {
                await trx.rollback();
                return res.status(404).json({ message: "Fatura bulunamadı veya yetkiniz yok." });
            }

            // Stok giriş/çıkış kontrolü ve güncellemesi material_det tablosuna göre olacak
            const materialDet = await trx("material_det")
                .where({ off_id, m_id })
                .first();

            if (inv_type !== 1) {
                // stok çıkışıysa stok yeterlilik kontrolü
                if (!materialDet || materialDet.quantity < quantity) {
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
                inv_type,
                off_id
            });

            // Stok miktarını güncelle
            if (inv_type === 1) {
                // Stok artır
                if (materialDet) {
                    await trx("material_det").where({ id: materialDet.id }).increment("quantity", quantity);
                } else {
                    await trx("material_det").insert({
                        off_id,
                        m_id,
                        quantity,
                        tax_rate: 0,  // istersen değiştirilebilir
                        note: null
                    });
                }
            } else {
                // Stok azalt
                await trx("material_det").where({ id: materialDet.id }).decrement("quantity", quantity);
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
            const off_id = req.user.off_id;
            const { inv_no, startDate, endDate } = req.query;

            let query = connection("material_invoice").where('off_id', off_id);

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
            const off_id = req.user.off_id;
            const { id } = req.params;

            // Fatura off_id eşleşmeli
            const invoice = await connection("material_invoice").where({ id, off_id }).first();
            if (!invoice) {
                return res.status(404).json({ message: "Fatura bulunamadı veya yetkiniz yok." });
            }

            const movements = await connection("material_movements")
                .where("mi_id", id)
                .andWhere('off_id', off_id)
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
            const off_id = req.user.off_id;
            const { id } = req.params;

            // Fatura off_id eşleşmeli
            const invoice = await trx("material_invoice").where({ id, off_id }).first();
            if (!invoice) {
                await trx.rollback();
                return res.status(404).json({ message: "Fatura bulunamadı veya yetkiniz yok." });
            }

            // Hareketleri silmeden önce stok miktarını güncellemek gerekebilir
            // Örneğin, silinen hareketlere göre stokları geri almak

            // 1. Faturaya ait tüm hareketleri al
            const movements = await trx("material_movements").where({ mi_id: id, off_id: off_id });

            // 2. Her hareket için stok güncelle (stokları eski haline getir)
            for (const m of movements) {
                if (m.inv_type === 1) {
                    // Alım faturasındaki hareket ise stoktan düş
                    await trx("material_det")
                        .where({ m_id: m.m_id, off_id: m.off_id }) // off_id önemli!
                        .decrement("quantity", m.quantity);
                } else {
                    // İade veya Tüketim ise stok ekle
                    await trx("material_det")
                        .where({ m_id: m.m_id, off_id: m.off_id })
                        .increment("quantity", m.quantity);
                }
            }

            // 3. Hareketleri sil
            await trx("material_movements").where({ mi_id: id, off_id: off_id }).del();

            await trx.commit();
            res.json({ success: true });
        } catch (err) {
            await trx.rollback();
            console.error("Fatura hareketleri silme hatası:", err);
            res.status(500).json({ message: "Fatura hareketleri silinemedi" });
        }
    });

    // 6. Fatura ve hareketleri topluca oluştur
    app.post("/api/material-invoice/full-create", authenticateToken, async (req, res) => {
        const trx = await connection.transaction();

        try {
            const off_id = req.user.off_id;
            const {
                inv_no,
                inv_date,
                inv_type,
                total_amount,
                movements // hareketler arrayi: [{ m_id, quantity, price, total_price, movement_date, ... }, ...]
            } = req.body;

            if (!inv_no || !inv_date || !inv_type || total_amount == null || !Array.isArray(movements)) {
                await trx.rollback();
                return res.status(400).json({ message: "Eksik veya geçersiz alanlar var." });
            }

            // Fatura numarası kontrolü
            const exists = await trx("material_invoice").where({ inv_no, off_id }).first();
            if (exists) {
                await trx.rollback();
                return res.status(409).json({ message: "Bu fatura numarası zaten kullanılmış." });
            }

            // Faturayı oluştur
            const [mi_id] = await trx("material_invoice").insert({
                inv_no,
                inv_date,
                inv_type,
                total_amount,
                off_id
            });

            // Her hareket için stok kontrolü ve kayıt
            for (const mv of movements) {
                const { m_id, quantity, price, total_price, movement_date } = mv;

                if (!m_id || !quantity || price == null || !movement_date) {
                    await trx.rollback();
                    return res.status(400).json({ message: "Eksik hareket alanları." });
                }

                const materialDet = await trx("material_det")
                    .where({ off_id, m_id })
                    .first();

                if (inv_type !== 1) { // stok çıkışıysa
                    if (!materialDet) {
                        await trx.rollback();
                        return res.status(404).json({ message: `Malzeme ${m_id} bulunamadı` });
                    }
                    if (materialDet.quantity < quantity) {
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
                    inv_type,
                    off_id
                });

                if (inv_type === 1) {
                    if (materialDet) {
                        await trx("material_det").where({ id: materialDet.id }).increment("quantity", quantity);
                    } else {
                        await trx("material_det").insert({
                            off_id,
                            m_id,
                            quantity,
                            tax_rate: 0,
                            note: null
                        });
                    }
                } else {
                    await trx("material_det").where({ id: materialDet.id }).decrement("quantity", quantity);
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
