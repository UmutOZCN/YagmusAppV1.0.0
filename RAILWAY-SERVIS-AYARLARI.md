# 🎯 Railway - Root Directory Nerede?

## ⚠️ Yanlış Yerdesin!

Şu anda **Project Settings** → **General** sekmindesin. Burada Root Directory yok!

## ✅ Doğru Yer

### Adım 1: Sol Menüden Backend Service'i Seç

Proje ana sayfasına dön (Project Settings değil).

Sol menüde şunları görüyor olmalısın:
- [Project ana sayfası]
  - [Backend service] ← BUNA TIKLA!
  - [PostgreSQL] (varsa)

### Adım 2: Backend Service → Settings

Backend service'e tıkla, sonra **Settings** sekmesine git.

### Adım 3: General Sekmesinde Root Directory Var

Settings → General'da şunu bulacaksın:
```
Root Directory:
[input field]
```

Buraya `backend` yaz!

### Alternatif: İlk Sayfadan

1. Railway → Project ana sayfasına dön
2. Services listesinde Backend service'i bul
3. Backend service'e tıkla (kartın üzerine tıkla)
4. Settings → General sekmesi
5. Root Directory: `backend` yaz

## 📸 Doğru Yer

```
Project (lucid-expression)
├── Services
│   ├── [Backend Service] ← BUNA TIKLA!
│   │   ├── Deployments
│   │   ├── Settings ← BURADAN DEVAM ET
│   │   │   └── General → Root Directory
│   │   └── Variables
│   └── [PostgreSQL]
```

---

**Service Settings ≠ Project Settings**

Root Directory ayarı **Service Settings**'te, **Project Settings**'te değil!

