# Yağmuş - Deployment Guide

## Netlify ve Backend Deployment

Yağmuş uygulamanızı internete yüklemek için aşağıdaki adımları izleyin.

### 1. Backend'i Render.com'a Deploy Etme

Backend'inizi Render.com'da host edin:

1. **Hesap Oluşturma:**
   - https://render.com adresine gidin
   - GitHub hesabınızla giriş yapın

2. **Repository Hazırlama:**
   ```bash
   git init
   git add .
   git commit -m "Yağmuş initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

3. **Render.com'da Servis Oluşturma:**
   - Render.com dashboard'a gidin
   - "New +" butonuna tıklayın
   - "Web Service" seçin
   - Repository'yi bağlayın

4. **Ayarları Yapılandırma:**
   - **Name:** yagmus-backend
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables ekleyin:**
     ```
     JWT_SECRET=your-very-secure-secret-key-change-this
     NODE_ENV=production
     ```

5. **Deploy:** "Create Web Service" butonuna tıklayın

Backend'iniz çalışmaya başladıktan sonra URL'yi not edin (örn: `https://yagmus-backend.onrender.com`)

### 2. Frontend'i Netlify'a Deploy Etme

1. **Build Oluşturma:**
   Backend URL'nizi frontend'e ekleyin:

   `frontend/src/App.js` dosyasında:
   ```javascript
   axios.defaults.baseURL = 'https://yagmus-backend.onrender.com';
   ```

2. **Build Komutu:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Netlify'da Deploy:**
   - https://netlify.com adresine gidin
   - "Add new site" → "Deploy manually"
   - `frontend/build` klasörünü sürükleyip bırakın
   - Veya Git repository'yi bağlayın ve otomatik deploy ayarlayın

4. **URL ve Ayarlar:**
   - Netlify size bir URL verecek (örn: `https://yagmus.netlify.app`)
   - Site ayarlarında "Build command" için: `cd frontend && npm run build`
   - "Publish directory" için: `frontend/build`

### Alternatif: Backend'i Railway.app'de Deploy Etme

1. https://railway.app adresine gidin
2. GitHub hesabınızla giriş yapın
3. "New Project" → "Deploy from GitHub repo"
4. Repository'yi seçin
5. Ayarları düzenleyin:
   - **Root Directory:** backend
   - **Start Command:** `node server.js`
   - Environment variables ekleyin (JWT_SECRET vb.)

### CORS Ayarları

Backend'de CORS'u frontend domain'inize izin verecek şekilde güncelleyin:

```javascript
app.use(cors({
  origin: 'https://your-netlify-url.netlify.app',
  credentials: true
}));
```

### Database

SQLite kullanıyoruz, bu local bir database. Production için daha iyi bir seçenek:
- **Render.com:** Otomatik olarak SQLite kullanır
- **Railway.app:** PostgreSQL önerilir (ekstra setup gerekir)

### Önemli Notlar

- Backend URL'yi frontend'de düzgün şekilde güncelleyin
- Her iki kullanıcıyı da kaydetmeden siteyi kapatmayın
- Database dosyası (`database.db`) Heroku/Render'da kalıcı olarak saklanır
- JWT_SECRET'ı güçlü ve rastgele bir değer yapın

### Desteklenen Platformlar

✅ **Netlify** - Frontend için (Bedava)
✅ **Render.com** - Backend için (Bedava, sınırlı)
✅ **Railway.app** - Backend için (Bedava kredi ile başlar)
✅ **Vercel** - Frontend için (Bedava)

### Domain Bağlama

Netlify'da ücretsiz domain alabilirsiniz veya kendi domain'inizi bağlayabilirsiniz:
- Netlify Dashboard → Site settings → Domain management
- "Add custom domain" ile kendi domain'inizi ekleyin

### SSL Certificate

Netlify ve Render.com otomatik olarak SSL sertifikası sağlar. HTTPS ile güvenli çalışır.

## Hızlı Başlangıç

Deploy etmek için:
```bash
# 1. Backend'i Render.com'da deploy et
# 2. Backend URL'sini not et
# 3. Frontend'de App.js'de backend URL'sini güncelle
# 4. Frontend'i Netlify'da deploy et
# 5. Hazırsın! 🔥
```

---

**Sorularınız için:** GitHub Issues oluşturabilirsiniz.

