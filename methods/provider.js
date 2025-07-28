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



}

export default methodsprovider;