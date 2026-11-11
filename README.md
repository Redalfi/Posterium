# Posterium: sayt + admin panel

Express + SQLite. Posterlər admin paneldə əlavə olunur və sayt onları dərhal göstərir.

## Tələblər
- Node.js 22.13 və ya daha yeni (24 LTS tövsiyə olunur): https://nodejs.org
- Əlavə verilənlər bazası quraşdırmaq lazım deyil, SQLite Node.js-in içindədir.

## İşə salmaq
1. Qovluğu VS Code-da açın (File > Open Folder).
2. Terminalda (Ctrl+`):
   ```
   npm install
   npm start
   ```
3. Brauzerdə:
   - Sayt: http://localhost:3000
   - Admin: http://localhost:3000/admin

`npm run dev` faylı dəyişdikcə serveri avtomatik yenidən başladır.

## Ayarlar (.env faylı)
| Açar | Mənası |
|---|---|
| ADMIN_USER / ADMIN_PASSWORD | Admin girişi |
| SESSION_SECRET | Uzun təsadüfi mətn. Canlıya çıxmazdan əvvəl mütləq dəyişin |
| WHATSAPP_NUMBER | Sifarişlərin gedəcəyi nömrə, ölkə kodu ilə, + işarəsiz (məs. 994501234567) |
| PORT | Port (standart 3000) |

Canlıya çıxmazdan əvvəl parolu mütləq dəyişin. `.env` faylını heç yerə yükləməyin (git-ə də).

## Qovluq quruluşu
```
server.js        API, giriş, şəkil yükləmə
db.js            SQLite cədvəli
public/          ictimai sayt (index.html, css/, js/)
admin/           admin panel (index.html, admin.css, admin.js)
data/            baza faylı (avtomatik yaranır)
uploads/         yüklənmiş poster şəkilləri (avtomatik yaranır)
```

## Canlıya çıxarmaq (posterium.az)
Node.js işlədə bilən hostinq lazımdır (VPS, Render, Railway və s.).
- `data/` və `uploads/` qovluqları qalıcı diskdə olmalıdır, əks halda yenidən başlayanda silinər.
- HTTPS qoşun (host adətən özü verir).
- Bu qovluqların ehtiyat nüsxəsini mütəmadi götürün: `data/posterium.db` və `uploads/`.
