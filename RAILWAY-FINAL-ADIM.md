# 🎯 Railway - YAPMAN GEREKEN SON ADIM

## ✅ Start Command Doğru!

Start Command zaten doğru: `cd backend && npm start`

## ⚠️ EKSİK: Root Directory!

Root Directory ayarı eksik. Şunu yap:

### Adım 1: General Sekmesine Git

Railway → Backend Service → **Settings** → **General** sekmesi

### Adım 2: Root Directory'yi Değiştir

Şu anda muhtemelen şöyle:
```
Root Directory: (empty veya .)
```

Bunu şuna değiştir:
```
Root Directory: backend
```

**⚠️ ÖNEMLİ:** `backend` yazmalısın (tırnak işaretleri olmadan)

### Adım 3: Save

Save/Apply değişiklikleri kaydet.

### Adım 4: Deploy

**Manual Deploy** veya otomatik deploy bekle.

---

## ✅ BAŞARI

Logs'ta şunu görmeli:
```
📦 Using PostgreSQL database
🔥 Yağmuş backend çalışıyor, port 5000
```

---

## 🔍 Kontrol

Eğer logs'ta hala `/app/backend/server.js` görüyorsan:
- Root Directory hala "." veya boş
- General sekmesine git ve `backend` yaz

