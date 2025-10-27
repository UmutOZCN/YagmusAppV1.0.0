# Yağmuş - Database Reset Script
# Bu script mevcut veritabanını siler ve yeni kullanıcılar oluşturabilmeniz için sıfırlar

Write-Host "🔥 Yağmuş - Veritabanı Sıfırlama" -ForegroundColor Cyan
Write-Host ""

$dbPath = "backend\database.db"
$dbJournal = "backend\database.db-journal"

if (Test-Path $dbPath) {
    Write-Host "Veritabanı bulundu ve siliniyor..." -ForegroundColor Yellow
    Remove-Item $dbPath -Force
    Write-Host "✅ Veritabanı silindi!" -ForegroundColor Green
}

if (Test-Path $dbJournal) {
    Remove-Item $dbJournal -Force
    Write-Host "✅ Journal dosyası silindi!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Veritabanı sıfırlandı. Backend'i başlattığınızda yeni bir veritabanı oluşturulacak." -ForegroundColor Cyan
Write-Host ""
Write-Host "Şimdi yeni kullanıcılar oluşturabilirsiniz!" -ForegroundColor Green
Write-Host ""

