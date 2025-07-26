
import connection from "../knex/connection.js";
import authenticateToken from './Middleware/index.js';

function methodsanimals(app) {
    //Hayvan apileri
    app.get('/api/animals', authenticateToken, (req, res) => {

        connection.select().from('animals').then((animal) => {
            if (animal.length === 0) {
                console.log('Veri Bulunamadı');
                return res.status(400).json({ error: 'Veri Bulunamadı', status: 'error' });
            }

            return res.status(200).json({ status: 'success', response: animal });
        });

    });

    //Hayvan türleri apileri
    app.get('/api/animalsspecies', authenticateToken, (req, res) => {
        const { animal_id } = req.query;
        connection.select().from('animals_species').where('animal_id', animal_id).then((animalspec) => {
            if (animalspec.length === 0) {
                console.log('Veri Bulunamadı');
                return res.status(400).json({ error: 'Veri Bulunamadı', status: 'error' });
            }

            return res.status(200).json({ status: 'success', response: animalspec });
        }).catch(err => {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', status: 'error' });
        });
    });

    app.get('/api/animalslist', authenticateToken, (req, res) => {
        const { user_id } = req.query;
        const offId = req.user.off_id;
        connection
            .select('users_animals.*')
            .select('users_animals.id as data_id')
            .select('animals.name as animal_name')
            .select('animals_species.species_name as species_name')
            .select('animals_species.id as species_id')
            .select(connection.raw('DATE_FORMAT(users_animals.birthdate, "%Y-%m-%d") as birthdate')) // Yıl-ay-gün formatı için
            .select(connection.raw('DATE_FORMAT(users_animals.deathdate, "%Y-%m-%d") as deathdate')) // Yıl-ay-gün formatı için
            .select('users.name as user_name')
            .from('users_animals')
            .join('animals', 'users_animals.animal_id', 'animals.id')
            .join('animals_species', 'users_animals.animal_species_id', 'animals_species.id')
            .join('users', 'users_animals.user_id', 'users.id')
            .where('users_animals.user_id', user_id)
            .andWhere('users_animals.off_id', offId)
            .then((animal) => {

                return res.status(200).json({ status: 'success', response: animal });
            })
            .catch((err) => {
                console.error('Veritabanı hatası:', err);
                res.status(500).json({ error: 'Veritabanı hatası', status: 'error' });
            });
    });

    app.delete('/api/animalslistDel/:id', authenticateToken, (req, res) => {
        const { id } = req.params;

        connection('users_animals')
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


    app.put('/api/animalslistUpdate/:id', authenticateToken, async (req, res) => {
        const id = req.params.id;
        const { animal_id, user_id, animal_species_id, birthdate, deathdate, animalidentnumber, picture, isdeath, active, animalname } = req.body;

        try {
            await connection('users_animals')
                .where({ id: id })
                .update({
                    user_id: user_id,
                    animal_id: animal_id,
                    animal_species_id: animal_species_id,
                    birthdate: birthdate,
                    deathdate: deathdate === "" ? null : deathdate,
                    animalidentnumber: animalidentnumber,
                    picture: picture,
                    isdeath: isdeath === "" ? false : isdeath,
                    active: active,
                    animalname: animalname
                });

            return res.status(200).json({ status: 'success', message: 'Update operation completed.' });
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error', status: 'error', details: error.message });
        }
    });

    app.post('/api/animalpost', authenticateToken, async (req, res) => {
        try {
            const offId = req.user.off_id;

            let {
                user_id,
                animal_id,
                animal_species_id,
                birthdate,
                deathdate,
                animalidentnumber,
                picture,
                isdeath,
                animalname,
            } = req.body;

            // Tip dönüşümü
            user_id = Number(user_id);
            animal_id = Number(animal_id);
            animal_species_id = Number(animal_species_id);

            // Tarih boşsa null yap
            deathdate = deathdate || null;
            picture = picture || null;

            if (!animalidentnumber) {
                animalidentnumber = Math.floor(100000 + Math.random() * 900000).toString();
            }

            if (!user_id || !animal_id || !animal_species_id) {
                return res.status(400).json({
                    error: 'user_id, animal_id or animal_species_id is missing',
                    status: 'error'
                });
            }

            if (!animalname) {
                console.warn('Hayvan adı eksik!');
            }

            isdeath = deathdate ? 1 : 0;

            await connection('users_animals').insert({
                user_id,
                animal_id,
                animal_species_id,
                birthdate,
                deathdate,
                animalidentnumber,
                picture,
                active: 1,
                isdeath,
                animalname,
                off_id: offId 
            });

            console.log("Hayvan adı veritabanına eklendi:", animalname);

            return res.status(200).json({
                status: 'success',
                message: 'Kayıt işlemi tamamlandı.',
                animalidentnumber
            });

        } catch (error) {
            console.error('Sunucu hatası:', error);
            if (error.sqlMessage) console.error('SQL Hatası:', error.sqlMessage);
            return res.status(500).json({
                error: 'Server error',
                status: 'error'
            });
        }
    });

}

export default methodsanimals;
