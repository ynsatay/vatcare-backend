import connection from "../knex/connection.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import authenticateToken from "./Middleware/index.js";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { sendMail } from '../methods/utils/mailer.js';
import blockDemoUser from "./Middleware/blockDemoUser.js";
import fs from "fs";

dotenv.config();

// 🔐 RSA anahtarlarını ENV üzerinden al
const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const publicKey = fs.readFileSync(publicKeyPath, "utf8");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


function methods(app) {
    //Giriş İşlemleri
    app.post("/api/login", (req, res) => {
        const { username, password, office_id } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "Kullanıcı adı ve şifre gereklidir", status: "error" });
        }

        connection("users")
            .where(function () {
                this.where("uname", username).orWhere("email", username);
            })
            .andWhere("off_id", office_id)
            .first()
            .then((user) => {
                if (!user) {
                    return res.status(400).json({
                        error: "Kullanıcı adı veya şifre hatalı",
                        status: "error",
                    });
                }

                bcrypt.compare(password, user.password, (err, result) => {
                    if (err || !result) {
                        return res.status(400).json({
                            error: "Kullanıcı adı veya şifre hatalı",
                            status: "error",
                        });
                    }

                    // 🔐 RS256 ile token oluşturma
                    const token = jwt.sign(
                        {
                            username: user.uname,
                            off_id: user.off_id,
                            role: user.role,
                        },
                        privateKey,
                        {
                            algorithm: "RS256",
                            expiresIn: "24h",
                        }
                    );

                    return res.status(200).json({
                        status: "success",
                        message: "Giriş başarılı",
                        token: token,
                        userid: user.id,
                        username: user.uname,
                        userRole: user.role,
                        off_id: user.off_id,
                    });
                });
            })
            .catch((error) => {
                console.error("Login error:", error);
                return res
                    .status(500)
                    .json({ error: "Sunucu hatası", status: "error" });
            });
    });

    // HR Offices listesini çekme endpointi
    app.get('/api/hr_offices', async (req, res) => {
        try {
            const offices = await connection('hr_offices').select('*');
            return res.status(200).json(offices);
        } catch (error) {
            console.error('HR Offices API error:', error);
            return res.status(500).json({ error: 'Sunucu hatası oluştu' });
        }
    });

    //Kayıt İşlemleri--şimdilik kullanılmıyor.
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
    app.post('/api/upload-profile-picture', authenticateToken, blockDemoUser, upload.single('picture'), (req, res) => {
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
    app.post('/api/update-profile', authenticateToken, blockDemoUser, upload.single('picture'), (req, res) => {
        try {
            const { userId, name, surname, password, phone, email, sex, birthdate, address, nationality } = req.body;

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
                address,
                nationality
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
                picture: profileImage,
                username: user[0].uname,
                identity: user[0].identity,
                nationality: user[0].nationality,
                pass_number: user[0].pass_number
            }
            return res.status(200).json({ status: 'success', user: response });
        }).catch((error) => {
            console.error('Kullanıcı bilgileri getirilirken bir hata oluştu:', error);
            return res.status(500).json({ error: 'Sunucu hatası', status: 'error' });
        });
    });

    app.post('/api/change-password', authenticateToken, blockDemoUser, (req, res) => {
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
    //Akışları getirir.
    app.get('/api/feeds', authenticateToken, async (req, res) => {
        try {
            const userOffId = req.user.off_id;
            const { category } = req.query;

            const baseSelect = [
                connection.raw("CONCAT(u.name, ' ', u.surname) as user_name"),
                'f.title',
                'f.icon',
                'f.color',
                connection.raw("DATE_FORMAT(f.feed_date, '%Y-%m-%d %H:%i:%s') as created_at")
            ];

            let query = connection('feeds as f')
                .leftJoin('users as u', 'f.user_id', 'u.id')
                .select(baseSelect)
                .where('f.off_id', userOffId)
                .whereRaw('DATE(f.feed_date) = CURDATE()')
                .orderBy('f.feed_date', 'desc')
                .limit(50);

            if (category === 'payments') {
                query.where('f.reference_table', 'patient_revenues');
            }

            if (category === 'appointment') {
                query.where('f.reference_table', 'appointment_process');
            }

            if (category === 'service') {
                query
                    .join('patient_process as pp', function () {
                        this.on('f.reference_id', '=', 'pp.id')
                            .andOn('f.reference_table', '=', connection.raw('?', ['patient_process']));
                    })
                    .where('pp.row_type', 'H');
            }

            if (category === 'vaccine') {
                query
                    .join('patient_process as pp', function () {
                        this.on('f.reference_id', '=', 'pp.id')
                            .andOn('f.reference_table', '=', connection.raw('?', ['patient_process']));
                    })
                    .join('materials as m', 'pp.process_id', 'm.id')
                    .where('pp.row_type', 'M')
                    .where('m.category', 5);
            }

            if (category === 'stock') {
                query
                    .join('patient_process as pp', function () {
                        this.on('f.reference_id', '=', 'pp.id')
                            .andOn('f.reference_table', '=', connection.raw('?', ['patient_process']));
                    })
                    .join('materials as m', 'pp.process_id', 'm.id')
                    .where('pp.row_type', 'M')
                    .where(function () {
                        this.whereNull('m.category').orWhere('m.category', '!=', 5);
                    });
            }

            const feeds = await query;
            return res.json(feeds);

        } catch (error) {
            console.error('Feeds çekilirken hata:', error);
            res.status(500).json({ error: 'Akış verileri çekilirken hata oluştu' });
        }
    });

    app.get("/api/dashboardStats", authenticateToken, async (req, res) => {
        try {
            const userOffId = req.user.off_id;
            const [appCompleted] = await connection("appointment_process")
                .where("status", "2")
                .where('off_id', userOffId)
                .andWhereRaw("MONTH(start_time) = MONTH(CURRENT_DATE())")
                .andWhereRaw("YEAR(start_time) = YEAR(CURRENT_DATE())")
                .count("* as total");

            const [totalVaccines] = await connection('patient_process as pp')
                .join('materials as m', 'pp.process_id', 'm.id')
                .where('pp.row_type', 'M')
                .where('off_id', userOffId)
                .andWhere('m.category', 5)
                .andWhere('pp.ctime', '>=', connection.raw("DATE_FORMAT(NOW(), '%Y-%m-01')"))
                .sum('pp.count as total');

            const [appointments] = await connection("appointment_process")
                .where('off_id', userOffId)
                .whereRaw("DATE(start_time) = CURRENT_DATE()")
                .count("* as total");

            const [totalPayments] = await connection('patient_revenues')
                .where('off_id', userOffId)
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
    app.post('/api/sendDemoRequest', blockDemoUser, async (req, res) => {
        const { name, email, phone, message, plan } = req.body;

        try {
            await sendMail({
                to: "ynsmratay@gmail.com",
                subject: 'VetCare | Yeni Demo Talebi',
                html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f5fb;padding:24px;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.06);overflow:hidden;border:1px solid #eef0f6;">
              <div style="background:linear-gradient(135deg,#59018b,#7a1fa8);padding:18px 22px;color:#fff;">
                <div style="font-size:19px;font-weight:700;">📩 Yeni Demo Talebi</div>
                <div style="opacity:0.85;font-size:13px;">Landing formundan iletildi</div>
              </div>
              <div style="padding:22px; color:#111827; display:grid; row-gap:12px; column-gap:8px; font-size:15px;">
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:center;">
                  <div style="font-weight:600;color:#6b7280;">👤 Ad Soyad</div><div>${name}</div>
                </div>
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:center;">
                  <div style="font-weight:600;color:#6b7280;">📧 E-posta</div><div>${email}</div>
                </div>
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:center;">
                  <div style="font-weight:600;color:#6b7280;">📞 Telefon</div><div>${phone}</div>
                </div>
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:center;">
                  <div style="font-weight:600;color:#6b7280;">📦 Plan</div><div>${plan}</div>
                </div>
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:flex-start;">
                  <div style="font-weight:600;color:#6b7280;">📝 Mesaj</div><div>${message?.trim() || 'Belirtilmedi'}</div>
                </div>
                <div style="margin-top:6px;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,#f3e8ff,#eef2ff);border:1px solid #e7ddff;">
                  <div style="font-weight:700;color:#4c1d95;margin-bottom:6px;">📌 Otomatik Demo Bilgisi</div>
                  <div style="color:#4b5563;font-size:14px;">Kullanıcı adı: <strong>test</strong> — Şifre: <strong>123</strong></div>
                </div>
              </div>
              <div style="padding:14px 22px;border-top:1px solid #eef0f6;font-size:13px;color:#6b7280;">
                Lütfen en kısa sürede kullanıcıyla iletişime geçiniz.
              </div>
            </div>
          </div>
        `,
                text: `
VetCare - Yeni demo talebi

Ad Soyad : ${name}
E-posta  : ${email}
Telefon  : ${phone}
Plan     : ${plan}
Mesaj    : ${message?.trim() || 'Belirtilmedi'}
Otomatik demo: kullanıcı adı=test şifre=123
        `
            });

            res.status(200).json({ success: true, message: 'Demo talebi gönderildi' });
        } catch (error) {
            console.error('Mail gönderme hatası:', error);
            res.status(500).json({ message: 'Mail gönderme başarısız' });
        }
    });

    // Şifre sıfırlama talebi maili
    app.post('/api/forgot-password-request', async (req, res) => {
        const { email, phone, note } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'E-posta gereklidir', success: false });
        }

        try {
            await sendMail({
                to: "ynsmratay@gmail.com",
                subject: 'VetCare | Şifre Sıfırlama Talebi',
                html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f5fb;padding:24px;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.06);overflow:hidden;border:1px solid #eef0f6;">
              <div style="background:linear-gradient(135deg,#59018b,#7a1fa8);padding:18px 22px;color:#fff;">
                <div style="font-size:19px;font-weight:700;">🔒 Şifre Sıfırlama Talebi</div>
                <div style="opacity:0.85;font-size:13px;">Login sayfasından iletildi</div>
              </div>
              <div style="padding:22px; color:#111827; display:grid; row-gap:12px; column-gap:8px; font-size:15px;">
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:center;">
                  <div style="font-weight:600;color:#6b7280;">📧 E-posta</div><div>${email}</div>
                </div>
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:center;">
                  <div style="font-weight:600;color:#6b7280;">📞 Telefon</div><div>${phone || 'Belirtilmedi'}</div>
                </div>
                <div style="display:grid;grid-template-columns:130px 1fr;align-items:flex-start;">
                  <div style="font-weight:600;color:#6b7280;">📝 Not</div><div>${note?.trim() || 'Belirtilmedi'}</div>
                </div>
              </div>
              <div style="padding:14px 22px;border-top:1px solid #eef0f6;font-size:13px;color:#6b7280;">
                Lütfen kullanıcıyla iletişime geçip sıfırlama adımlarını paylaşınız.
              </div>
            </div>
          </div>
        `,
                text: `
VetCare - Şifre sıfırlama talebi

E-posta : ${email}
Telefon : ${phone || 'Belirtilmedi'}
Not     : ${note?.trim() || 'Belirtilmedi'}

Lütfen kullanıcıyla iletişime geçip sıfırlama adımlarını paylaşınız.
        `
            });

            res.status(200).json({ success: true, message: 'Talep iletildi' });
        } catch (error) {
            console.error('Şifre talebi mail hatası:', error);
            res.status(500).json({ message: 'Talep gönderilemedi', success: false });
        }
    });

}


export default methods;
