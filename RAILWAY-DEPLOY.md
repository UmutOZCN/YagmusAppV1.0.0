# Railway'de Deploy Etme Rehberi

## 🚀 Railway'de Backend ve Database Kurulumu

Bu rehber, Yağmuş uygulamanızı Railway'de PostgreSQL ile deploy etmenize yardımcı olur.

### Ön Koşullar

- Railway hesabı (https://railway.app)
- GitHub hesabı
- Proje GitHub'da yüklü olmalı

## Adım 1: Railway'de Yeni Proje Oluşturma

1. https://railway.app adresine gidin
2. GitHub hesabınızla giriş yapın
3. "New Project" butonuna tıklayın
4. "Deploy from GitHub repo" seçin
5. Repository'nizi seçin ve "Deploy" yapın

## Adım 2: PostgreSQL Database Ekleme

Railway otomatik olarak bir service oluşturdu. Şimdi PostgreSQL database ekleyelim:

1. Railway dashboard'da projenize gidin
2. "+ New" butonuna tıklayın
3. "Database" → "Add PostgreSQL" seçin
4. Database otomatik oluşturulacak

## Adım 3: Backend Service'ini Konfigüre Etme

1. Backend service'e tıklayın
2. **Settings** sekmesine gidin:

### Environment Variables Ekle:

```
JWT_SECRET=your-very-secure-secret-key-change-this-in-production
NODE_ENV=production
PORT=5000
```

### PostgreSQL Connection:

Database'in variables sayfasında `DATABASE_URL` otomatik olarak ayarlanır. Bu backend'e otomatik olarak inject edilir.

## Adım 4: Service Bağlantısını Ayarlama

1. Backend service'de "Settings" → "Variables"
2. "Reference Variable" butonuna tıklayın
3. PostgreSQL database'i seçin
4. `DATABASE_URL` seçin

Bu otomatik olarak backend'e PostgreSQL connection string'ini sağlayacak.

## Adım 5: Deploy

Railway otomatik olarak deploy edecek. İlerlemeyi "Deployments" sekmesinden takip edin.

### Logs Kontrolü:

Logs'ta şunu görmelisiniz:
```
📦 Using PostgreSQL database
🔥 Yağmuş backend çalışıyor, port 5000
```

## Adım 6: Frontend'i Netlify'da Ayarlama

1. Netlify'da frontend projenize gidin
2. **Site settings** → **Environment variables**
3. Ekle:
   ```
   REACT_APP_API_URL=https://your-railway-backend.up.railway.app
   ```
4. "Trigger deploy" → "Clear cache and deploy"

## Adım 7: Test Etme

1. Frontend URL'nizi açın
2. İlk kullanıcıyı kaydedin (sen)
3. İkinci kullanıcıyı kaydedin (Yağmur)
4. Login yapın ve not gönderin

## Sorun Giderme

### Database bağlanmıyor

Railway logs'unda şunu kontrol edin:
```
📦 Using PostgreSQL database
```

Eğer görmüyorsanız, backend service'in "Variables" sayfasında `DATABASE_URL` olup olmadığını kontrol edin.

### CORS hatası

Backend'de CORS ayarları zaten herkese açık. Eğer yine de CORS hatası alırsanız:

Backend service → Settings → Networking → Public URL
Bu URL'yi kopyalayın ve Netlify'da environment variable olarak ayarlayın.

### Users kayboluyor

PostgreSQL kullanıyorsanız veriler kalıcı. Eğer hala kaybolursa:

1. Railway dashboard'da PostgreSQL service'e gidin
2. "Data" sekmesinde tabloları kontrol edin
3. Settings'te database'in reset edilmediğinden emin olun

## Önemli Notlar

- ✅ PostgreSQL verileri kalıcıdır (SQLite'tan farklı)
- ✅ Railway otomatik bağlantı sağlar (`DATABASE_URL`)
- ✅ İlk deploy'dan sonra iki kullanıcı kaydı yapmanız gerekir
- ✅ Backend URL değişirse Netlify'daki environment variable'ı güncelleyin

## Railway vs Render Farkları

| Özellik | Render | Railway |
|---------|--------|---------|
| Database | SQLite + Persistent Disk | PostgreSQL (Managed) |
| Disk Setup | Manuel mount gerekiyor | Otomatik |
| Connection | Manuel env var | Otomatik bağlantı |
| Kolaylık | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

Railway'de PostgreSQL kullanmak daha kolay ve güvenilirdir.

