# 🎯 Railway Deploy - Kesin Çözüm (Adım Adım)

## ⚠️ Sorun
Railway'de "Cannot find module 'express'" hatası alıyorsun.

## ✅ ÇÖZÜM

### Adım 1: Git Push

`railway.json` dosyasını güncelledim. Şunu yap:

```bash
git add railway.json
git commit -m "Fix Railway build commands"
git push origin main
```

### Adım 2: Railway Dashboard'da Ayarla

Railway Dashboard → Backend Service → **Settings**:

#### **Settings → General:**
```
Root Directory: backend
```

#### **Settings → Deploy:**
```
Build Command: npm install
Start Command: npm start
```

**VEYA** railway.json'u kullan (önerilen):
```
Build Command: cd backend && npm install  
Start Command: cd backend && npm start
```

### Adım 3: PostgreSQL Ekle

Railway'de PostgreSQL service var mı kontrol et:
- Varsa, backend service'e `DATABASE_URL` variable'ı bağla
- Yoksa: **"+ New"** → **"Add PostgreSQL"**

### Adım 4: Environment Variables

Backend Service → **Variables** → Add:
```
JWT_SECRET = (random güçlü key)
NODE_ENV = production
PORT = 5000
```

### Adım 5: Deploy

**"Manual Deploy"** veya automatic deploy bekle.

---

## ✅ BAŞARI KONTROLÜ

Deploy sonrası **Logs** sekmesinde görmeli:

```
npm install başarılı
📦 Using PostgreSQL database
🔥 Yağmuş backend çalışıyor, port 5000
```

---

## 🔧 Sorun Giderme

### Hala express bulunamıyor?

1. Build Cache'i temizle
2. Service'i DELETE et
3. Yeniden oluştur:
   - Root Directory: **backend** ← ÖNEMLİ!
   - Build Command: `npm install`
   - Start Command: `npm start`

### PostgreSQL bağlanmıyor?

Backend service → Variables → `DATABASE_URL` var mı kontrol et.
Yoksa PostgreSQL service'ten bağla.

