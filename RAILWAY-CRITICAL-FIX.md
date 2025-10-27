# 🚨 KRİTİK: Railway npm install Hatası

## Sorun
Railway backend klasöründe npm install yapmıyor, bu yüzden modules bulunamıyor.

## ✅ HIZLI ÇÖZÜM

### Railway Dashboard'da Şunu Yap:

**Settings → Deploy** sayfasında:

```
Build Command: cd backend && npm install
Start Command: cd backend && npm start
```

---

## 🎯 DOĞRU RAILWAY AYARLARI

### Option A: Service Settings (Manuel)

1. Railway → Backend Service → **Settings**
2. **Settings → General:**
   ```
   Root Directory: backend
   ```
3. **Settings → Deploy:**
   ```
   Build Command: npm install
   Start Command: npm start
   ```

### Option B: railway.json kullan

Railway.json şu şekilde:
```json
{
  "deploy": {
    "buildCommand": "cd backend && npm install",
    "startCommand": "cd backend && npm start"
  }
}
```

**Git push yap:**
```bash
git add railway.json
git commit -m "Fix Railway build command"
git push
```

Railway otomatik redeploy eder.

---

## ✅ BAŞARILI DEPLOY KONTROLÜ

Logs'ta şunları görmeli:

```
Installing dependencies...
# npm install başarılı
Starting backend...
📦 Using PostgreSQL database
🔥 Yağmuş backend çalışıyor, port 5000
```

---

## 🔧 Alternatif: Railway Dashboard'da Manuel Override

Eğer hala çalışmıyorsa:

1. Service Settings
2. **"Variables"** sekmesi
3. **"Clear build cache"** butonuna tıkla
4. **"Redeploy"** butonuna tıkla

