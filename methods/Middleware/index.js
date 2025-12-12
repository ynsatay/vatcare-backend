import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// ESM için __dirname oluştur
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ENV'den public key konumunu al
const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

// Anahtar dosyası kontrolü
if (!publicKeyPath || !fs.existsSync(publicKeyPath)) {
  console.error("❌ JWT Public Key bulunamadı! JWT doğrulama yapılamaz.");
  process.exit(1);
}

// public key yükle
const publicKey = fs.readFileSync(publicKeyPath, "utf8");

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token gerekli',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token geçersiz veya süresi dolmuş',
        code: 'TOKEN_INVALID'
      });
    }

    req.user = user;
    next();
  });
}

export default authenticateToken;