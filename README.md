# Yağmuş 🔥💕

Yağmur ve senin için özel bir günlük not uygulaması.

## Özellikler

- 🔐 Sadece 2 kullanıcı için güvenli kimlik doğrulama
- 📝 Her gün not gönderme
- 🔥 Gün serisi takibi (consecutive days)
- 🕛 Otomatik yarım gece sıfırlama
- 💝 Özel ve güvenli

## Başlangıç

### Kurulum

```bash
npm run install-all
```

veya setup script'ini çalıştırın:

```bash
.\setup.ps1
```

### Uygulamayı Çalıştırma

Frontend ve backend'i birlikte başlatın:

```bash
npm run dev
```

Backend `http://localhost:5000` adresinde çalışacak  
Frontend `http://localhost:3000` adresinde çalışacak

## İlk Kurulum

Uygulamayı ilk kez çalıştırdığınızda:
1. İki hesap kaydedin (bir senin, bir Yağmur'un)
2. Her gün not göndererek serinizi başlatın!

## Teknoloji Stack

- **Frontend:** React
- **Backend:** Node.js/Express
- **Database:** SQLite
- **Authentication:** JWT

## Deployment

Uygulamayı internete yüklemek için `DEPLOY.md` dosyasını okuyun.

## Nasıl Çalışır?

1. İlk gün, her iki kullanıcı da not gönderir (seri başlar: 1 gün)
2. İkinci gün, her ikisi de yeniden not gönderir (seri devam eder: 2 gün)
3. Eğer bir kişi not göndermezse, seri bozulmaz ama ertesi gün yeniden başlatır
4. Seri ancak her iki kullanıcı da peş peşe notlarını gönderirse artar
5. Notlar geçmişte kalır ve tüm not geçmişi görüntülenebilir

## Önemli Not

**Sadece 2 kullanıcı kayıt olabilir!** İlk iki kayıt olan kullanıcı dışında kimse daha kayıt olamaz.

## Kullanım

1. `http://localhost:3000` adresini açın
2. İlk kullanıcı olarak kayıt olun
3. İkinci kullanıcı olarak kayıt olun
4. Her gün giriş yapıp notunuzu gönderin
5. Serinizi koruyun ve aşkınızı taze tutun! 🔥💕

---

**Deployment için:** Detaylı bilgi için `DEPLOY.md` dosyasına bakın.
