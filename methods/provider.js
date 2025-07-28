import connection from "../knex/connection.js";
import authenticateToken from "./Middleware/index.js";

function methodsprovider(app) {
    app.get('/api/provider-firms', authenticateToken, async (req, res) => {
        const off_id = req.user.off_id; // Eğer off_id kullanıyorsanız
        const { search } = req.query; // arama sorgusu opsiyonel

        try {
            let query = connection('provider_firms')
                .select('id', 'name', 'contact_person', 'phone', 'email', 'address', 'active')
                .where('active', true);

            if (search) {
                query = query.andWhere('name', 'like', `%${search}%`);
            }

            const firms = await query.orderBy('name', 'asc');
            res.json({ status: 'success', firms });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Tedarikçi firmalar getirilirken hata oluştu.' });
        }
    });

    app.post('/api/add-provider-firms', authenticateToken, async (req, res) => {
        const { name, contact_person, phone, email, address, active } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Firma adı zorunludur.' });
        }

        try {
            const [id] = await connection('provider_firms').insert({
                name,
                contact_person,
                phone,
                email,
                address,
                active: active === undefined ? true : active,
            });

            res.json({ status: 'success', id });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Firma eklenirken hata oluştu.' });
        }
    });

    app.put('/api/upd-provider-firms/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { name, contact_person, phone, email, address, active } = req.body;

        try {
            const updatedRows = await connection('provider_firms')
                .where({ id })
                .update({
                    name,
                    contact_person,
                    phone,
                    email,
                    address,
                    active,
                    updated_at: connection.fn.now(),
                });

            if (updatedRows === 0) {
                return res.status(404).json({ error: 'Firma bulunamadı.' });
            }

            res.json({ status: 'success' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Firma güncellenirken hata oluştu.' });
        }
    });

    app.delete('/api/del-provider-firms/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const firm = await connection('provider_firms').where({ id }).first();

            if (!firm) {
                return res.status(404).json({ message: 'Firma bulunamadı' });
            }

            await connection('provider_firms').where({ id }).del();

            res.status(200).json({ message: 'Firma başarıyla silindi' });
        } catch (error) {
            console.error('Firma silme hatası:', error);
            res.status(500).json({ message: 'Firma silinirken bir hata oluştu' });
        }
    });


    //Detay apileri
    app.get('/api/provider-price-list', authenticateToken, async (req, res) => {
        try {
            const data = await knex('provider_firm_det as pfd')
                .select(
                    'pfd.id',
                    'm.name as material_name',
                    'pf.name as provider_firm_name',
                    'pfd.purchase_price',
                    'pfd.vat_rate',
                    'pfd.is_default',
                    'pfd.active'
                )
                .leftJoin('materials as m', 'pfd.material_id', 'm.id')
                .leftJoin('provider_firms as pf', 'pfd.pf_id', 'pf.id');

            res.json({ status: 'success', firms: data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Liste getirilemedi.' });
        }
    });

    // Yeni tedarikçi fiyat detayı ekle
    app.post('/api/provider-price-create', authenticateToken, async (req, res) => {
        const { pf_id, material_id, purchase_price, vat_rate, is_default, active } = req.body;

        try {
            await knex('provider_firm_det').insert({
                pf_id,
                material_id,
                purchase_price,
                vat_rate: vat_rate || 0,
                is_default: is_default ? 1 : 0,
                active: (active !== undefined) ? (active ? 1 : 0) : 1,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now(),
            });

            res.json({ status: 'success', message: 'Kayıt başarıyla eklendi.' });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Kayıt eklenemedi.', error: error, error_message: error.message });
        }
    });

    app.put('/api/provider-price-update/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { pf_id, material_id, purchase_price, vat_rate, is_default, active } = req.body;

        try {
            const affected = await knex('provider_firm_det').where('id', id).update({
                pf_id,
                material_id,
                purchase_price,
                vat_rate: vat_rate || 0,
                is_default: is_default || false,
                active: active !== undefined ? active : true,
                updated_at: knex.fn.now(),
            });

            if (affected === 0) {
                return res.status(404).json({ status: 'error', message: 'Kayıt bulunamadı.' });
            }

            res.json({ status: 'success', message: 'Kayıt başarıyla güncellendi.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Güncelleme başarısız.' });
        }
    });

    app.delete('/api/provider-price-delete/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const deleted = await knex('provider_firm_det').where('id', id).del();

            if (deleted === 0) {
                return res.status(404).json({ status: 'error', message: 'Kayıt bulunamadı.' });
            }

            res.json({ status: 'success', message: 'Kayıt başarıyla silindi.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Silme başarısız.' });
        }
    });



}

export default methodsprovider;