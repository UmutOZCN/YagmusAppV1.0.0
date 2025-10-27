# Git Push Talimatları

## 1. Değişiklikleri Ekle

```bash
git add render.yaml
git add RENDER-CRITICAL-FIX.md
git add CHECK-RENDER-STATUS.md
```

## 2. Commit Yap

```bash
git commit -m "Fix Render build configuration - add rootDir"
```

## 3. Push Et

```bash
git push origin main
```

## 4. Render Otomatik Deploy

Render GitHub'a push olunca otomatik deploy eder.

---

**VEYA** Render Dashboard'da manuel ayarla (daha hızlı)!

