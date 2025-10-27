# Database Sorununu Düzeltme

## Sorun Ne?

Backend'inizde veritabanı çalışmıyor çünkü SQLite dosyası `/tmp` klasöründe tutuluyordu ve bu klasör Render'da kalıcı değil. Her deployment veya restart sırasında veriler kayboluyordu.

## Yapılan Değişiklikler

### 1. **render.yaml** - Persistent Disk Eklendi
```yaml
disk:
  name: yagmus-db-disk
  mountPath: /data
  sizeGB: 1
```

Bu, Render'a kalıcı bir 1GB disk alanı ekler. Veritabanı dosyanız artık bu diskte tutulacak ve kaybolmayacak.

### 2. **backend/server.js** - Database Path Güncellendi
- Production'da database `/data/database.db` konumunda tutulacak
- Bu konum kalıcı ve yeniden başlatmalarda korunur
- Development'ta hala `./database.db` kullanılıyor

### 3. **Environment Variable**
```yaml
DATABASE_PATH=/data
```

## Nasıl Deploy Edilir?

### 1. Render Dashboard'da Değişiklikleri Uygula

#### A. Backend Service'ini Güncelle:

1. Render.com'da backend servisinize gidin
2. "Settings" sekmesine tıklayın
3. **"Add Disk"** butonuna tıklayın veya mevcut diske tıklayın:
   - **Disk Name:** `yagmus-db-disk`
   - **Mount Path:** `/data`
   - **Size:** `1 GB`
4. Environment Variables bölümüne gidin ve ekleyin:
   - **Key:** `DATABASE_PATH`
   - **Value:** `/data`
5. "Apply changes" butonuna tıklayın

#### B. Manual Deploy Yapın:

Veya, değişiklikleri GitHub'a push edin:

```bash
git add .
git commit -m "Fix database persistence issue"
git push origin main
```

Render otomatik olarak deploy edecek.

### 2. İlk Kayıt Oluştur

Deploy'dan sonra, yeni kalıcı database ile ilk kayıtları oluşturun:

1. Netlify frontend URL'nizi açın
2. İlk kullanıcıyı kaydedin (sen)
3. İkinci kullanıcıyı kaydedin (Yağmur)

### 3. Test Et

- Login yapın
- Not gönderin
- Logout olup tekrar login yapın
- Data hala orada mı kontrol edin

## Önemli Notlar

- ✅ Database artık kalıcı
- ✅ Restart sırasında veriler korunur
- ✅ Her deployment'da veriler korunur
- ⚠️ İlk deploy'dan sonra tekrar kayıt olmanız gerekecek (database reset oldu)

## Sorun Devam Ederse

Eğer hala çalışmıyorsa:

1. Render dashboard'da backend service'in "Logs" sekmesine bakın
2. Database path'in doğru olduğunu kontrol edin:
   ```
   📦 Production database path: /data/database.db
   ```
3. Disk bağlantısını kontrol edin:
   - Settings → Disks → `yagmus-db-disk` görünüyor mu?
   - Mount path `/data` olarak ayarlanmış mı?

## Destek

Sorun devam ederse, Render'ın "Observability" sekmesine bakarak database dosyasının gerçekte nerede oluştuğunu görebilirsiniz.

