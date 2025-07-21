
import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';

function methodsclinic(app) {
    //Clinic apileri
    app.get('/api/cliniclist', authenticateToken, (req, res) => {
        connection
            .select('clinic_date.*')
            .select('users.name as user_name')
            .from('clinic_date')
            .join('users', 'clinic_date.clinic_admin', 'users.id')
            .then((clinic) => {

                return res.status(200).json({ status: 'success', response: clinic });
            })
            .catch((err) => {
                console.error('Veritabanı hatası:', err);
                res.status(500).json({ error: 'Veritabanı hatası', status: 'error' });
            });
    });

    app.delete('/api/cliniclistdel/:id', authenticateToken, (req, res) => {
        const { id } = req.params;

        connection('clinic_date')
            .where({ id })
            .del()
            .then((deletedCount) => {
                if (deletedCount === 0) {
                    console.log(`ID'si ${id} olan hayvan bulunamadı.`);
                    return res.status(404).json({ error: `ID'si ${id} olan hayvan bulunamadı.`, status: 'error' });
                }
                console.log(`ID'si ${id} olan hayvan başarıyla silindi.`);
                return res.status(200).json({ status: 'success', message: `ID'si ${id} olan hayvan başarıyla silindi.` });
            })
            .catch((err) => {
                console.error('Veritabanı hatası:', err);
                res.status(500).json({ error: 'Veritabanı hatası', status: 'error' });
            });
    });


    app.put('/api/cliniclistUpdate/:id', async (req, res) => {
        const id = req.params.id;
        const { name, dbname, dbpassword, email, phone, clinicadmin } = req.body;
        console.log(id, name, dbname, dbpassword, email, phone, clinicadmin);
        try {
            await connection('clinic_date')
                .where({ id: id })
                .update({
                    name: name,
                    dbname: dbname,
                    dbpassword: dbpassword,
                    email: email,
                    phone: phone,
                    clinic_admin: clinicadmin
                });

            return res.status(200).json({ status: 'success', message: 'Update operation completed.' });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error', status: 'error', details: error.message });
        }
    });
    app.post('/api/clinicpost', async (req, res) => {
        try {
            const { name, dbname, dbpassword, email, phone, clinicadmin } = req.body;
            
            // Önce clinic_date tablosunda kayıt olup olmadığını kontrol et
            connection('clinic_date').count('id as count').then(rows => {
                const recordCount = rows[0].count;
    
                if (recordCount > 0) {
                    // Eğer kayıt varsa hata döndür
                    var response = {
                        status: 'error',
                        message: 'Kayıt bulundu, yeni kayıt eklenemedi.',
                    };
                    return res.status(400).json(response);
                } else {
                    // Kayıt yoksa yeni kaydı ekle
                    connection('clinic_date').insert({
                        name: name,
                        dbname: dbname,
                        dbpassword: dbpassword,
                        email: email,
                        phone: phone,
                        clinic_admin: clinicadmin,
                    }).then(() => {
                        var response = {
                            status: 'success',
                            message: 'Kayıt işlemi tamamlandı.',
                        };
                        return res.status(200).json(response);
                    }).catch(err => {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Database error', status: 'error' });
                    });
                }
            }).catch(err => {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error', status: 'error' });
            });
    
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Server error', status: 'error' });
        }
    });
    

}

export default methodsclinic;
