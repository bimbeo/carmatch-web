# Bao Mat CarMatch - Ban Giai Thich Kieu Feynman

Cap nhat: 2026-07-03

Tai lieu nay tom tat nhung viec da lam de tang bao mat cho CarMatch, va giai thich bang ngon ngu don gian de co the hoc lai.

## 1. Y tuong chinh

Bao mat website giong nhu quan ly mot cua hang:

- Cua truoc cho khach vao xem xe, blog, dat xe.
- Cua sau cho noi bo quan ly booking, khach hang, giay to.
- Kho chua giay to, anh thanh toan, thong tin ca nhan phai co khoa rieng.
- Bao ve tot la khong chi khoa cua, ma con kiem tra ai dang go cua, go qua nhanh hay khong, va co dang gia mao khong.

Viec minh lam la tach ro 3 lop:

1. Trinh duyet chi nhan du lieu duoc phep cong khai.
2. API server kiem tra quyen, gioi han tan suat, va chi tra du lieu can thiet.
3. Supabase/RLS/Storage chan doc ghi truc tiep vao du lieu nhay cam.

## 2. Nhung viec da lam

### Secret va file cau hinh

- Kiem tra de dam bao khong co `.env`, token Vercel, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PIN` bi track trong Git.
- Sua huong dan va `.gitignore` o cac repo lien quan de tranh commit nham file moi truong.
- ADMIN PIN duoc chuyen sang dung qua header `Authorization: Bearer <pin>` thay vi truyen tren URL query. URL rat de lot vao log, history, analytics; header an toan hon.

### API public cua `carmatch-web`

- Them helper `api/_security.js` dung chung cho:
  - CORS whitelist.
  - Rate limit theo IP/token.
  - Tra loi 429 khi request qua nhanh.
- Cac endpoint dat xe, xem booking, upload anh chuyen khoan, review, promo, availability duoc gan gioi han request.
- Admin booking API yeu cau token va khong chap nhan PIN trong query string nua.
- API xe public khong tra cac truong noi bo nhu bien so, km hien tai, status/published noi bo.

### Anh va file nhay cam

- Anh chung tu thanh toan trong `payment-proofs` khong luu public URL nua.
- Database chi luu storage path, khi can xem thi server tao signed URL ngan han.
- Signed URL co the hieu don gian la "ve vao cua co han su dung"; het han thi link cu khong con xem duoc.
- Anh xe public duoc cache thanh file webp trong build output, giup trang van co nhieu anh xe ma khong phu thuoc vao link Supabase public.

### Blog va XSS

- Blog CMS co HTML tu database, nen neu ai do chen `<script>` doc hai thi co nguy co chay tren may khach.
- Da them DOMPurify/isomorphic-dompurify de loc HTML truoc khi render.
- Cac the nguy hiem nhu `script`, `iframe`, `object`, `embed` bi cam.

### Header bao mat tren Vercel

- Them/cung co cac header:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `X-Permitted-Cross-Domain-Policies`
- Them `/.well-known/security.txt` de neu co nguoi phat hien loi bao mat, ho co kenh lien he dung.

### Supabase

- Bat RLS cho cac bang nhay cam.
- Thu hep quyen `anon`/`authenticated` voi cac bang noi bo.
- Chuyen mot so luong doc/ghi nhay cam sang server proxy thay vi goi RPC truc tiep tu browser.
- Chuyen bucket nhay cam sang private va dung signed URL.

### Vercel Firewall

- Bot Protection da duoc bat o che do `Log` de quan sat truoc.
- Khong nen bat `Block/Challenge` qua som khi chua xem log, vi co the chan nham bot tot hoac khach that.

## 3. Cac thuat ngu can nho

### CORS

CORS la danh sach website duoc phep goi API tu trinh duyet.

No khong phai khoa bao mat tuyet doi, vi script/curl tu server van co the goi truc tiep. Nhung no chan website la gia mao nhung dang chay trong browser khach.

### Rate limit

Rate limit la gioi han "mot nguoi/IP duoc goi bao nhieu lan trong mot khoang thoi gian".

No giam spam form dat xe, brute force PIN, submit review ao, va lam Supabase/Vercel bot do ton tai nguyen.

### RLS

RLS la Row Level Security cua Postgres/Supabase.

Neu table la mot cuon so, RLS quy dinh moi nguoi chi duoc doc/ghi dong nao trong cuon so do. Khong co policy thi mac dinh la khong ai doc duoc, tru service role.

### Service role

Service role la chia khoa tong cua Supabase.

No khong bao gio duoc dua vao frontend. Chi server/Vercel Function duoc dung, vi server la "nhan vien quan ly kho" thay mat khach lam viec voi database.

### Signed URL

Signed URL la link co chu ky va thoi han.

Khac voi public URL, no khong nen song mai. Hop cho anh CCCD, giay phep lai xe, chung tu thanh toan, hop dong.

### CSP

CSP la Content Security Policy.

No noi voi trinh duyet: "Trang nay chi duoc tai script, anh, font, API tu nhung nguon nay". Neu co ma doc chen vao tu nguon la, browser se chan.

### XSS

XSS la loi khi noi dung cua nguoi dung/CMS bi bien thanh ma JavaScript chay tren may khach.

Vi du: bai blog co HTML doc hai, khach doc blog, script an cookie hoac dieu huong sang trang lua dao. DOMPurify la bo loc giup cat phan nguy hiem.

## 4. Cong cu va ky nang da dung

- `git status`, `git diff`, `git log`: kiem tra thay doi, tranh commit nham.
- `npm audit`: kiem tra lo hong dependency.
- `npm run build`: dam bao web build duoc sau moi thay doi.
- `node --check`: kiem tra syntax JS serverless/API.
- Vite preview + Playwright: mo trang nhu nguoi dung that va kiem tra UI/DOM.
- Vercel CLI: deploy dung project `carmatch-web`.
- Supabase SQL/RLS/Storage audit: kiem tra bang, policy, bucket, signed URL.
- `rg`: tim secret, endpoint, route, import lien quan.

## 5. Cach tu kiem tra nhanh sau nay

Chay trong folder `carmatch-web`:

```bash
npm audit --audit-level=moderate
npm run build
npm run seo:audit
```

Sau deploy, kiem tra production:

```bash
curl -I https://www.carmatch.vn/
curl -s https://www.carmatch.vn/.well-known/security.txt
curl -s https://www.carmatch.vn/api/vehicles | rg "plate_number|current_km|published"
curl -i https://www.carmatch.vn/api/admin-bookings
```

Ket qua mong doi:

- Homepage co security headers.
- `security.txt` tra 200.
- API xe khong lo bien so, km hien tai, truong published/status noi bo.
- Admin API khong co token thi tra 401.
- Trang chi tiet xe co nhieu anh neu xe co gallery trong database.

## 6. Nguyen tac nho ngan gon

Bao mat CarMatch nen di theo thu tu:

1. Khong de lo chia khoa.
2. Khong cho browser doc thang du lieu nhay cam.
3. API nao ghi du lieu thi phai co gioi han toc do.
4. File nhay cam dung private bucket + signed URL.
5. HTML tu CMS phai sanitize.
6. Deploy xong phai smoke test luong that, khong chi tin vao build xanh.
