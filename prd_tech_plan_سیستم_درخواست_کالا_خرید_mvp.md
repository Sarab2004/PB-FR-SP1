# PRD + Tech Plan: سیستم درخواست کالا/خرید (MVP)

## 1) هدف و دامنه
- **هدف:** پیاده‌سازی دموی بک‌اند و سپس فرانت برای جریان‌های «درخواست کالا از انبار» و «درخواست خرید» با نقش‌های جداگانه.
- **نقش‌ها:**
  - **Requester (درخواست‌کننده از انبار)**
  - **Warehouse Manager (انباردار)**
- **عدم ثبت‌نام آزاد:** کاربرها از قبل در دیتابیس مقداردهی می‌شوند؛ احراز هویت فقط با اطلاعات از پیش موجود و انتخاب نقش درست.
- **پشتیبانی:** لینک/بخش تماس با پشتیبانی در صفحه Auth در صورت خطا.

## 2) نقشه مسیر کاربر (User Journeys)
1) **Landing**
   - CTA «ورود به داشبورد» → صفحه انتخاب نقش → Auth.
2) **Auth**
   - ورودی‌ها: role + شناسه کاربر (مثلاً ایمیل/موبایل/کدملی) + passcode/OTP (برای MVP: passcode ساده).
   - اگر نقش انتخابی با نقش ذخیره‌شده کاربر هم‌خوانی نداشت → خطا + لینک پشتیبانی.
3) **Requester Dashboard**
   - فرم «درخواست کالا از انبار» + لیست «درخواست‌های ارسال‌شده من».
4) **Warehouse Manager Dashboard**
   - تب «فرم‌های درخواست کالا از انبار»: مشاهده/تایید/رد/تبدیل به «درخواست خرید». (بدون امکان ویرایش فرم درخواست کالا)
   - تب «فرم‌های درخواست خرید»: لیست (Draft/Submitted/Approved/Rejected). امکان ایجاد/ویرایش فقط برای انباردار.
   - **تبدیل**: با فشار دکمه Convert، فرم خرید تا حد ممکن خودکار پر می‌شود.

## 3) حالت‌ها و قوانین
### 3.1) درخواست کالا از انبار (WarehouseRequest)
- **Status:** SUBMITTED | APPROVED | REJECTED | CONVERTED
- بعد از SUBMITTED، درخواست **immutable** است (قابل ویرایش نیست).

### 3.2) درخواست خرید (PurchaseRequest)
- **Status:** DRAFT | SUBMITTED | APPROVED | REJECTED
- فقط انباردار می‌تواند ایجاد/ویرایش کند.
- هر WarehouseRequest حداکثر یک PurchaseRequest مرتبط دارد (قیود یکتا).

### 3.3) قواعد دسترسی (RBAC)
| عمل | Requester | Warehouse Manager |
|---|---|---|
| ورود (Auth) | فقط اگر نقش‌اش REQUESTER | فقط اگر نقش‌اش MANAGER |
| ایجاد WarehouseRequest | ✔️ | ✖️ |
| مشاهده WarehouseRequest خود | ✔️ | ✖️ |
| مشاهده همه WarehouseRequest | ✖️ | ✔️ (فقط خواندنی) |
| تایید/رد WarehouseRequest | ✖️ | ✔️ |
| تبدیل به PurchaseRequest | ✖️ | ✔️ |
| ایجاد/ویرایش PurchaseRequest | ✖️ | ✔️ |

## 4) مدل داده (ERD توصیفی)
- **User**(id, email?, phone?, nationalId?, role[REQUESTER|MANAGER], passcode (MVP), isActive)
- **WarehouseRequest**(id, requesterId→User, title, description?, items[JSON], requiredDate?, status, lockedAt?, createdAt, **itemCode, specs, usageLocation, priority**)
- **PurchaseRequest**(id, sourceWRequestId→WarehouseRequest?, managerId→User, items[JSON], vendor?, total?, status, createdAt, **usageLocation, priority**)
- **AuditLog**(id, actorId→User, entityType, entityId, action, payload[JSON], at)
- قیود: UNIQUE(PurchaseRequest.sourceWRequestId)؛ FKها؛ ایندکس‌ها روی status/createdAt.

### 🆕 بهبود ۱: تکمیل مدل داده (Database Schema)
- افزودن فیلدهای کلیدی به جداول اصلی: `itemCode`, `specs`, `usageLocation`, `priority`, `description`.
- مزیت: از دست رفتن اطلاعات جلوگیری می‌شود و ساختار دیتا با فرم‌های واقعی هم‌خوان است.

## 5) API (Contract خلاصه)
- **Auth**
  - `POST /auth/login` {role, identifier, passcode} → {accessToken, user}
  - سناریوی خطا: 401 (نقش اشتباه یا کاربر غیرفعال) + link پشتیبانی.
- **Requester**
  - `POST /requests` (auth: REQUESTER) → ایجاد WarehouseRequest
  - `GET /requests/my` → لیست درخواست‌های خود کاربر
- **Manager**
  - `GET /manager/requests` → لیست همه WarehouseRequest با فیلتر status
  - `POST /manager/requests/:id/approve` | `.../reject`
  - `POST /manager/requests/:id/convert` → ایجاد/برگرداندن PurchaseRequest مرتبط
  - `GET /manager/purchases` | `GET /manager/purchases/:id`
  - `POST /manager/purchases` (ایجاد مستقیم)

### 5.1) نمونه اسکیمای JSON (فشرده)
```json
// WarehouseRequest.create
{
  "title": "درخواست تامین A4",
  "description": "مصرف ماه جاری",
  "itemCode": "A4-80G",
  "specs": "80 گرم، 500 برگ",
  "usageLocation": "دفتر مرکزی",
  "priority": "HIGH",
  "items": [
    {"sku":"A4-80G","name":"کاغذ A4","qty":10,"unit":"بسته"}
  ],
  "requiredDate": "2025-10-01"
}
```

```json
// convert → PurchaseRequest (خروجی)
{
  "id": "pr_123",
  "sourceWRequestId": "wr_456",
  "items": [
    {"sku":"A4-80G","name":"کاغذ A4","qty":10,"unit":"بسته"}
  ],
  "usageLocation": "دفتر مرکزی",
  "priority": "HIGH",
  "status": "DRAFT"
}
```

### 🆕 بهبود ۲: بهبود منطق تبدیل (Convert)
- طراحی mapping بین فیلدهای `WarehouseRequest` و `PurchaseRequest`.
- انتقال خودکار داده‌های کلیدی (`itemCode`, `specs`, `description`, `usageLocation`, `priority`).
- تنها داده‌های جدید (vendor, total) توسط انباردار تکمیل شود.

### 🆕 بهبود ۳: تکمیل API Endpoints
- افزودن endpointهای جزئیات:
  - `GET /requests/:id` → نمایش کامل WR شامل همه فیلدهای جدید.
  - `GET /purchases/:id` → نمایش کامل PR.
  - `POST /manager/requests/:id/convert` → پشتیبانی از دریافت مقادیر جدید (`usageLocation`, `priority`) هنگام تبدیل.
- مزیت: پشتیبانی از تبدیل دقیق‌تر، واکشی کامل دیتا و توسعه‌پذیری بالا.

## 6) پذیرش و تست‌ها (Acceptance)
- **Auth**
  - اگر نقش انتخابی با نقش واقعی کاربر هم‌خوان نیست → 401 + پیام «نقش انتخابی صحیح نیست» + لینک پشتیبانی.
- **Requester**
  - ایجاد درخواست موفق → status=SUBMITTED و پس از ایجاد، غیرقابل ویرایش.
  - `GET /requests/my` لیست همه درخواست‌ها را برمی‌گرداند.
- **Manager**
  - مشاهده همه WarehouseRequest (خواندنی).
  - Approve/Reject وضعیت را تغییر می‌دهد و Audit ثبت می‌شود.
  - Convert یک PurchaseRequest جدید می‌سازد یا قبلی را برمی‌گرداند (idempotent).
- **Consistency**
  - بعد از ارسال درخواست توسط Requester، در تب «فرم درخواست خرید» پس از refresh قابل مشاهده/تبدیل است.

## 7) ترتیب پیاده‌سازی (Roadmap)
1) **Backend Scaffold** با Supabase (PostgreSQL + Auth + API) و کدنویسی در **VS Code**
   - جداول: Users, WarehouseRequests, PurchaseRequests, Audit.
   - Seeder اولیه: 1 مدیر + چند درخواست‌کننده نمونه.
2) **Landing + Auth (فرانت ساده)**
   - انتخاب نقش → فرم Auth → خطا/موفق + پشتیبانی.
3) **Requester UI**
   - فرم ایجاد درخواست + لیست ارسال‌ها.
4) **Manager UI**
   - لیست درخواست‌های انبار + عمل‌های Approve/Reject/Convert.
   - لیست درخواست‌های خرید.
5) **اتصالات و قیود**
   - قید یکتایی تبدیل، قفل ویرایش Request پس از SUBMITTED، Audit.

## 8) Stack پیشنهادی (MVP)
- **Backend:** Supabase (Postgres, Auth, Row Level Security), Edge Functions برای لاجیک‌ها.
- **Frontend:** React (Vite) یا Next.js؛ Zustand/React Query؛ Tailwind.
- **IDE:** Visual Studio Code (VS Code).
- **DevOps:** Supabase hosting + GitHub Actions (lint/test).

## 9) اسکیمای Supabase (SQL پیشنهادی)
```sql
alter table warehouse_requests add column item_code text;
alter table warehouse_requests add column specs text;
alter table warehouse_requests add column usage_location text;
alter table warehouse_requests add column priority text;

alter table purchase_requests add column usage_location text;
alter table purchase_requests add column priority text;
```

## 10) Endpoint جزئیات (Edge Functions در Supabase)
- **Auth**
  - `POST /auth/login` → نقش را با کاربر چک می‌کند؛ روی mismatch → 401.
- **Requests**
  - `POST /requests` → ایجاد WR؛ پس از ایجاد، `locked_at` ست شده و دیگر Patch نمی‌پذیرد.
  - `GET /requests/my`
  - `GET /requests/:id`
- **Manager**
  - `GET /manager/requests?status=`
  - `POST /manager/requests/:id/approve|reject`
  - `POST /manager/requests/:id/convert` (دریافت usageLocation, priority جدید)
  - `GET /manager/purchases`
  - `GET /purchases/:id`
  - `POST /manager/purchases`

## 11) قواعد مهم کسب‌وکار
- انباردار **هرگز** نمی‌تواند WarehouseRequest را ویرایش کند.
- تبدیل (Convert) باید **idempotent** باشد: اگر قبلاً PR ساخته شده بود، همان را برگرداند.
- هر تغییر وضعیت در AuditLog ذخیره شود.

## 12) UI Routes (بعد از بک‌اند)
- `/` Landing (CTA: ورود به داشبورد)
- `/auth?role=requester|manager`
- `/dashboard/requester` → (Create Request + My Requests)
- `/dashboard/manager` → Tabs: (Warehouse Requests) | (Purchase Requests)
- `/support` (اختیاری)

## 13) پذیرش نهایی دمو
- سناریو end-to-end: Requester وارد شود → ارسال فرم → Manager ببیند/تایید کند → تبدیل به PurchaseRequest → مشاهده در تب مربوطه.

## 14) چک‌لیست تست دستی
- نقش غلط در Auth → خطا + لینک پشتیبانی.
- Requester نتواند به مسیرهای Manager دسترسی پیدا کند (403) و برعکس.
- پس از ارسال WR، در تب Purchase پس از refresh قابل مشاهده/تبدیل باشد.
- تبدیل دوم، PR جدید نسازد (idempotency).

## 15) نکات فرانت/طراحی (پس از بک‌اند)
- استفاده از پالت رنگی داده‌شده.
- CTA با `--pumpkin`/`--sunshade`، پس‌زمینه با `--quarter-spanish-white`.
- Micro-interactions سبک؛ شیشه‌ای (Glass) فقط برای header/modal.

---
**Next:** شروع مرحله 1 (Backend Scaffold) با Supabase و پیاده‌سازی Auth + Users + Requests + Purchases طبق این سند.


## 16) Frontend Design Guidelines (سبک، کاربردی، به‌روز)

### 16.1) توکن‌های رنگ (ثابت‌ها)
```
--brand-1: #FF731C;
--gray-900: #494A41;
--paper:   #F7F1DD;
--accent-1:#FFAD65;
--gray-400:#B1B3AA;
--accent-2:#FF9A23;
--tone-1:  #FFD59E;
--gray-700:#797A70;
```
- دکمهٔ اصلی: پس‌زمینه `--gray-900` + متن سفید (کنتراست عالی).
- نارنجی‌ها (`--brand-1`, `--accent-2`) بیشتر برای Accent (Border/Badge/Icon/Outline) و CTA ثانویه.
- اگر دکمهٔ نارنجی ضروری است: سایز بزرگ + وزن فونت بالا + سایهٔ داخلی ملایم برای خوانایی بهتر.

### 16.2) لندینگ پیج (Landing)
- پس‌زمینه `--paper` با الگوی بسیار ملایم (بدون blur).
- Hero مینیمال (max-width: 720px)، تیتر Bold `--gray-900`، زیرتیتر `--gray-700`.
- Primary CTA: «ورود به داشبورد» → دکمه Solid `--gray-900`، Hover: 6–8% تیره‌تر + transform: translateY(-1px).
- Secondary CTA (اختیاری): Outline با Border `--gray-900`، Hover با پس‌زمینهٔ کم‌رنگ `--tone-1`.
- انتخاب نقش در Modal سبک با **Radio Cards**: کارت سفید، Border `--gray-400`، Hover: shadow-sm؛ حالت انتخاب: Border `--accent-2` + Focus ring واضح.
- آیکن‌ها SVG خطی با `--accent-2` (بدون تصاویر سنگین).
- Footer: لینک «تماس با پشتیبانی» با `--accent-2` + underline در Hover.

### 16.3) Auth (انتخاب نقش + ورود)
- کارت مرکزی 480–560px، هدر کوچک با لوگو.
- Stepper/Heading: «۱) انتخاب نقش» → «۲) ورود».
- Radio Cards نقش مانند لندینگ یا مسیر `?role=...`.
- **Mismatch نقش**: Error Banner با پس‌زمینه `--tone-1` و متن `--gray-900` + آیکن هشدار نارنجی.
- فرم: Label/Placeholder `--gray-700`، متن `--gray-900`، Border `--gray-400`، Focus 2px `--accent-2`.
- دکمهٔ ورود: Solid `--gray-900`، متن سفید، جلوگیری از دابل‌کلیک (disabled + spinner داخل دکمه).
- لینک «تماس با پشتیبانی» زیر فرم (به /support یا مودال اطلاعات تماس).
- پیام‌های خطا کوتاه و خوانا؛ Focus state واضح برای همهٔ عناصر قابل‌فوکوس.

### 16.4) داشبورد — ساختار عمومی
- Sidebar سبک (سفید یا `--paper`)، آیکن‌ها `--gray-900`، آیتم فعال: خط Accent `--accent-2` یا پس‌زمینهٔ `--tone-1`.
- Header ثابت 56–64px، عنوان صفحه + اکشن‌ها.
- کارت‌های محتوا سفید با radius 16–20px و سایهٔ نرم کم؛ پس‌زمینهٔ کل `--paper`.
- Tabs: فعال با زیرخط 2px `--accent-2`؛ غیرفعال `--gray-700`.
- Buttons: Primary (Solid `--gray-900`)، Secondary (Outline `--gray-900`)، Tertiary (متنی با `--accent-2`).
- Badges/Status: SUBMITTED=`--tone-1`/`--gray-900`، APPROVED=outline `--accent-2` + آیکن تیک، REJECTED=آیکن خاکستری تیره، CONVERTED=outline `--accent-1`.

### 16.5) داشبورد Requester
- **فرم درخواست کالا از انبار** با بخش‌ها: کلیات (عنوان/توضیح)، آیتم‌ها (ردیفی: sku, name, qty, unit)، متادیتا (usageLocation, priority, requiredDate).
- ردیف‌های آیتم: کارت‌مانند با Border `--gray-400` و دکمه‌های +/– آیکنی.
- اعتبارسنجی سبک، پیام‌های کوتاه؛ دکمهٔ «ارسال درخواست» Primary.
- پس از ارسال: Toast موفقیت + قفل شدن فرم (read-only).
- **لیست درخواست‌های من**: جدول سبک با ستون‌های کلیدی + فیلتر وضعیت؛ Skeleton ردیفی در لود.

### 16.6) داشبورد Manager
- **تب Warehouse Requests**: جدول همهٔ WRها (خواندنی) با اکشن‌های Approve/Reject/Convert.
- صفحهٔ جزئیات WR: نمایش کامل، بدون ویرایش؛ دکمهٔ Convert (Tertiary با آیکن ↬، رنگ `--accent-2`).
- Dialog تبدیل: امکان واردکردن/ویرایش فقط فیلدهای جدید (vendor, total, usageLocation, priority) سپس Confirm.
- **تب Purchase Requests**: لیست PRها (Draft/Submitted/Approved/Rejected) + صفحهٔ ساخت/ویرایش PR برای انباردار؛ Toast بعد از ثبت.
- اتصال خودکار: پس از ارسال WR، PR-tab با Refresh قابل مشاهده/تبدیل؛ Convert **idempotent**.

### 16.7) عملکرد (Performance)
- بدون blur و فیلترهای سنگین؛ فقط رنگ‌های تخت، سایهٔ ملایم، گوشهٔ گرد.
- آیکن‌ها SVG؛ تصاویر بزرگ lazy-load.
- فونت: یک خانواده با ۲–۳ وزن، display-swap؛ در صورت امکان subset.
- انیمیشن‌ها فقط transform/opacity، 150–200ms؛ بدون keyframeهای سنگین.
- جداول: Paging/Virtualize در داده‌های زیاد.
- Prefetch مسیرهای پرتردد (بعد از Auth).
- CSS Variables برای آماده‌سازی Dark/Light (در آینده).

### 16.8) Loading/Feedback (بین صفحات و اکشن‌ها)
1) **Skeleton** برای صفحات/جدول‌ها: بلوک‌های خاکستری روشن با shimmer خیلی ملایم (فقط opacity/transform).
2) **Inline Spinner داخل دکمه** هنگام Submit/Convert/Approve (بدون بلاک کردن صفحه).
3) **Top Progress Bar** باریک 2px هنگام تغییر مسیر.
4) **Optimistic UI** برای اکشن‌های سریع (Approve/Reject/Convert) + rollback در خطا.

### 16.9) Snippet متغیرهای CSS (نمونه)
```css
:root{
  --brand-1:#FF731C; --accent-2:#FF9A23; --accent-1:#FFAD65; --tone-1:#FFD59E;
  --paper:#F7F1DD; --gray-900:#494A41; --gray-700:#797A70; --gray-400:#B1B3AA;
}
.btn-primary{ background:var(--gray-900); color:#fff; border-radius:14px; padding:.8rem 1.2rem; }
.btn-primary:hover{ filter:brightness(.92); transform:translateY(-1px); transition:transform .18s ease, filter .18s ease; }
.btn-outline{ border:1px solid var(--gray-900); color:var(--gray-900); background:transparent; }
.badge-submitted{ background:var(--tone-1); color:var(--gray-900); }
.tab-active{ border-bottom:2px solid var(--accent-2); color:var(--gray-900); }
.input{ border:1px solid var(--gray-400); }
.input:focus{ outline:2px solid var(--accent-2); outline-offset:2px; }
.skeleton{ background:linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%); animation:shimmer 1.4s infinite; }
@keyframes shimmer{ 0%{background-position:-500px 0} 100%{background-position:500px 0} }
```

### 16.10) چک‌لیست اعمال فرانت
- [ ] تعریف و استفاده از توکن‌های رنگ.
- [ ] لندینگ مینیمال + Modal انتخاب نقش.
- [ ] Auth با Banner خطا و Focusهای واضح.
- [ ] داشبورد با Sidebar سبک، Tabs شفاف، کارت‌های سفید.
- [ ] فرم WR (Requester) + قفل بعد از ارسال + لیست خودم با Skeleton.
- [ ] لیست WR Manager + جزئیات فقط‌خواندنی + Convert dialog.
- [ ] لیست/فرم PR Manager + Toast موفقیت.
- [ ] Convert idempotent.
- [ ] Loading: Skeleton, Top Bar, Button Spinner.
- [ ] بهینه‌سازی عملکرد و دسترسی (بدون blur، فونت محدود، کنتراست دکمهٔ اصلی).

