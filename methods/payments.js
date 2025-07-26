import connection from "../knex/connection.js";
import authenticateToken from "./Middleware/index.js";
import logFeed from './utils/logFeed.js';
import { deleteFeedWithReference } from './utils/deleteFeed.js';

function methodPayment(app) {

    app.get("/api/unpaid-processes", authenticateToken, async (req, res) => {
        try {
            const off_id = req.user.off_id;
            const { pa_id } = req.query;
            if (!pa_id) return res.status(400).json({ message: "pa_id zorunludur" });

            const results = await connection('patient_process as pp')
                .where('pp.pa_id', pa_id)
                .andWhere('pp.off_id', off_id)  // off_id filtresi
                .whereNotIn('pp.id', function () {
                    this.select('pp_id').from('patient_revenue_det');
                })
                .leftJoin('materials as m', function () {
                    this.on('pp.process_id', '=', 'm.id').andOn('pp.row_type', '=', connection.raw('?', ['M']));
                })
                .leftJoin('services as s', function () {
                    this.on('pp.process_id', '=', 's.id').andOn('pp.row_type', '=', connection.raw('?', ['H']));
                })
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
            const off_id = req.user.off_id;
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
                off_id
            });

            const detailRows = details.map(({ pp_id, amount }) => ({
                revenue_id: paymentId,
                pp_id,
                amount,
            }));

            await connection("patient_revenue_det").insert(detailRows);

            await connection('patient_process')
                .whereIn('id', details.map(d => d.pp_id))
                .andWhere('off_id', off_id)
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

            res.json({ message: "Tahsilat başarıyla eklendi", paymentId });
        } catch (error) {
            console.error("API add-payment error:", error);
            res.status(500).json({ message: "Tahsilat eklenirken hata oluştu", error });
        }
    });

    // Tahsilat listesi (master ve detayları getir)
    app.get("/api/payments/:pa_id", authenticateToken, async (req, res) => {
        try {
            const off_id = req.user.off_id;
            const { pa_id } = req.params;
            if (!pa_id) return res.status(400).json({ message: "pa_id zorunludur" });

            const payments = await connection("patient_revenues as pr")
                .select(
                    "pr.*",
                    "pr.amount as total_prices"
                )
                .where("pr.pa_id", pa_id)
                .andWhere('pr.off_id', off_id)  // off_id filtresi
                .orderBy("pr.ctime", "desc");

            if (!payments.length) return res.json([]);

            const pr_ids = payments.map(p => p.id);

            const baseDetails = await connection("patient_revenue_det as det")
                .whereIn("det.revenue_id", pr_ids)
                .leftJoin("patient_process as pp", "det.pp_id", "pp.id")
                .select(
                    "det.*",
                    "pp.process_id",
                    "pp.row_type",
                    "pp.count",
                    "pp.total_prices",
                    "pp.off_id"
                )
                .andWhere('pp.off_id', off_id); // off_id filtresi detayda da

            const serviceIds = [];
            const stockIds = [];

            for (const d of baseDetails) {
                if (d.row_type === "H") serviceIds.push(d.process_id);
                else if (d.row_type === "M") stockIds.push(d.process_id);
            }

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

            const detailsWithNames = baseDetails.map(d => ({
                ...d,
                process_name:
                    d.row_type === "H"
                        ? serviceMap[d.process_id] || "Hizmet (silinmiş)"
                        : stockMap[d.process_id] || "Malzeme (silinmiş)"
            }));

            const groupedDetails = {};
            for (const detail of detailsWithNames) {
                if (!groupedDetails[detail.revenue_id]) groupedDetails[detail.revenue_id] = [];
                groupedDetails[detail.revenue_id].push(detail);
            }

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
            const off_id = req.user.off_id;
            const { id } = req.params;

            const payment = await connection("patient_revenues").where({ id, off_id }).first();

            if (!payment) {
                return res.status(404).json({ message: "Tahsilat bulunamadı" });
            }

            const details = await connection("patient_revenue_det").where({ revenue_id: id });

            await connection("patient_revenue_det").where({ revenue_id: id }).del();

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

            await connection("patient_revenues").where({ id, off_id }).del();

            const ppIds = details.map(d => d.pp_id);
            if (ppIds.length) {
                await connection("patient_process")
                    .whereIn("id", ppIds)
                    .andWhere('off_id', off_id)
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
            const off_id = req.user.off_id;
            const { pa_id } = req.params;

            const totalResult = await connection("patient_process")
                .where({ pa_id, off_id })
                .sum("total_prices as total")
                .first();

            const total = Number(totalResult.total) || 0;

            const paidResult = await connection("patient_revenues as pr")
                .join("patient_revenue_det as det", "pr.id", "det.revenue_id")
                .where("pr.pa_id", pa_id)
                .andWhere('pr.off_id', off_id)
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
