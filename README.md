# Mihsan Ambalaj web sitesi

Next.js (App Router) ile yazılmış, sadece frontend olan tek sayfalık firma sitesi.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # üretim derlemesi
```

## Sık değişen yerler

- **Telefon, WhatsApp, e-posta, adres:** `lib/site.ts`. Boş bırakılan alanlar sitede görünmez. WhatsApp numarası girilince teklif formu talebi WhatsApp'a, yalnızca e-posta girilirse e-postaya gönderir.
- **Ürün metinleri:** `components/Products.tsx`
- **Oluk tipleri tablosu:** `components/Flutes.tsx`
- **Renkler ve tipografi:** `app/globals.css` içindeki `:root` değişkenleri
- **Logolar:** `public/logo/`

## Fontlar

- Poppins (Light, Regular, Medium): metinlerin tamamı.
- TBJ Cinea Sans: oluk harfleri, süreç numaraları ve footer'daki büyük yazı. Demo sürümde Türkçe karakter olmadığı için yalnızca ASCII metinlerde kullanılır. Yayına almadan önce fontun web kullanım lisansını alın.

## Yayın

Vercel'e bağlı. `main` dalına gönderilen her değişiklik otomatik yayınlanır.
