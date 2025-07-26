import connection from "../knex/connection.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import authenticateToken from "./Middleware/index.js";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { sendMail } from '../methods/utils/mailer.js';
dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function methods(app) {
    //Giriş İşlemleri
    app.post('/api/login', (req, res) => {
        const { username, password } = req.body;

        if (username === '' || password === '') {
            return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir', status: 'error' });
        }

        connection.select().from('users').where('uname', username).orWhere('email', username).then((user) => {
            if (user.length === 0) {
                return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı', status: 'error' });
            }

            const hashedPassword = user[0].password;
            bcrypt.compare(password, hashedPassword, (err, result) => {
                if (err || !result) {
                    return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı', status: 'error' });
                }

                const token = jwt.sign({ username: username }, 'secret', { expiresIn: '24h' });

                var response = {
                    status: 'success',
                    message: 'Giriş başarılı',
                    token: token,
                    userid: user[0].id,
                    username: user[0].uname,
                    userRole: user[0].role
                }

                return res.status(200).json(response);
            });
        });
    });

    //Kayıt İşlemleri
    app.post('/api/register', (req, res) => {
        try {
            const { name, surname, username, password, passwordAgain, email } = req.body;
            if (name === '' || surname === '' || username === '' || password === '' || email === '') {
                return res.status(400).json({ error: 'Kullanıcı adı, sifre ve email gereklidir', status: 'error' });
            }

            if (password !== passwordAgain) {
                return res.status(400).json({ error: 'Sifreler uyusmuyor', status: 'error' });
            }

            connection.select().from('users').where('uname', username).orWhere('email', email).then((user) => {
                if (user.length > 0) {
                    return res.status(400).json({ error: 'Kullanıcı adı ya da email zaten kayıtlı', status: 'error' });
                }

                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) {
                        return res.status(400).json({ error: 'Kullanıcı adı ya da email zaten kayıtlı', status: 'error' });
                    }

                    const token = jwt.sign({ username: username }, 'secret', { expiresIn: '24h' });
                    connection('users').insert({ name: name, surname: surname, uname: username, password: hash, email: email, role: '1', active: '1' }).then(() => {
                        var response = {
                            status: 'success',
                            // message: 'Kayıt islemi tamamlandı. Lütfen e-mail adresinize gelen link ile hesabınızı aktif ediniz.',
                            message: 'Kayıt islemi tamamlandı.',
                            token: token
                        }
                        return res.status(200).json(response);
                    });
                });
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        }
    });

    //TEXT alana Resim kaydetme
    app.post('/api/upload-profile-picture', authenticateToken, upload.single('picture'), (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Lütfen bir resim dosyası seçiniz', status: 'error' });
            }

            const { userId } = req.body;
            const allowedTypes = ['image/jpeg', 'image/png']; // İzin verilen dosya türleri

            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ error: 'Sadece JPG veya PNG formatında resim dosyaları yüklenebilir', status: 'error' });
            }

            // Base64 formatına dönüştürmek için
            const base64Image = req.file.buffer.toString('base64');

            // Veritabanına kaydetme işlemi
            connection('users')
                .where('id', userId)
                .update({ picture: base64Image }) // Yeni blob türündeki alana base64 formatında resmi kaydet
                .then(() => {
                    return res.status(200).json({ status: 'success', message: 'Profil resmi başarıyla güncellendi' });
                })
                .catch((error) => {
                    console.error('Profil resmi güncellenirken bir hata oluştu:', error);
                    return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
                });

        } catch (error) {
            console.error('Profil resmi yüklenirken bir hata oluştu:', error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        }
    });

    //Porifl resmini veri tabanından çekme islemi
    app.get('/api/get-profile-picture/:userid', authenticateToken, (req, res) => {
        const { userid } = req.params; // Parametre adını userid olarak değiştirin

        // Veritabanından kullanıcıyı id'ye göre sorgula
        connection.select('picture').from('users').where('id', userid).then((user) => {
            if (user.length === 0) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı', status: 'error' });
            }

            // Kullanıcının profil resmini base64 formatında frontend'e gönder
            if (!user[0].picture) {
                return res.status(404).json({ error: 'Profil resmi bulunamadı', status: 'error' });
            }

            const profileImage = user[0].picture.toString('base64');

            return res.status(200).json({ status: 'success', profileImage });
        }).catch((error) => {
            console.error('Profil resmi getirilirken bir hata oluştu:', error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        });
    });

    //Profili günceller
    app.post('/api/update-profile', authenticateToken, upload.single('picture'), (req, res) => {
        try {
            const { userId, name, surname, password, phone, email, sex, birthdate, address } = req.body;

            if (req.file) {
                const allowedTypes = ['image/jpeg', 'image/png'];
                if (!allowedTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({ error: 'Sadece JPG veya PNG formatında resim dosyaları yüklenebilir', status: 'error' });
                }
            }

            const updateData = {
                name,
                surname,
                password,
                phone,
                email,
                sex,
                birthdate,
                address
            };

            if (req.file) {
                const base64Image = req.file.buffer.toString('base64');
                updateData.picture = base64Image;
            }

            connection('users')
                .where('id', userId)
                .update(updateData)
                .then(() => {
                    return res.status(200).json({ status: 'success', message: 'Profil başarıyla güncellendi' });
                })
                .catch((error) => {
                    console.error('Profil güncellenirken bir hata oluştu:', error);
                    return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
                });

        } catch (error) {
            console.error('Profil güncellenirken bir hata oluştu:', error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        }
    });

    //Kullanıcı bilgilerini veri tabanından çekme islemi
    app.get('/api/getUser', authenticateToken, (req, res) => {
        const userid = req.query.id;
        let profileImage = null; // profileImage'i let ile tanımladık

        connection.select('*').from('users').where('id', userid).then((user) => {
            if (user.length === 0) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı', status: 'error' });
            }
            if (user[0].picture) {
                profileImage = user[0].picture.toString('base64');
            }

            const response = {
                id: user[0].id,
                name: user[0].name,
                surname: user[0].surname,
                email: user[0].email,
                phone: user[0].phone,
                sex: user[0].sex,
                birthdate: user[0].birthdate,
                address: user[0].address,
                picture: profileImage
            }
            return res.status(200).json({ status: 'success', user: response });
        }).catch((error) => {
            console.error('Kullanıcı bilgileri getirilirken bir hata oluştu:', error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        });
    });

    app.post('/api/change-password', authenticateToken, (req, res) => {
        const { userid, oldPassword, password, passwordAgain } = req.body;

        connection.select('password').from('users').where('id', userid).then((user) => {

            if (password !== passwordAgain) {
                return res.status(400).json({ error: 'Yeni sifreler uyusmuyor', status: 'error', message: 'Yeni sifreler uyusmuyor!' });
            }

            const hashedOldPassword = user[0].password;
            bcrypt.compare(oldPassword, hashedOldPassword, (err, result) => {
                if (err || !result) {
                    return res.status(400).json({ error: 'Gecersiz eski sifre', status: 'error', message: 'Gecersiz eski sifre!' });
                }

                const hashedNewPassword = bcrypt.hashSync(password, 10);
                connection('users').where('id', userid).update({ password: hashedNewPassword }).then(() => {
                    return res.status(200).json({ status: 'success', message: 'Sifre başarıyla değiştirildi!' });
                }).catch((error) => {
                    console.error('Sifre değiştirilirken bir hata oluştu:', error);
                    return res.status(500).json({ error: 'Sunucu hatası', status: 'error', message: 'Sifre değiştirilirken bir hata oluştu!' });
                });
            });
        }).catch((error) => {
            console.error('Sifre değiştirilirken bir hata oluştu:', error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error', message: 'Sifre değiştirilirken bir hata oluştu!' });
        });
    });

    //Akışları getirir.
    app.get('/api/feeds', authenticateToken, async (req, res) => {
        try {
            const feeds = await connection('feeds as f')
                .leftJoin('users as u', 'f.user_id', 'u.id')
                .select(
                    connection.raw("CONCAT(u.name, ' ', u.surname) as user_name"),
                    'f.title',
                    'f.icon',
                    'f.color',
                    'f.created_at'
                )
                .whereRaw('DATE(f.created_at) = CURDATE()')
                .orderBy('f.created_at', 'desc')
                .limit(50);

            res.json(feeds);
        } catch (error) {
            console.error('Feeds çekilirken hata:', error);
            res.status(500).json({ error: 'Akış verileri çekilirken hata oluştu' });
        }
    });

    app.get("/api/dashboardStats", authenticateToken, async (req, res) => {
        try {
            const [appCompleted] = await connection("appointment_process")
                .where("status", "2")
                .andWhereRaw("MONTH(start_time) = MONTH(CURRENT_DATE())")
                .andWhereRaw("YEAR(start_time) = YEAR(CURRENT_DATE())")
                .count("* as total");

            const [totalVaccines] = await connection('patient_process as pp')
                .join('materials as m', 'pp.process_id', 'm.id')
                .where('pp.row_type', 'M')
                .andWhere('m.category', 5)
                .andWhere('pp.ctime', '>=', connection.raw("DATE_FORMAT(NOW(), '%Y-%m-01')"))
                .sum('pp.count as total');

            const [appointments] = await connection("appointment_process")
                .whereRaw("DATE(start_time) = CURRENT_DATE()")
                .count("* as total");

            const [totalPayments] = await connection('patient_revenues')
                .where('is_refund', 0)
                .andWhere('ctime', '>=', connection.raw("DATE_FORMAT(NOW(), '%Y-%m-01')"))
                .sum('amount as total');

            res.json({
                appCompleted: appCompleted?.total || 0,
                vaccines: totalVaccines?.total || 0,
                appointments: appointments?.total || 0,
                payments: totalPayments?.total || 0,
            });
        } catch (error) {
            console.error("Dashboard stats error:", error);
            res.status(500).json({ message: "Sunucu hatası" });
        }
    });


    //mail apisi
    app.post('/api/sendDemoRequest', async (req, res) => {
        const { name, email, phone, message, plan } = req.body;

        try {
            await sendMail({
                to: email,
                subject: 'Demo Talebi',
                text: `İsim: ${name}
                       E-posta: ${email}
                       Telefon: ${phone}
                       Plan: ${plan}
                       Mesaj: ${message || '—'}
                    `,
                                });

            res.status(200).json({ message: 'Demo talebi gönderildi' });
        } catch (error) {
            console.error('Mail gönderme hatası:', error);
            res.status(500).json({ message: 'Mail gönderme başarısız' });
        }
    });

}


export default methods;
