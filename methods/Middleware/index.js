import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  const token = req.cookies.token;  // Cookie'den token al

  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  jwt.verify(token, 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token geçersiz veya süresi dolmuş', detail: err.message });
    }

    req.user = user;
    next();
  });
}

export default authenticateToken;
