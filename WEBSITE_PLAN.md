# CarMatch Website — Kế Hoạch Xây Dựng Lại
> Mục tiêu: Website mang lại khách hàng thực, không chỉ đẹp

**Ngày lập:** 2026-05-13  
**Người phụ trách:** Hưng Nam (CEO CarMatch)  
**Stack:** Vite + React + TypeScript + Tailwind CSS v4 + Sanity CMS + Vercel

---

## 1. BỐI CẢNH KINH DOANH — TẠI SAO WEBSITE NÀY PHẢI KHÁC

### Thực trạng CarMatch
- **~20 xe**, mô hình asset-light (đối tác sở hữu xe, CarMatch vận hành)
- **~10 nhân sự**, ~2 năm hoạt động, gần đạt điểm hòa vốn
- **Kênh booking chính:** Zalo (thủ công, phụ thuộc vào người)
- **Kênh convert thực:** TikTok (đã chứng minh có khách)
- **Thời gian thuê bình quân:** ~1.9 ngày (cần tăng lên ≥3 ngày)
- **Occupancy ngày thường:** 40% (mục tiêu 65%)

### Điểm nghẽn core: DEMAND & CONVERSION (không phải nguồn cung xe)

### Mục tiêu tài chính: 130M VND lợi nhuận/tháng
- **Chiến lược 1:** B2B thuê tháng — 6+ xe × ≥30 ngày
- **Chiến lược 2:** Tăng thời gian thuê bình quân (1.9 → 3+ ngày)
- **Chiến lược 3:** Lấp đầy ngày thường (weekday 40% → 65%)

---

## 2. RESEARCH — CÁC TRANG WEB CHO THUÊ XE TỐT NHẤT

### International: Turo (turo.com)
✅ **Điểm học được:**
- Trang chủ = search box ngay lập tức (địa điểm + ngày)
- Mỗi xe có trang riêng: ảnh thực, reviews, specs chi tiết
- Social proof cực mạnh: "4.8★ từ 12,450 đánh giá"
- CTA duy nhất: "Book now" — không gây confusion
- Trust: bảo hiểm rõ ràng, quy trình nhận xe chi tiết

### International: Hertz (hertz.com)
✅ **Điểm học được:**
- Phân khúc rõ: Economy → Luxury → SUV → Van
- B2B riêng: trang "Business" tách biệt hoàn toàn
- "Special offers" tạo urgency
- FAQ dài nhưng tổ chức tốt = giảm rào cản tâm lý

### Vietnam: Mioto (mioto.vn)
✅ **Điểm học được:**
- App-first nhưng website vẫn là kênh research của khách
- Lọc xe theo: giá, loại xe, số chỗ, hãng
- Hiển thị "còn X xe trong ngày này" → urgency thực
- Ảnh xe thực (không phải stock photo) = trust cao hơn nhiều
- Review từ người thuê thực

### Vietnam: GreenFuture (greenfuture.tech)
✅ **Điểm học được:**
- Định vị premium: "Xe điện sang trọng"
- Hero section rõ ràng: value prop + CTA trực tiếp
- Section "Tại sao chọn chúng tôi" với số liệu cụ thể
- Blog content về xe điện → SEO tốt

### Vietnam: Xanhsm / Be Car
✅ **Điểm học được:**
- Giao diện đơn giản, mobile-first
- Hotline nổi bật (click-to-call)
- Ảnh thực > render đẹp

### Điểm CHUNG của các trang convert tốt:
1. **Search/CTA nổi bật ngay màn hình đầu** — không phải scroll mới thấy
2. **Số điện thoại / Zalo luôn hiển thị** (sticky)
3. **Ảnh thực của xe** — không dùng stock photo
4. **Social proof cụ thể** — số lượng khách, đánh giá thực
5. **Giá rõ ràng** — không bắt khách phải hỏi mới biết giá
6. **Quy trình thuê đơn giản** — 3 bước tối đa
7. **B2B tách biệt** — doanh nghiệp không muốn dùng chung flow với khách lẻ
8. **Mobile-first** — 80%+ traffic từ điện thoại

---

## 3. CHIẾN LƯỢC WEBSITE — WHAT IT MUST DO

### Website CarMatch KHÔNG phải là catalogue xe
### Website CarMatch LÀ một sales machine với 3 luồng conversion:

```
Luồng 1: Khách lẻ (cá nhân)
  Landing → Xem fleet → Xe chi tiết → Zalo ngay

Luồng 2: Khách B2B (doanh nghiệp)
  Landing → Trang B2B → Form liên hệ → Gọi điện/Email

Luồng 3: SEO (organic search)
  Google → Blog bài → Internal link → Trang xe hoặc B2B
```

### KPI đo lường:
- Clicks vào nút Zalo / tháng
- Leads từ form B2B / tháng  
- Traffic organic từ blog / tháng
- Thời gian trên trang (>2 phút = engaged)

---

## 4. CẤU TRÚC TRANG — 7 PAGES

### Page 1: `/` — Home (Landing)
**Mục tiêu:** Convert khách lẻ trong 10 giây đầu

**Sections theo thứ tự:**
1. **Navbar** — Logo + Nav links + Nút "Đặt xe ngay" (Zalo, màu nổi bật)
2. **Hero** — Headline mạnh + Sub + 2 CTA (Zalo + Xem xe)
3. **Quick Filter** — Lọc nhanh theo: loại xe / số chỗ / khoảng giá → jump tới fleet
4. **Fleet Grid** — Tất cả xe, có thể lọc, mỗi thẻ: ảnh + tên + giá + CTA
5. **Why CarMatch** — 4-6 điểm mạnh với số liệu thực (không cần dùng placeholder)
6. **Social Proof** — Đánh giá khách thực (lấy từ Google/Zalo/TikTok comments)
7. **B2B Teaser** — "Doanh nghiệp cần 2+ xe?" → link tới trang B2B
8. **How It Works** — 3 bước thuê xe (đơn giản)
9. **Blog Preview** — 3 bài mới nhất (SEO signal)
10. **Footer** — Thông tin đầy đủ + Zalo + hotline

### Page 2: `/xe` — Fleet (Tất cả xe)
**Mục tiêu:** Giúp khách tìm được xe phù hợp nhanh nhất

**Features:**
- Filter: Loại xe (Điện/Xăng/Dầu) | Số chỗ (5/7) | Giá (<1M / 1-1.5M / >1.5M)
- Sort: Giá tăng dần, Giá giảm dần, Phổ biến nhất
- Mỗi thẻ xe: ảnh, tên, badge (Điện/Xăng), giá/ngày, số chỗ, CTA "Xem chi tiết"
- Sticky mobile bar: "Cần tư vấn? Zalo ngay" + số điện thoại

### Page 3: `/xe/:slug` — Chi Tiết Xe
**Mục tiêu:** Xử lý mọi objection → chốt Zalo

**Sections:**
1. Gallery ảnh (mobile: swipe, desktop: grid) — ảnh thực xe
2. Tên + Badge + Giá nổi bật + Nút Zalo to (sticky trên mobile)
3. Specs: số chỗ, nhiên liệu, hộp số, km/ngày
4. Tiện nghi đi kèm (icons)
5. Điều kiện thuê (CCCD, GPLX, đặt cọc) — trình bày rõ, không gây sợ
6. "Xe này phù hợp với bạn nếu..." — use case cụ thể
7. FAQ của xe này (accordion)
8. Related cars (3 xe tương tự)
9. CTA cuối trang: Zalo + hotline

### Page 4: `/thue-xe-thang` — B2B (Thuê xe theo tháng)
**Mục tiêu:** Convert khách doanh nghiệp — đây là REVENUE driver chính

**Sections:**
1. **Hero B2B:** Headline "Giải pháp xe tháng cho doanh nghiệp Hà Nội"
2. **Value Props:** Giá tốt hơn thuê ngày | Xe giao tận nơi | Hỗ trợ 24/7 | Hóa đơn VAT
3. **Pricing tiers:** Rõ ràng — VD: "Từ 18M/xe/tháng" (không hide giá)
4. **Use cases:** Công ty outsource xe | Sự kiện dài ngày | Dự án xây dựng
5. **Fleet B2B:** Xe phù hợp cho doanh nghiệp (Innova, Carnival, VF8...)
6. **Contact Form:** Tên công ty + Số xe cần + Thời gian + SĐT → gửi về Zalo/email
7. **Trust:** Logo công ty đã hợp tác (nếu có) | Testimonial B2B

### Page 5: `/gioi-thieu` — About (Giới thiệu)
**Mục tiêu:** Xây trust — đặc biệt với B2B cần biết họ đang làm việc với ai

**Sections:**
1. Story CarMatch — ngắn, honest, personal
2. Đội ngũ (ảnh thực nếu có)
3. Con số: 2 năm hoạt động, 20+ xe, 500+ chuyến thành công
4. Cam kết dịch vụ
5. Quy trình bàn giao xe (transparent = trust)

### Page 6: `/blog` — Blog (SEO)
**Mục tiêu:** Organic traffic từ Google → convert sang khách hàng

**Structure:** 
- Grid bài viết với thumbnail, tóm tắt, ngày đăng
- Categories: Kinh nghiệm thuê xe | Địa điểm du lịch HN | Xe điện | B2B
- Sanity CMS powered (đã setup)

### Page 7: `/blog/:slug` — Bài viết Blog
- Full article với PortableText
- Sidebar: "Xem fleet xe" hoặc "Đặt xe ngay qua Zalo"
- Related posts
- CTA cuối bài

---

## 5. DESIGN SYSTEM

### Thay đổi từ phiên bản hiện tại:
**Giữ lại:** Dark theme (#0a0a0a), typography system, shadcn/ui components  
**Thay đổi:** 
- Accent màu: `#4ade80` (neon green) → giữ nguyên (phù hợp với xe điện, eco)  
- Navbar: thêm sticky + backdrop-blur khi scroll  
- Cards: thêm hover animation tinh tế  
- CTA buttons: to hơn, màu nổi hơn trên mobile

### Typography:
- Heading: font-bold, tracking-tight
- Body: text-muted-foreground (gray nhẹ)
- Price: text-green-400, font-bold, size to

### Mobile-first priorities:
- Zalo FAB button (floating) luôn hiển thị bottom-right
- Navbar collapse gọn trên mobile
- Fleet cards: 1 cột trên mobile, 2 cột tablet, 3-4 cột desktop
- Hero: text nhỏ hơn, CTA buttons stack vertical

---

## 6. CONVERSION ARCHITECTURE

### Nút Zalo — Có mặt ở MỌI NƠI:
```
- Navbar (desktop): "Đặt xe qua Zalo" button màu green
- Hero: CTA chính
- Mỗi thẻ xe: "Đặt xe" 
- Trang xe chi tiết: Sticky bottom bar (mobile) + floating button
- Footer: Số Zalo to + QR code
- FAB: Floating action button bottom-right mọi trang
```

### Zalo Link: `https://zalo.me/0975563290`
### SĐT: `0975 563 290`

### Trust Signals phải có:
1. Số chuyến đã phục vụ (VD: "500+ chuyến thành công")
2. Rating (VD: "4.8★ — 120 đánh giá")
3. "Xe được bảo dưỡng định kỳ"
4. Địa chỉ thực: [địa chỉ CarMatch tại Hà Nội]
5. Hóa đơn VAT cho doanh nghiệp

### Urgency (không fake, chỉ dùng khi thật):
- "Còn X xe trống cuối tuần này" — chỉ dùng nếu đúng thực tế
- "Giá ưu đãi thuê tháng — liên hệ ngay"

---

## 7. SEO STRATEGY

### Target keywords:
```
Tier 1 (volume cao, HN local):
- "thuê xe tự lái hà nội"
- "thuê xe điện hà nội"  
- "thuê xe 7 chỗ hà nội"
- "thuê xe theo tháng hà nội"

Tier 2 (long-tail, convert cao):
- "thuê xe vinfast vf8 hà nội"
- "thuê xe đi sapa tự lái"
- "thuê xe tháng cho doanh nghiệp hà nội"
- "giá thuê xe điện theo ngày hà nội"

Tier 3 (informational, SEO blog):
- "kinh nghiệm thuê xe tự lái lần đầu"
- "xe điện vs xe xăng cho thuê nên chọn loại nào"
- "địa điểm đẹp hà nội đi bằng xe tự lái"
```

### Meta tags (mỗi trang cần có):
- `<title>` unique, có keyword
- `<meta description>` 150-160 chars, có CTA
- Open Graph (share Zalo/Facebook)

### Blog content plan (12 bài đầu):
1. "Kinh nghiệm thuê xe tự lái ở Hà Nội — 10 điều cần biết"
2. "Thuê VinFast VF8 có khó không? Review từ người thuê thực"
3. "Hà Nội đi Sapa bằng xe tự lái: lộ trình + chi phí 2025"
4. "Xe điện vs xe xăng: nên thuê loại nào cho chuyến dài?"
5. "Doanh nghiệp nên thuê xe tháng hay mua xe? So sánh chi phí"
6. "5 địa điểm check-in Hà Nội đẹp nhất đi bằng xe tự lái"
7. "Điều kiện thuê xe tự lái ở CarMatch — CCCD, GPLX, đặt cọc"
8. "Kia Carnival 7 chỗ — có nên thuê cho gia đình?"
9. "Hà Nội đi Ninh Bình tự lái — gợi ý lộ trình 1 ngày"
10. "Thuê xe tháng cho startup Hà Nội — giải pháp tiết kiệm 40%"
11. "Toyota Innova vs VinFast VF6 — nên thuê xe nào?"
12. "Bảo hiểm thuê xe — bạn cần biết những gì?"

---

## 8. TECHNICAL SPEC CHO CODEX

### Giữ nguyên (không đổi):
- Vite + React + TypeScript + Tailwind CSS v4
- shadcn/ui components (đã cài đủ)
- React Router v7
- Sanity CMS (blog)
- Vercel hosting
- `vercel.json` rewrites

### Thay đổi cấu trúc:

**Routes mới trong `App.tsx`:**
```tsx
<Route path="/" element={<Home />} />
<Route path="/xe" element={<Fleet />} />           // NEW
<Route path="/xe/:slug" element={<CarDetail />} />
<Route path="/thue-xe-thang" element={<B2B />} />  // NEW
<Route path="/gioi-thieu" element={<About />} />   // NEW
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

**Files mới cần tạo:**
```
src/app/pages/Fleet.tsx        — trang danh sách xe với filter
src/app/pages/B2B.tsx          — trang thuê xe tháng doanh nghiệp
src/app/pages/About.tsx        — giới thiệu công ty
src/app/components/ZaloFAB.tsx — floating Zalo button mọi trang
src/app/components/Navbar.tsx  — navbar tách riêng (hiện đang inline)
src/app/components/Footer.tsx  — footer tách riêng
src/app/components/CarCard.tsx — thẻ xe dùng chung Fleet + Home
src/app/components/B2BForm.tsx — form liên hệ B2B
```

**Data layer — cập nhật `cars.ts`:**
```typescript
export interface Car {
  slug: string;
  name: string;
  brand: string;           // NEW: "VinFast" | "Toyota" | "Kia" | "Hyundai"
  price: number;           // giá/ngày
  priceMonth?: number;     // NEW: giá/tháng (nếu có)
  seats: number;
  fuel: 'Điện' | 'Xăng' | 'Dầu';
  transmission: string;
  kmPerDay: number;
  amenities: string[];
  conditions: string[];
  available: boolean;
  images: string[];        // CHANGED: array thay vì 1 ảnh
  category: 'electric' | 'gasoline' | 'diesel';
  popular?: boolean;       // NEW: featured trên homepage
  useCases?: string[];     // NEW: "Gia đình", "Du lịch", "Doanh nghiệp"
  description?: string;    // NEW: mô tả ngắn cho SEO
}
```

**SEO: Thêm `index.html` meta tags và page-level meta:**
```html
<!-- index.html -->
<meta name="description" content="CarMatch — Thuê xe tự lái tại Hà Nội. VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá tốt, xe đẹp, dịch vụ tận tâm." />
<meta property="og:title" content="CarMatch — Thuê Xe Tự Lái Hà Nội" />
<meta property="og:description" content="20+ xe đa dạng, giao xe tận nơi, giá từ 800K/ngày" />
```

**Thêm ZaloFAB vào `App.tsx`:**
```tsx
import ZaloFAB from './components/ZaloFAB'
// Trong return: thêm <ZaloFAB /> sau <Routes>
```

---

## 9. CHI TIẾT CÁC COMPONENTS CẦN BUILD

### `ZaloFAB.tsx` — Floating Zalo Button
```
- Position: fixed bottom-6 right-6, z-50
- Mobile: icon Zalo + text "Chat ngay" 
- Desktop: chỉ icon (nhỏ gọn)
- Animation: subtle pulse / glow màu green
- Link: https://zalo.me/0975563290
- Thêm tracking nếu có Google Analytics
```

### `Navbar.tsx` — Sticky Navigation
```
- Desktop: Logo + Links (Xe, Thuê tháng, Giới thiệu, Blog) + CTA button Zalo
- Mobile: Logo + Hamburger menu
- Behavior: transparent khi đầu trang → blur khi scroll
- CTA: "Đặt xe ngay" nền green, text đen
- Active state: underline cho route hiện tại
```

### `CarCard.tsx` — Thẻ xe (dùng ở Fleet + Home)
```
- Ảnh: aspect-ratio 16/9, object-cover
- Badge: loại nhiên liệu (Điện=xanh lá, Xăng=vàng, Dầu=xanh dương)
- Tên xe: font-semibold
- Specs inline: X chỗ | Tự động | Xkm/ngày
- Giá: to, bold, màu green
- 2 buttons: "Xem chi tiết" (outline) + "Đặt ngay" (Zalo link, filled)
```

### `Fleet.tsx` — Trang Xe
```
Filter panel (desktop: sidebar trái, mobile: drawer từ bottom):
- Loại xe: All | Điện | Xăng | Dầu  (radio/toggle)
- Số chỗ: 5 chỗ | 7 chỗ
- Giá: slider 500K - 2.5M
- Sort: Giá tăng | Giá giảm | Tên A-Z

Grid: responsive 1→2→3→4 cols
Empty state: "Không tìm thấy xe phù hợp — Liên hệ để được tư vấn"
```

### `B2B.tsx` — Trang Thuê Xe Tháng
```
Hero:
  - H1: "Giải Pháp Xe Tháng Cho Doanh Nghiệp Hà Nội"
  - Sub: "Tiết kiệm 30-40% so với thuê ngày. Xe giao tận nơi. Hóa đơn VAT đầy đủ."
  - CTA: "Nhận báo giá miễn phí" → scroll to form

Benefits (4 cards):
  - 💰 Giá tốt hơn thuê ngày 30-40%
  - 🚗 Giao xe tận văn phòng/công trình
  - 📄 Hóa đơn VAT đầy đủ cho kế toán
  - 🔧 Hỗ trợ kỹ thuật 24/7

Pricing (transparent):
  - 5 chỗ (VF6, Creta): từ 18.000.000đ/tháng
  - 7 chỗ (Innova): từ 20.000.000đ/tháng  
  - Premium (Carnival, VF8): liên hệ để báo giá
  - *Đã bao gồm bảo hiểm, không bao gồm nhiên liệu

Use cases:
  - Công ty cần xe cho nhân viên/ban lãnh đạo
  - Dự án xây dựng/thi công dài hạn
  - Sự kiện, hội thảo kéo dài

Contact Form:
  - Tên công ty (required)
  - Số lượng xe cần (select: 1-2 / 3-5 / 6+)
  - Thời gian thuê (select: 1 tháng / 2-3 tháng / 6+ tháng)
  - Yêu cầu đặc biệt (textarea)
  - Số điện thoại (required)
  - Button: "Gửi yêu cầu" → POST to webhook / email / Zalo notify
```

### `About.tsx` — Giới Thiệu
```
- Story section: "CarMatch ra đời năm 2024..."
- Numbers: 20+ xe | 500+ chuyến | 2 năm kinh nghiệm | 4.8★ đánh giá
- Team (optional, nếu có ảnh)
- Commitment: xe sạch, bảo dưỡng định kỳ, hỗ trợ 24/7
- Process: cách thức giao nhận xe, đặt cọc, hoàn cọc
```

---

## 10. CẬP NHẬT `Home.tsx` — TRANG CHỦ MỚI

### Section order & content:

**Hero (giữ nguyên, cải thiện copy):**
```
H1: "Thuê Xe Tự Lái Hà Nội"
Sub: "20+ mẫu xe từ 800K/ngày • Giao xe tận nơi • Đặt qua Zalo nhanh 5 phút"
CTA1: "Đặt xe qua Zalo" → https://zalo.me/0975563290
CTA2: "Xem tất cả xe" → /xe
```

**Stats bar (4 số thực):**
```
20+ xe | 500+ chuyến | 4.8★ đánh giá | 2 năm kinh nghiệm
```

**Fleet preview (6 xe, CTA "Xem tất cả"):**
- Dùng `CarCard` component
- "Xem tất cả xe →" link tới /xe

**B2B Teaser:**
```
"Doanh nghiệp của bạn cần xe tháng?"
"Giảm 30-40% chi phí so với thuê ngày. Hóa đơn VAT. Giao xe tận nơi."
CTA: "Tìm hiểu gói thuê tháng →" → /thue-xe-thang
```

**How It Works (3 bước):**
```
① Nhắn tin Zalo → ② Xác nhận + ký hợp đồng → ③ Nhận xe & lên đường
```

**Blog preview (3 bài mới từ Sanity):**
- Từ API hiện có

---

## 11. FORM B2B → WEBHOOK

Để form B2B thực sự notify về cho team, dùng 1 trong 2:

**Option A: Formspree (đơn giản, miễn phí):**
```tsx
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```
→ Formspree gửi email về bimbeo1@gmail.com

**Option B: Zalo OA webhook (native, phù hợp hơn):**
→ Khi form submit → POST tới Zalo OA → message vào Zalo của Bim
→ Cần Zalo Official Account + webhook URL

**Khuyến nghị: Dùng Option A trước (deploy nhanh), nâng lên Option B sau**

---

## 12. TIMELINE ĐỀ XUẤT

### Sprint 1 (ngày 1-2): Foundation
- [ ] Tách Navbar + Footer ra components riêng
- [ ] Thêm ZaloFAB vào tất cả trang
- [ ] Cập nhật data interface `cars.ts` (thêm images array, description, useCases)
- [ ] Cập nhật `App.tsx` routes
- [ ] Fix meta tags trong `index.html`

### Sprint 2 (ngày 3-4): Core Pages
- [ ] Build `Fleet.tsx` với filter + sort
- [ ] Build `CarCard.tsx` component dùng chung
- [ ] Refactor `Home.tsx` với sections mới
- [ ] Refactor `CarDetail.tsx` với gallery + FAQ

### Sprint 3 (ngày 5-6): Business Pages
- [ ] Build `B2B.tsx` full page
- [ ] Build `About.tsx`
- [ ] Thêm B2BForm với Formspree integration
- [ ] Cập nhật copy toàn trang

### Sprint 4 (ngày 7): Polish & Deploy
- [ ] Responsive check tất cả pages (mobile/tablet/desktop)
- [ ] SEO: meta tags, og:image cho mỗi trang
- [ ] Deploy lên Vercel
- [ ] Test flows trên mobile

---

## 13. CHECKLIST TRƯỚC KHI LIVE

- [ ] Zalo link đúng: `https://zalo.me/0975563290`
- [ ] SĐT hiển thị: `0975 563 290`
- [ ] Địa chỉ văn phòng điền đúng (hiện đang trống)
- [ ] Email liên hệ thực (thay `info@carmatch.vn` placeholder)
- [ ] Ảnh xe: thay Unsplash bằng ảnh thực của CarMatch
- [ ] Google Search Console: verify domain
- [ ] `sitemap.xml`: auto-generate hoặc tạo thủ công
- [ ] robots.txt: `Allow: /`
- [ ] carmatch.vn domain → trỏ về Vercel
- [ ] Test form B2B: điền test → nhận email xác nhận

---

## 14. GHI CHÚ CHO CODEX

Khi implement theo plan này:

1. **Ưu tiên mobile-first** — 80% user sẽ vào từ điện thoại (từ TikTok, Zalo)
2. **Zalo link = conversion** — mọi trang đều phải có ít nhất 1 Zalo CTA visible
3. **Không dùng ảnh Unsplash** — để placeholder `bg-gray-800` hoặc dùng 1 ảnh xe thực
4. **Giá hiển thị dạng:** `800.000đ/ngày` (formatPrice function đã có trong cars.ts)
5. **Không cần animation phức tạp** — performance quan trọng hơn hiệu ứng
6. **Component reuse** — CarCard dùng ở cả Home và Fleet
7. **B2B form** — dùng Formspree, action URL sẽ điền sau khi tạo account
8. **TypeScript strict** — giữ types đúng, không dùng `any`
9. **Sanity blog** — giữ nguyên, đã hoạt động tốt
10. **Dark theme** — giữ nguyên `#0a0a0a` background, `#4ade80` accent

---

*Plan này được viết bởi Hưng Nam + Claude, dựa trên research thực tế về thị trường cho thuê xe VN và international.*
*Mục tiêu cuối: một website mà mỗi tuần bring in 5-10 leads thực cho CarMatch.*
