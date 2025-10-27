# ⚠️ ÖNEMLİ: Railway Deploy Ayarları

## Railway Dashboard'da Şunları Yap:

### 1. Service Settings

**Backend Service** için:
```
Settings → General:
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start

Settings → Deploy:
- Builder: NIXPACKS (Docker değil!)
```

### 2. Eğer Hata Alıyorsan:

**Option A - Manual Override:**

Railway dashboard'da:
```
Settings → Build:
- Root Directory: "backend"
- Build Command: "npm install"
- Start Command: "npm start"

Settings → Variables:
- DATABASE_URL: (PostgreSQL'den otomatik)
- JWT_SECRET: (sen ekle)
- NODE_ENV: production
- PORT: 5000
```

**Option B - Service Yeniden Oluştur:**

Eski service'i sil, yeni oluştur:
```
New Service → GitHub Repo:
- Repository: seç
- Root Directory: backend ⚠️ (BURASI ÖNEMLİ!)
- Build Command: npm install
- Start Command: npm start
```

### 3. PostgreSQL Bağlantısı

PostgreSQL service ekledikten sonra:
- Backend service'e git
- Variables sekmesinde
- "Add Variable" veya PostgreSQL'in `DATABASE_URL`'ini kullan
- Railway otomatik ekler

---

## 🎯 Doğru Yapı

```
Railway Project:
├── [Backend Service]
│   ├── Root: backend/
│   ├── Build: npm install
│   ├── Start: npm start
│   └── Variables:
│       ├── DATABASE_URL (auto)
│       ├── JWT_SECRET
│       ├── NODE_ENV=production
│       └── PORT=5000
│
└── [PostgreSQL Service]
    └── DATABASE_URL otomatik inject edilir
```

**NOT:** Frontend Railway'de deploy edilmez! Netlify'da deploy edilir.

