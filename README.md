# FiveMarket - статичний e-commerce каталог (Next.js + Decap CMS)

Mobile-first сайт-каталог для продажу насіння та саджанців українською мовою.

## Обраний стиль і mini design system

**Стиль:** Clean / Organic e-commerce (адаптовано за підходом `ui-ux-pro-max`)

- **Кольори:** природні зелені тони для довіри + теплий акцент для CTA
- **Типографіка:** `Rubik` (заголовки) + `Nunito Sans` (основний текст)
- **Радіуси:** `--radius: 0.95rem`
- **Тіні:** `--shadow-card`, `--shadow-soft`
- **Spacing:** `--space-section` + mobile-first відступи
- **A11y:** touch targets 44px+, видимі focus ring, контрастний light theme

Токени винесені в:
- `/Users/andrii/Desktop/fivemarket/app/globals.css` (CSS variables)
- `/Users/andrii/Desktop/fivemarket/tailwind.config.ts` (прив'язка токенів до Tailwind)

## Технології

- Next.js 14+ (App Router) + TypeScript
- TailwindCSS
- shadcn/ui style components (Button, Card, Badge, Sheet, Dialog, Input, Tabs)
- Zustand + persist (кошик у `localStorage`)
- Embla Carousel (галерея товару)
- Markdown контент: `content/products/*.md`
- Decap CMS (Netlify CMS) в `/admin`
- Static export: `next.config.js -> output: "export"`

## Локальний запуск

1. Встановіть залежності:

```bash
npm install
```

2. Створіть `.env` на основі `.env.example`:

```bash
cp .env.example .env
```

3. Запустіть dev сервер:

```bash
npm run dev
```

4. Відкрийте:
- Каталог: `http://localhost:3000/`
- CMS: `http://localhost:3000/admin/`

## Build / Export статичного сайту

```bash
npm run build
```

Після build отримаєте статичну папку:
- `/Users/andrii/Desktop/fivemarket/out`

Її можна деплоїти на Netlify, Vercel Static, Cloudflare Pages або будь-який static hosting.

## Деплой на Netlify + увімкнення Decap CMS (git-gateway)

1. Підключіть репозиторій у Netlify.
2. Build command: `npm run build`
3. Publish directory: `out`
4. У Netlify UI увімкніть:
- **Identity**
- **Git Gateway**
5. Додайте користувача в Identity та увійдіть на `/admin/`.

`public/admin/config.yml` вже налаштовано на:

```yml
backend:
  name: git-gateway
  branch: main
```

## Опційно: переключення Decap CMS на GitHub backend

У файлі `/Users/andrii/Desktop/fivemarket/public/admin/config.yml`:

1. Закоментуйте `git-gateway`
2. Розкоментуйте блок:

```yml
backend:
  name: github
  repo: your-user/your-repo
  branch: main
```

Після цього Decap CMS комітитиме зміни напряму через GitHub backend.

## CRM form action (без сервера)

Checkout працює через звичайний HTML POST form.

Задайте URL CRM у `.env`:

```env
NEXT_PUBLIC_CRM_FORM_ACTION=https://your-crm.example.com/orders
```

Форма передає hidden-поля:
- `price`, `id`, `country=UA`, `user_ip`, `office=9`, `quantity`
- `order_items` (title/qty/price/subtotal/crm_id)
- `utm_source`, `utm_campaign`, `utm_content`, `utm_term`

## Де редагувати товари

- Через CMS: `/admin/` (Decap)
- Файли контенту: `/Users/andrii/Desktop/fivemarket/content/products/*.md`
- Зображення: `/Users/andrii/Desktop/fivemarket/public/uploads`

## Пікселі / аналітика

Підтримано умовне підключення (лише якщо env задані):

- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
- `NEXT_PUBLIC_GTM_ID`

Події:
- `ViewContent` на сторінці товару
- `AddToCart` на кнопках додавання
- `InitiateCheckout` при переході/відкритті checkout
- `Purchase` на `/thanks`

## Важливі файли

- `/Users/andrii/Desktop/fivemarket/next.config.js` - static export + unoptimized images
- `/Users/andrii/Desktop/fivemarket/lib/products.ts` - парсер Markdown/frontmatter (включно з обмеженням images <= 5)
- `/Users/andrii/Desktop/fivemarket/lib/pixels.ts` - universal pixel helper
- `/Users/andrii/Desktop/fivemarket/components/checkout/checkout-form.tsx` - HTML POST checkout

