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

CMS працює у режимі `publish_mode: editorial_workflow`.

Додатково в `/admin` реалізовано UX-шар:
- кольорові статуси в списку `Зміст`: `Опублікована`, `Готові до публікації`, `Чорновик`
- окрема мітка `Приховано` для товарів із вимкненим `Показувати на сайті`
- кнопка `Опублікувати зараз` у плаваючій панелі для швидкого кліку по native Publish

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

## CRM інтеграція (через Netlify Function)

Щоб уникнути попередження браузера про небезпечну форму (`https -> http`) та завжди повертати користувача на сторінку подяки сайту, checkout відправляє форму у serverless endpoint:
- `/.netlify/functions/create-order`

Функція вже додана у:
- `/Users/andrii/Desktop/fivemarket/netlify/functions/create-order.js`

Netlify конфіг:
- `/Users/andrii/Desktop/fivemarket/netlify.toml`

Налаштуйте `.env` (або Netlify Environment variables):

```env
NEXT_PUBLIC_ORDER_SUBMIT_ACTION=/.netlify/functions/create-order

# публічні (fallback)
NEXT_PUBLIC_CRM_FORM_ACTION=http://your-subdomain.lp-crm.biz/api/addNewOrder.html
NEXT_PUBLIC_CRM_OFFICE=9
NEXT_PUBLIC_CRM_COUNTRY=UA
NEXT_PUBLIC_CRM_DELIVERY_ID=1
NEXT_PUBLIC_CRM_PAYMENT_ID=4
NEXT_PUBLIC_CRM_DEFAULT_EMAIL=

# серверні (рекомендовано, ключ тільки тут)
CRM_ORDER_ENDPOINT=http://your-subdomain.lp-crm.biz/api/addNewOrder.html
CRM_API_KEY=your_api_key
CRM_OFFICE=9
CRM_COUNTRY=UA
CRM_DELIVERY_ID=1
CRM_PAYMENT_ID=4
CRM_DEFAULT_EMAIL=

# ручний one-click deploy із /admin
NETLIFY_BUILD_HOOK_URL=https://api.netlify.com/build_hooks/your-hook-id
```

Форма передає у функцію та далі в CRM:
- LP CRM: `key`, `order_id`, `products`, `bayer_name`, `phone`, `delivery`, `delivery_adress`, `payment`, `country`, `office`, `sender`
- Додатково: `price`, `id`, `quantity`, `user_ip`, `order_items`, `comment`, `product_name`, `cart_items`
- UTM: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- Redirect після відправки: `success_url`, `redirect`, `success_redirect`

`products` формується зі всієї корзини у форматі LP CRM (`product_id=crm_id`, `price`, `count`) для кожного товару.

## Як економити кредити Netlify

У проєкті вже додано:
- `/Users/andrii/Desktop/fivemarket/netlify.toml` -> `ignore = "bash scripts/netlify-ignore-build.sh"`
- `/Users/andrii/Desktop/fivemarket/scripts/netlify-ignore-build.sh`

Скрипт пропускає:
- `deploy-preview` і `branch-deploy`
- автоматичні `production` збірки від CMS-комітів

Тобто зміни з CMS можна накопичувати, а потім випускати одним деплоєм.

Рекомендований процес:
1. Редагуйте товари в `Workflow`, переведіть потрібні картки у `Ready`.
2. Публікуйте готові картки.
3. Натискайте кнопку `1 деплой` у `/admin` (панель праворуч унизу), щоб запустити один production deploy на всю пачку змін.

Примітка:
- у колекції `Товари` є швидкі фільтри `На сайті` / `Приховані`
- перемикач `Показувати на сайті` працює як “Сховати без видалення”

Як увімкнути кнопку `1 деплой`:
1. Netlify -> Site configuration -> Build & deploy -> Build hooks -> `Add build hook`.
2. Скопіюйте URL hook у змінну середовища `NETLIFY_BUILD_HOOK_URL`.
3. Зробіть redeploy сайту один раз.

## Де редагувати товари

- Через CMS: `/admin/` (Decap)
- Файли контенту: `/Users/andrii/Desktop/fivemarket/content/products/*.md`
- Зображення: `/Users/andrii/Desktop/fivemarket/public/uploads`

## Пікселі / аналітика

Налаштування для сторінки `thanks` можна робити в одному файлі:
- `/Users/andrii/Desktop/fivemarket/app/thanks/page.tsx`
- там є шаблон для `2x Facebook Pixel`, `TikTok Pixel`, `Google Ads`
- там же задаються conversion events для `thanks`

Глобальні пікселі (через env, fallback):

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
- `/Users/andrii/Desktop/fivemarket/public/admin/config.yml` - Decap CMS workflow + структурування списку товарів
- `/Users/andrii/Desktop/fivemarket/public/admin/index.html` - панель `Workflow / Опублікувати зараз / 1 деплой` + кастомні статуси в адмінці
- `/Users/andrii/Desktop/fivemarket/netlify/functions/manual-deploy.js` - secure trigger Netlify build hook (для авторизованого Identity користувача)
- `/Users/andrii/Desktop/fivemarket/scripts/netlify-ignore-build.sh` - пропуск не-production збірок для економії кредитів
