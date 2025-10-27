# 🚨 Railway Deploy - ACİL ÇÖZÜM

## ⚠️ Kritik Sorun
Railway backend klasöründe npm install yapmıyor!

## ✅ TEK ÇÖZÜM

### Railway Dashboard'da BU AYARLARI YAP:

1. Railway → Project → Backend Service
2. **Settings** sekmesi
3. **Settings → General:**
   ```
   Root Directory: backend
   ⚠️ ÖNEMLİ: Bu "backend" olmalı!
   ```

4. **Settings → Deploy:**
   ```
   Build Command: npm install
   Start Command: npm start
   ```

5. **Save Changes**
6. **Manual Deploy** veya **Trigger Deploy**

---

## 🔍 Hata Kontrolü

Eğer hala hatayı görüyorsan, logs'a bak:

```
/app/backend/server.js
```

Bu, Railway'nin hala root'ta çalıştığını gösterir. Root Directory'nin **backend** olup olmadığını kontrol et.

---

## 🎯 Alternatif: Service'i Yeniden Oluştur

1. Eski service'i **DELETE** et
2. **"+ New"** → **"Deploy from GitHub repo"**
3. Repository seç
4. **Settings**'i AÇ (deploy etmeden önce!)
5. **Root Directory**: `backend` yaz
6. **Deploy** et

---

## ✅ BAŞARI

Logs'ta şunu görmeli:
```
npm install...
📦 Using PostgreSQL database
🔥 Yağmuş backend çalışıyor, port 5000
```

**ANCAK** eğer **"/app/backend/server.js"** görüyorsan, hala root'ta çalışıyor demektir. Root Directory'yi ayarla!

