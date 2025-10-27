# 🚨 Render Express Hatası - Acil Çözüm

## Sorun
Render'da express modülü bulunamıyor. npm install çalışmıyor.

## ✅ Hızlı Çözüm: Render Dashboard'da Manuel Ayarla

### Backend Service Ayarları

1. Render → **YagmusAppV1.0.0** service → **Settings**

2. **General** sekmesinde:
   ```
   Root Directory: backend
   ```

3. **Build & Deploy** sekmesinde:
   ```
   Build Command: npm install
   Start Command: npm start
   ```

4. **Save Changes** butonuna bas

5. **Manual Deploy** → **Deploy latest commit**

---

## 🎯 Alternatif: GitHub Push

Dosyaları düzelttim. Şunu yap:

```bash
git add render.yaml
git commit -m "Fix Render build commands"
git push
```

Render otomatik redeploy eder.

---

## ✅ Başarı Kontrolü

Deploy'dan sonra **Logs** sekmesinde görmeli:

```
# npm install başarılı
📦 Using PostgreSQL database
VEYA
📦 Using SQLite database at: /data/database.db
🔥 Yağmuş backend çalışıyor, port 5000
```

---

## 🔧 Eğer Hala Çalışmıyorsa

### Cache'i temizle:

Render → Settings → **Build** sekmesi → **Clear build cache**

Sonra redeploy et.

