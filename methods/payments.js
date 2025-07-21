import connection from "../knex/connection.js";
import authenticateToken from "./Middleware/index.js";
import logFeed from './utils/logFeed.js';
import { deleteFeedWithReference } from './utils/deleteFeed.js';

function methodPayment(app) {

    app.get("/api/unpaid-processes", authenticateToken, async (req, res) => {
        try {
            const { pa_id } = req.query;
            if (!pa_id) return res.status(400).json({ message: "pa_id zorunludur" });

            const results = await connection('patient_process as pp')
                // Henüz tahsil edilmemişleri filtrele
                .where('pp.pa_id', pa_id)
                .whereNotIn('pp.id', function () {
                    this.select('pp_id').from('patient_revenue_det');
                })
                // İşlem detaylarını materials ve services tablosundan al
                .leftJoin('materials as m', function () {
                    this.on('pp.process_id', '=', 'm.id').andOn('pp.row_type', '=', connection.raw('?', ['M']));
                })
                .leftJoin('services as s', function () {
                    this.on('pp.process_id', '=', 's.id').andOn('pp.row_type', '=', connection.raw('?', ['H']));
                })
                // Seçilecek alanlar
                .select(
                    'pp.*',
                    connection.raw(`CASE WHEN pp.row_type = 'M' THEN m.name ELSE s.name END as process_name`),
                    connection.raw(`CASE WHEN pp.row_type = 'M' THEN pp.unit_prices ELSE 0 END as unit_price`)
                );

            res.json(results);
        } catch (error) {
            console.error("Unpaid processes error:", error);
            res.status(500).json({ message: "İşlemler alınamadı", error });
        }
    });


    // Tahsilat ekleme
    app.post("/api/add-payment", authenticateToken, async (req, res) => {
        try {
            const { pa_id, vet_u_id, type, is_refund = false, details } = req.body;

            if (!pa_id || !vet_u_id || !type || !Array.isArray(details) || details.length === 0) {
                return res.status(400).json({ message: "Eksik veya hatalı veri" });
            }

            const totalAmount = details.reduce((sum, d) => sum + Number(d.amount), 0);

            const [paymentId] = await connection("patient_revenues").insert({
                pa_id,
                vet_u_id,
                type,
                is_refund,
                ctime: new Date(),
                ptime: new Date(),
                amount: totalAmount,
            });

            // 2. Detay kayıtlarını ekle (her detay için)
            const detailRows = details.map(({ pp_id, amount }) => ({
                revenue_id: paymentId,
                pp_id,
                amount,
            }));

            await connection("patient_revenue_det").insert(detailRows);

            await connection('patient_process')
                .whereIn('id', details.map(d => d.pp_id))
                .update({ is_paid: true });

            const patientArrival = await connection('patient_arrivals')
                .select('u_id')
                .where({ id: pa_id })
                .first();

            await logFeed({
                user_id: patientArrival ? patientArrival.u_id : null,
                title: `Tahsilat yapıldı. (${totalAmount} ₺)`,
                icon: "bi bi-cash-coin",
                color: "success",
                feed_date: new Date(),
                reference_table: 'patient_revenues',
                reference_id: paymentId
            });

            // İstersen burada, tahsil edilen işlemlerin patient_process tablosunda durum güncellemesi yapılabilir

            res.json({ message: "Tahsilat başarıyla eklendi", paymentId });
        } catch (error) {
            console.error("API add-payment error:", error);
            res.status(500).json({ message: "Tahsilat eklenirken hata oluştu", error });
        }
    });

    // Tahsilat listesi (master ve detayları getir)
    app.get("/api/payments/:pa_id", authenticateToken, async (req, res) => {
        try {
            const { pa_id } = req.params;
            if (!pa_id) return res.status(400).json({ message: "pa_id zorunludur" });

            // 1. Master tahsilat kayıtları
            const payments = await connection("patient_revenues as pr")
                .select(
                    "pr.*",
                    "pr.amount as total_prices")

                .where("pr.pa_id", pa_id)
                .orderBy("pr.ctime", "desc");

            if (!payments.length) return res.json([]);

            const pr_ids = payments.map(p => p.id);

            // 2. Tüm detayları al + patient_process bilgileri
            const baseDetails = await connection("patient_revenue_det as det")
                .whereIn("det.revenue_id", pr_ids)
                .leftJoin("patient_process as pp", "det.pp_id", "pp.id")
                .select(
                    "det.*",
                    "pp.process_id",
                    "pp.row_type",
                    "pp.count",
                    "pp.total_prices"
                );

            // 3. pp_id => process_id ve row_type map’ini kur
            const serviceIds = [];
            const stockIds = [];

            for (const d of baseDetails) {
                if (d.row_type === "H") serviceIds.push(d.process_id);
                else if (d.row_type === "M") stockIds.push(d.process_id);
            }

            // 4. Hizmet ve malzeme adlarını al
            const serviceMap = {};
            const stockMap = {};

            if (serviceIds.length) {
                const services = await connection("services").whereIn("id", serviceIds);
                services.forEach(s => {
                    serviceMap[s.id] = s.name;
                });
            }

            if (stockIds.length) {
                const stocks = await connection("materials").whereIn("id", stockIds);
                stocks.forEach(s => {
                    stockMap[s.id] = s.name;
                });
            }

            // 5. İsimleri detaylara ekle
            const detailsWithNames = baseDetails.map(d => ({
                ...d,
                process_name:
                    d.row_type === "H"
                        ? serviceMap[d.process_id] || "Hizmet (silinmiş)"
                        : stockMap[d.process_id] || "Malzeme (silinmiş)"
            }));

            // 6. Detayları gruplandır
            const groupedDetails = {};
            for (const detail of detailsWithNames) {
                if (!groupedDetails[detail.revenue_id]) groupedDetails[detail.revenue_id] = [];
                groupedDetails[detail.revenue_id].push(detail);
            }

            // 7. Master'a detayları bağla
            const result = payments.map(payment => ({
                ...payment,
                details: groupedDetails[payment.id] || []
            }));

            res.json(result);
        } catch (error) {
            console.error("API get-payments error:", error);
            res.status(500).json({ message: "Tahsilatlar çekilirken hata oluştu", error });
        }
    });


    app.delete("/api/delete-payment/:id", authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;

            const payment = await connection("patient_revenues").where({ id }).first();

            if (!payment) {
                return res.status(404).json({ message: "Tahsilat bulunamadı" });
            }

            // Önce detayları al (çünkü detayları sildikten sonra pp_id'leri kalmaz)
            const details = await connection("patient_revenue_det").where({ revenue_id: id });

            // Detayları sil
            await connection("patient_revenue_det").where({ revenue_id: id }).del();

            // Feed kontrolü
            // const feed = await connection('feeds')
            //     .where({ reference_table: 'patient_revenues', reference_id: id })
            //     .first();

            // if (feed) {
            //     // Feed varsa, hem feed hem master kaydı siler
            //     await deleteFeedWithReference(feed.id);
            // } else {
            //     // Feed yoksa, master kaydı kendimiz sil
            //     await connection("patient_revenues").where({ id }).del();
            // }

            const patientArrival = await connection('patient_arrivals')
                .select('u_id')
                .where({ id: payment.pa_id })
                .first();

            await logFeed({
                user_id: patientArrival ? patientArrival.u_id : null,
                title: `Tahsilat silindi (${payment.amount} ₺)`,
                icon: "bi bi-cash-coin",
                color: "danger",
                feed_date: new Date(),
                reference_table: 'patient_revenues',
                reference_id: id
            });
            await connection("patient_revenues").where({ id }).del();

            // Şimdi detaylarda bulunan pp_id'lerin is_paid alanını 0 yap
            const ppIds = details.map(d => d.pp_id);
            if (ppIds.length) {
                await connection("patient_process")
                    .whereIn("id", ppIds)
                    .update({ is_paid: 0 });
            }

            res.json({ message: "Tahsilat başarıyla silindi ve is_paid güncellendi" });
        } catch (error) {
            console.error("API delete-payment error:", error);
            console.error("Error message:", error.message);
            console.error("Stack trace:", error.stack);
            res.status(500).json({ message: "Tahsilat silinirken hata oluştu", error: error.message });
        }
    });

    app.get("/api/payment-summary/:pa_id", authenticateToken, async (req, res) => {
        try {
            const { pa_id } = req.params;

            // patient_process toplam borç (total_price toplamı)
            const totalResult = await connection("patient_process")
                .where({ pa_id })
                .sum("total_prices as total")
                .first();

            const total = Number(totalResult.total) || 0;

            // patient_revenues ve detaylardan ödenen tutarı hesapla
            // patient_revenue_det.total_prices toplamı ile
            const paidResult = await connection("patient_revenues as pr")
                .join("patient_revenue_det as det", "pr.id", "det.revenue_id")
                .where("pr.pa_id", pa_id)
                .sum("det.amount as paid")
                .first();

            const paid = Number(paidResult.paid) || 0;

            const remaining = total - paid;

            res.json({ total, paid, remaining });
        } catch (error) {
            console.error("API payment-summary error:", error);
            res.status(500).json({ message: "Ödeme özeti alınırken hata oluştu", error });
        }
    });
}

export default methodPayment;
