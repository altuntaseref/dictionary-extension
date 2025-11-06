# Dictionary Frontend

React + Vite frontend uygulaması. Cloudflare Pages için hazırlanmıştır.

## Kurulum

1. Bağımlılıkları kur:
```bash
npm install
```

2. `.env` dosyası oluştur:
```bash
cp .env.example .env
```

3. `.env` dosyasını doldur:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://127.0.0.1:8787
```

## Geliştirme

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare Pages Deploy

1. Cloudflare Pages'e git
2. GitHub repo'nu bağla
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`
4. Environment variables ekle:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (production backend URL'i)
