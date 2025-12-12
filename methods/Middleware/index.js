import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// ESM için __dirname oluştur
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// public key yükle
const publicKey = fs.readFileSync(
  path.join(__dirname, "../../keys/public.pem"),
  "utf8"
);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token gerekli', code: 'TOKEN_MISSING' });
  }

  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token geçersiz veya süresi dolmuş',
        code: 'TOKEN_INVALID',
        detail: err.message
      });
    }

    req.user = user;
    next();
  });
}

export default authenticateToken;
