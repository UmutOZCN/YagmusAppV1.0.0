# 🚨 Railway Deploy - HIZLI ÇÖZÜM

## Sorun
Railway root'ta build yapıyor ama frontend bulamıyor.

## ✅ ÇÖZÜM (2 Dakika)

### Railway Dashboard'da:

1. **Service Settings** sayfasına git

2. **Settings → General** bölümüne git:
   ```
   Root Directory: backend
   ```

3. **Settings → Deploy** bölümüne git:
   ```
   Build Command: npm install
   Start Command: npm start
   ```

4. **Save** butonuna tıkla

5. **Manual Deploy** veya push bir değişiklik yap

---

## 🎯 Alternatif: Service Yeniden Oluştur

Eğer düzgün çalışmıyorsa:

1. Eski service'i sil
2. **New Service** → **Deploy from GitHub repo**
3. Repository seç
4. **Settings**'te:
   - **Root Directory**: `backend` (EN ÖNEMLİSİ!)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Deploy** butonuna bas

---

## 🔍 Kontrol

Deploy'dan sonra logs'ta görmeli:
```
📦 Using PostgreSQL database
🔥 Yağmuş backend çalışıyor, port 5000
```

Eğer bunu görmüyorsan, hala sorun var demektir.

