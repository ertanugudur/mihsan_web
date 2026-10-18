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
- **Site adresi ve Google doğrulaması:** `lib/site.ts` içindeki `url` ve `googleVerification`. `sitemap.xml` ve `robots.txt` (`app/sitemap.ts`, `app/robots.ts`) bu adresi kullanır.

## 3D koli modeli

Giriş bölümündeki koli gövdesi ve arka/yan kapaklar Blender'da modellenir:

```bash
pip install bpy            # Blender'ın Python modülü
python3 blender/build_box.py
```

Bu komut `public/models/koli.glb` (model) ve `public/models/koli_ao.png` (iç gölge haritası) dosyalarını yeniden üretir.
Ön kapak, oluklu katmanlarıyla birlikte `components/BoardScene.tsx` içinde üretilir; iki dosyadaki ölçüler aynı tutulmalıdır.
`KOLI_PREVIEW=1 python3 blender/build_box.py` ile kapalı, yarı açık ve açık önizleme görüntüleri de alınabilir.

## Fontlar

- Poppins (Light, Regular, Medium): metinlerin tamamı.
- TBJ Cinea Sans: oluk harfleri, süreç numaraları ve footer'daki büyük yazı. Demo sürümde Türkçe karakter olmadığı için yalnızca ASCII metinlerde kullanılır. Yayına almadan önce fontun web kullanım lisansını alın.

## Yayın

Vercel projesi: mihsan-ambalaj. Proje Git deposuna bağlı değil; yeni sürüm Vercel panelinden ya da `vercel --prod` ile yayınlanır.
