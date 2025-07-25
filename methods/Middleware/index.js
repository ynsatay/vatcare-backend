import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Token yoksa
  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  // Token varsa doğrula
  jwt.verify(token, 'secret', (err, user) => {
    if (err) {
      // Token süresi dolmuşsa veya geçersizse
      return res.status(403).json({ error: 'Token geçersiz veya süresi dolmuş', detail: err.message });
    }

    // Kullanıcı doğrulandıysa devam et
    req.user = user; // İstersen sonraki middleware'lerde kullanmak için ekleyebilirsin
    next();
  });
}

export default authenticateToken;
