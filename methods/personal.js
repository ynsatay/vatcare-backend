import connection from "../knex/connection.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import authenticateToken from "./Middleware/index.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function methodpersonal(app) {

    app.post('/api/addpersonel', authenticateToken, (req, res) => {
        try {
            const {
                name, surname, username, password, passwordAgain,
                email, role, address, phone, picture,
                birthdate, sex, active, identity
            } = req.body;

            if (!name || !surname || !username || !password || !email || !role) {
                return res.status(400).json({ error: 'Zorunlu alanları doldurunuz', status: 'error' });
            }

            const offId = req.user.off_id;
            if (!offId) {
                return res.status(403).json({ error: 'Şube bilgisi bulunamadı', status: 'error' });
            }

            connection.select().from('users').where('uname', username).orWhere('email', email).then((user) => {
                if (user.length > 0) {
                    return res.status(400).json({ error: 'Kullanıcı adı ya da email zaten kayıtlı', status: 'error' });
                }

                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) {
                        return res.status(400).json({ error: 'Şifre şifrelenemedi', status: 'error' });
                    }

                    const token = jwt.sign({ username: username }, 'secret', { expiresIn: '24h' });

                    connection('users')
                        .insert({
                            name,
                            surname,
                            uname: username,
                            password: hash,
                            email,
                            role,
                            address,
                            phone,
                            picture,
                            birthdate,
                            sex,
                            active,
                            identity,
                            off_id: offId
                        })
                        .returning('id')
                        .then((insertedIds) => {
                            const newUserId = insertedIds[0];
                            return res.status(200).json({
                                status: 'success',
                                message: 'Kayıt işlemi tamamlandı.',
                                token,
                                insertId: newUserId
                            });
                        });
                });
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        }
    });


    //Ülke listesini çeker
    app.get('/api/getCountry', authenticateToken, (req, res) => {
        connection.select('*').from('country_list').then((countries) => {
            if (countries.length === 0) {
                return res.status(404).json({ error: 'Ülke bulunamadı', status: 'error' });
            }

            const response = countries.map((country) => ({
                id: country.id,
                name: country.name,
                surname: country.rewrite,
                email: country.area_code
            }));

            return res.status(200).json({ status: 'success', countries: response });
        }).catch((error) => {
            console.error('Ülke bilgileri getirilirken bir hata oluştu:', error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        });
    });

    app.get('/api/getpersonel', authenticateToken, (req, res) => {
        const offId = req.user.off_id; // Token'dan off_id alıyoruz

        connection.select().from('users')
            .where('role', '<>', 1)
            .andWhere('off_id', offId) // off_id ile filtreleme
            .then((users) => {
                if (users.length === 0) {
                    return res.status(404).json({ error: 'Personel bulunamadı', status: 'error' });
                }

                const response = users.map((user) => ({
                    id: user.id,
                    name: user.name,
                    surname: user.surname,
                    username: user.uname,
                    email: user.email,
                    role: user.role,
                    address: user.address,
                    phone: user.phone,
                    picture: user.picture,
                    birthdate: user.birthdate,
                    sexuality: user.sex,
                    active: user.active
                }));
                return res.status(200).json({ status: 'success', users: response });
            })
            .catch((error) => {
                console.error('Personel bilgileri getirilirken bir hata oluştu:', error);
                return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
            });
    });

    app.put('/api/updatepersonel/:id', authenticateToken, (req, res) => {
        const userId = req.params.id;
        const {
            name,
            surname,
            username,
            email,
            address,
            phone,
            birthdate,
            sexuality,
            role,
            active
        } = req.body;

        connection('users')
            .where('id', userId)
            .update({
                name,
                surname,
                uname: username,
                email,
                address,
                phone,
                birthdate,
                sex: sexuality,
                role,
                active
            })
            .then(() => {
                res.status(200).json({ status: 'success', message: 'Personel bilgileri güncellendi.' });
            })
            .catch((error) => {
                console.error('Güncelleme hatası:', error);
                res.status(500).json({ status: 'error', error: 'Güncelleme başarısız' });
            });
    });

    app.put('/api/updateusername', authenticateToken, (req, res) => {
        const { id, username } = req.body;

        if (!id || !username) {
            return res.status(400).json({ status: 'error', message: 'Eksik bilgi' });
        }

        connection('users')
            .where('id', id)
            .update({ uname: username })
            .then(() => res.json({ status: 'success', message: 'Kullanıcı adı güncellendi' }))
            .catch(err => {
                console.error(err);
                res.status(500).json({ status: 'error', message: 'Güncelleme hatası' });
            });
    });


}

export default methodpersonal;