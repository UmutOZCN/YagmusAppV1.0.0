# 🎯 Railway Deploy - KESİN ÇÖZÜM

## ⚠️ Sorun
Railway otomatik Docker kullanıyor ve frontend build etmeye çalışıyor.

## ✅ ÇÖZÜM (3 Adım)

### 1️⃣ Railway Dashboard'a Git

Railway.app → Project → Service (backend service'i)

### 2️⃣ Settings'i Aç

**Settings → General** sayfasına git

### 3️⃣ BU AYARLARI YAP:

```
┌─────────────────────────────────┐
│ Root Directory                  │
│ ┌─────────────────────────────┐ │
│ │ backend                     │ │ ← BURAYI DOLDUR
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Build Command                   │
│ ┌─────────────────────────────┐ │
│ │ npm install                  │ │ ← BACKEND'DE
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Start Command                   │
│ ┌─────────────────────────────┐ │
│ │ npm start                   │ │ ← BACKEND'DE
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**VEYA** Settings → **Builder** sekmesinde:
```
Builder: NIXPACKS (Docker değil!)
```

### 4️⃣ PostgresSQL Ekle

Service listesinde:
- **"+"** butonuna tıkla
- **"Add Database"** → **"Add PostgreSQL"**
- `DATABASE_URL` otomatik backend service'e bağlanır

### 5️⃣ Environment Variables Ekle

Backend service → **Variables** sekmesinde:
```
JWT_SECRET = (random güçlü key)
NODE_ENV = production
PORT = 5000
```

### 6️⃣ Deploy Et

**"Deploy"** butonuna bas veya **Settings**'ten **"Trigger Deploy"**

---

## 🎯 Alternatif: Service'i Sil ve Yeniden Oluştur

Eğer yukarıdaki ayarlar çalışmıyorsa:

1. Eski service'i **DELETE** et
2. **"+ New"** → **"Deploy from GitHub repo"**
3. Repository'yi seç
4. Hemen **Settings**'e git (Deploy etmeden önce!)

**Settings → Deploy:**
```
┌──────────────────────────────────┐
│ Root Directory                   │
│ backend ← ÖNEMLİ! Mutlaka bu!    │
└──────────────────────────────────┘
```

**Settings → Variables:**
```
JWT_SECRET = xxxxx
NODE_ENV = production
```

5. **"Create"** butonuna bas

6. PostgreSQL ekle (yukarıdaki gibi)

---

## ✅ BAŞARI KONTROLÜ

Deploy'dan sonra **Logs** sekmesine git ve şunu görmeli:

```
📦 Using PostgreSQL database
🔥 Yağmuş backend çalışıyor, port 5000
```

Eğer bunu görmüyorsan, hala yanlış ayarlar var demektir.

---

## 🎓 ÖNEMLİ NOT

**Railway SADECE backend için!**

Frontend'i **Netlify'da** deploy edeceksin:
- Railway: Backend API + PostgreSQL
- Netlify: Frontend React App

Her ikisi de ayrı deploy edilir, ayrı çalışır.

