import connection from "../knex/connection.js";
import authenticateToken from "./Middleware/index.js";
import blockDemoUser from "./Middleware/blockDemoUser.js";

function methodsoffices(app) {
  // Office apileri

  app.get('/api/officelist', authenticateToken, (req, res) => {
    connection
      .select('hr_offices.*')
      .select('clinic.name as clinic_name')
      .select(connection.raw("CONCAT(users.name, ' ', users.surname) as admin_name"))
      .from('hr_offices')
      .join('clinic', 'hr_offices.clinic_id', 'clinic.id')  
      .join('users', 'hr_offices.admin_id', 'users.id')    
      .then((office) => {
        return res.status(200).json({ status: 'success', response: office });
      })
      .catch((err) => {
        console.error('Veritabanı hatası:', err);
        res.status(500).json({ error: 'Veritabanı hatası', status: 'error' });
      });
  });

  app.delete('/api/officelistdel/:id', authenticateToken, blockDemoUser, (req, res) => {
    const { id } = req.params;

    connection('hr_offices')
      .where({ id })
      .del()
      .then((deletedCount) => {
        if (deletedCount === 0) {
          return res.status(404).json({ error: `ID'si ${id} olan ofis bulunamadı.`, status: 'error' });
        }
        return res.status(200).json({ status: 'success', message: `ID'si ${id} olan ofis başarıyla silindi.` });
      })
      .catch((err) => {
        console.error('Veritabanı hatası:', err);
        res.status(500).json({ error: 'Veritabanı hatası', status: 'error' });
      });
  });

  app.put('/api/officelistUpdate/:id', authenticateToken, blockDemoUser, async (req, res) => {
    const id = req.params.id;
    const { clinic_id, user_id, package_type, email, phone } = req.body;
    try {
      await connection('hr_offices')
        .where({ id: id })
        .update({
          clinic_id: clinic_id,
          package_type: package_type,
          admin_id: user_id,   
          email: email,
          phone: phone,
        });

      return res.status(200).json({ status: 'success', message: 'Update operation completed.' });
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error', status: 'error', details: error.message });
    }
  });

  app.post('/api/officepost', authenticateToken, blockDemoUser, async (req, res) => {
    try {
      const { clinic_id, user_id, package_type, email, phone } = req.body;
      if (!clinic_id || !user_id || !package_type || !email || !phone) {
        return res.status(400).json({ error: 'Bütün alanları doldurunuz', status: 'error' });
      }

      connection('hr_offices').insert({
        clinic_id: clinic_id,
        package_type: package_type,
        admin_id: user_id,   
        email: email,
        phone: phone,
      }).then(() => {
        var response = {
          status: 'success',
          message: 'Kayıt işlemi tamamlandı.',
        }
        return res.status(200).json(response);
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

export default methodsoffices;
