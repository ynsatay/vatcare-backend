import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token geçersiz veya süresi dolmuş' });
    }

    req.user = user;
    next();
  });
}

export default authenticateToken;
