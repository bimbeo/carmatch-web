# Học Codex Từ Dự Án Car Match

File này dùng để lưu lại các bài học đọc hiểu code từ chính dự án Car Match.
Mỗi bài học mới sẽ được thêm tiếp vào cuối file này.

Ngày bắt đầu: 2026-06-16

Ghi chú: tài liệu học cho Bim phải viết tiếng Việt có dấu để đọc lại dễ hơn.

---

## Bài 1: Đọc Một Page Từ URL Đến Màn Hình

### Mục Tiêu

Hiểu một trang web trong dự án Car Match đi từ URL đến giao diện hiển thị như thế nào.

Ví dụ dùng trong bài này:

```txt
https://www.carmatch.vn/xe
```

Trang này nằm trong repo:

```txt
/Users/admin/carmatch-web
```

### Bản Đồ Tổng Quát

Khi khách mở trang `/xe`, luồng chạy có thể hiểu như sau:

```txt
URL /xe
  -> React Router
  -> Fleet page
  -> useVehicles hook
  -> /api/vehicles
  -> Supabase table vehicles
  -> map dữ liệu thành Car
  -> Fleet lọc và sắp xếp
  -> CarCard hiển thị ra màn hình
```

Nói đơn giản:

- URL là địa chỉ.
- Router là người chỉ đường.
- Page là căn phòng chính.
- API là quầy hỏi dữ liệu.
- Supabase là kho dữ liệu.
- Component là từng miếng giao diện.

### Bước 1: URL Được Nối Với Page

File cần đọc:

```txt
src/app/App.tsx
```

Dòng quan trọng:

```tsx
<Route path="/xe" element={<Fleet />} />
```

Ý nghĩa:

Khi URL là `/xe`, React sẽ mở component `Fleet`.

Đây là điểm đầu tiên cần tìm khi muốn đọc một page:

```txt
URL nào?
  -> route nào?
  -> component page nào?
```

### Bước 2: Page Chính Là Fleet

File cần đọc:

```txt
src/app/pages/Fleet.tsx
```

Component page bắt đầu bằng:

```tsx
export default function Fleet() {
```

Bên trong page này có dòng rất quan trọng:

```tsx
const { cars, loading, error } = useVehicles();
```

Ý nghĩa:

Page `Fleet` hỏi hook `useVehicles` để lấy:

- `cars`: danh sách xe.
- `loading`: đang tải dữ liệu hay chưa.
- `error`: có lỗi khi tải dữ liệu hay không.

### Bước 3: Hook Đi Lấy Dữ Liệu

File cần đọc:

```txt
src/hooks/useVehicles.ts
```

Hook chính:

```tsx
export function useVehicles() {
```

Bên trong hook có đoạn gọi API:

```tsx
const apiData = await fetchVehicleJson('/api/vehicles');
```

Ý nghĩa:

Frontend không tự biết xe nào đang có. Nó hỏi backend qua API `/api/vehicles`.

### Bước 4: API Hỏi Supabase

File cần đọc:

```txt
api/vehicles.js
```

API này lấy dữ liệu từ bảng `vehicles` trong Supabase:

```js
.from('vehicles')
.select(...)
.eq('status', 'available')
.eq('published', true)
.order('daily_base_price', { ascending: true })
```

Ý nghĩa:

API chỉ lấy các xe:

- Đang `available`.
- Đã được `published`.
- Sắp xếp theo giá `daily_base_price` từ thấp đến cao.

### Bước 5: Đổi Dữ Liệu Thô Thành Dữ Liệu Dễ Dùng

File cần đọc:

```txt
src/hooks/useVehicles.ts
```

Hàm map dữ liệu:

```tsx
export function mapToCar(v: SupabaseVehicle): Car {
```

Ví dụ:

```tsx
price: v.daily_base_price || 0
```

Ý nghĩa:

Trong database, trường giá tên là `daily_base_price`.
Khi đưa lên giao diện, code đổi thành `car.price` cho dễ dùng.

Đường đi của giá xe:

```txt
Supabase: daily_base_price
  -> API /api/vehicles
  -> useVehicles mapToCar: price
  -> Fleet: car
  -> CarCard: formatPrice(car.price)
  -> Màn hình
```

### Bước 6: Fleet Render Danh Sách Xe

File cần đọc:

```txt
src/app/pages/Fleet.tsx
```

Đoạn render danh sách:

```tsx
filtered.map((car) => (
  <CarCard key={car.id} car={car} source="fleet_list" />
))
```

Ý nghĩa:

Với mỗi xe trong danh sách đã lọc, page tạo ra một `CarCard`.

### Bước 7: CarCard Hiển Thị Ra Màn Hình

File cần đọc:

```txt
src/app/components/CarCard.tsx
```

Component nhận dữ liệu xe:

```tsx
export default function CarCard({ car, compact = false, source = 'car_card' }: CarCardProps)
```

Giá xe được hiển thị bằng:

```tsx
{formatPrice(car.price)}
```

Ý nghĩa:

`CarCard` nhận `car` từ page cha, rồi hiển thị ảnh, tên xe, thông số, giá và nút bấm.

### Thuật Ngữ Cần Nhớ

`Route`: luật nối URL với page. Ví dụ `/xe` mở `Fleet`.

`Component`: một khối giao diện. Ví dụ `Fleet`, `CarCard`, `Navbar`.

`Hook`: hàm React chuyên xử lý dữ liệu hoặc trạng thái. Ví dụ `useVehicles`.

`API`: cổng để frontend hỏi backend lấy dữ liệu. Ví dụ `/api/vehicles`.

`State`: bộ nhớ tạm của màn hình. Ví dụ `loading`, `error`, `cars`.

`Props`: dữ liệu component cha đưa cho component con. Ví dụ `Fleet` đưa `car` cho `CarCard`.

`Render`: quá trình biến data thành HTML/giao diện nhìn thấy trên màn hình.

### Bài Tập Nhỏ

1. Mở `src/app/App.tsx`, tìm route `/xe`.
2. Mở `src/app/pages/Fleet.tsx`, tìm dòng `useVehicles`.
3. Mở `src/hooks/useVehicles.ts`, tìm API `/api/vehicles`.
4. Mở `api/vehicles.js`, xem API lấy dữ liệu từ bảng nào.
5. Mở `src/app/components/CarCard.tsx`, xem giá xe được in ra ở đâu.

### Câu Cần Nhớ

Một page không tự nhiên xuất hiện.

Nó đi theo đường:

```txt
URL -> Route -> Page -> Data -> Component -> Màn hình
```

---

## Bài 2: Đọc Một Button Từ Lúc Bấm Đến Lúc Có Hành Động

### Mục Tiêu

Hiểu khi người dùng bấm một nút trên giao diện thì code chạy qua những bước nào.

Ví dụ dùng trong bài này:

```txt
Nút "Chi tiết" và nút "Đặt xe" trên card xe ở trang /xe
```

File chính cần đọc:

```txt
src/app/components/CarCard.tsx
src/app/App.tsx
src/app/pages/CarDetail.tsx
src/hooks/useVehicles.ts
src/lib/analytics.ts
```

### Bản Đồ Tổng Quát

Khi người dùng bấm nút trên card xe:

```txt
Người dùng bấm nút
  -> onClick chạy tracking
  -> Link đổi URL
  -> Router bắt URL mới
  -> Mở page CarDetail
  -> Page đọc slug trên URL
  -> Tìm đúng xe theo slug
  -> Render trang chi tiết xe
```

Riêng nút `Đặt xe` trên card có thêm `#booking`:

```txt
Người dùng bấm "Đặt xe"
  -> Đi tới /xe/{slug}#booking
  -> CarDetail mở đúng xe
  -> Code cuộn xuống khu vực có id="booking"
  -> BookingWidget hiện ra
```

Điểm cần nhớ:

Nút `Đặt xe` trên card chưa gửi booking thật. Nó chỉ đưa khách đến khu vực đặt xe trong trang chi tiết. Việc nhập form và gửi booking sẽ học ở bài sau.

### Bước 1: Tìm Nút Trong Component

File cần đọc:

```txt
src/app/components/CarCard.tsx
```

Trong `CarCard`, hai nút chính nằm ở phần `CTAs`.

Nút `Chi tiết`:

```tsx
<Link
  to={`/xe/${car.slug}`}
  onClick={() => trackCar('detail_click')}
>
  Chi tiết
</Link>
```

Ý nghĩa:

- `to={`/xe/${car.slug}`}`: bấm vào sẽ đi đến URL chi tiết của xe.
- `onClick={() => trackCar('detail_click')}`: khi bấm, hệ thống ghi nhận sự kiện click.

Ví dụ nếu `car.slug` là:

```txt
toyota-vios-2023
```

thì URL tạo ra là:

```txt
/xe/toyota-vios-2023
```

Nút `Đặt xe`:

```tsx
<Link
  to={`/xe/${car.slug}#booking`}
  onClick={() => trackCar('book_click')}
>
  Đặt xe
</Link>
```

Ý nghĩa:

- `to={`/xe/${car.slug}#booking`}`: đi đến trang chi tiết xe và nhảy xuống khu vực booking.
- `onClick={() => trackCar('book_click')}`: ghi nhận sự kiện người dùng bấm nút đặt xe.

Ví dụ URL tạo ra:

```txt
/xe/toyota-vios-2023#booking
```

### Bước 2: Hiểu `onClick` Và Tracking

Trong `CarCard`, có hàm:

```tsx
const trackCar = (action: string) => trackVehicleClick(action, {
  source,
  vehicle_id: car.id,
  vehicle_slug: car.slug,
  vehicle_name: car.name,
  vehicle_price: car.price,
});
```

Ý nghĩa:

Khi người dùng bấm vào ảnh, nút chi tiết, hoặc nút đặt xe, app gửi một sự kiện tracking.

Nó ghi lại:

- Người dùng bấm từ nguồn nào: `source`.
- Xe nào được bấm: `vehicle_id`, `vehicle_slug`, `vehicle_name`.
- Giá xe tại thời điểm bấm: `vehicle_price`.
- Hành động là gì: `image_click`, `detail_click`, hoặc `book_click`.

File tracking nằm ở:

```txt
src/lib/analytics.ts
```

Hàm chính:

```tsx
export function trackVehicleClick(action: string, payload: AnalyticsPayload = {}) {
  trackEvent('cm_vehicle_click', {
    action,
    ...payload,
  });
}
```

Nói đơn giản:

Tracking là việc ghi lại dấu vết hành vi của khách, để sau này biết khách hay bấm vào xe nào, bấm từ đâu, và bấm nút gì.

### Bước 3: Phân Biệt `Link`, `button`, Và `a`

Trong bài này, nút `Chi tiết` và `Đặt xe` thực ra là `Link`, không phải `button`.

`Link` dùng cho điều hướng nội bộ trong app React:

```tsx
<Link to="/xe">Xem tất cả xe</Link>
```

`button` thường dùng khi muốn chạy một hành động tại chỗ:

```tsx
<button onClick={handleClick}>Lọc xe</button>
```

`a` thường dùng để đi ra ngoài app, gọi điện, gửi email, mở Zalo:

```tsx
<a href="tel:0975563290">Gọi</a>
```

Trong Car Match:

- Bấm `Chi tiết`: dùng `Link` vì đi sang trang chi tiết xe trong website.
- Bấm `Đặt xe` trên card: dùng `Link` vì đi sang khu vực booking trong trang chi tiết.
- Bấm gọi điện hoặc Zalo: dùng `a` vì đi ra ngoài website hoặc mở app khác.

### Bước 4: Router Bắt URL Mới

File cần đọc:

```txt
src/app/App.tsx
```

Route chi tiết xe:

```tsx
<Route path="/xe/:slug" element={<CarDetail />} />
```

Ý nghĩa:

Mọi URL dạng này:

```txt
/xe/abc
/xe/toyota-vios-2023
/xe/vinfast-vf3
```

đều sẽ mở page `CarDetail`.

Phần `:slug` là biến động. Nó giống một chỗ trống trong URL để chứa mã định danh của xe.

### Bước 5: Page Đọc `slug` Từ URL

File cần đọc:

```txt
src/app/pages/CarDetail.tsx
```

Trong `CarDetail`, code đọc `slug` như sau:

```tsx
const { slug } = useParams<{ slug: string }>();
```

Nếu URL là:

```txt
/xe/toyota-vios-2023
```

thì:

```txt
slug = "toyota-vios-2023"
```

Sau đó page lấy danh sách xe và tìm đúng xe:

```tsx
const { cars, loading } = useVehicles();
const car = findVehicleBySlug(cars, slug);
```

Ý nghĩa:

URL chỉ có chữ `toyota-vios-2023`, nên app phải dùng chữ đó để tìm ra object xe đầy đủ gồm tên xe, ảnh, giá, số chỗ, nhiên liệu, điều kiện thuê.

### Bước 6: Tìm Đúng Xe Theo `slug`

File cần đọc:

```txt
src/hooks/useVehicles.ts
```

Hàm tìm xe:

```tsx
export function findVehicleBySlug(cars: Car[], slug: string | undefined): Car | null {
  if (!slug) return null;

  const exact = cars.find((car) => car.slug === slug);
  if (exact) return exact;

  const aliasMatches = cars.filter((car) => car.slugAliases?.includes(slug));
  if (aliasMatches.length === 0) return null;
  if (aliasMatches.length === 1) return aliasMatches[0];

  return (
    aliasMatches.find((car) => car.slug.startsWith(`${slug}-`) && hasRealVehicleImage(car)) ||
    aliasMatches.find((car) => car.slug.startsWith(`${slug}-`)) ||
    aliasMatches.find(hasRealVehicleImage) ||
    aliasMatches[0]
  );
}
```

Ý nghĩa:

App tìm xe theo thứ tự:

1. Tìm xe có `car.slug` khớp chính xác.
2. Nếu không có, tìm trong `slugAliases`.
3. Nếu có nhiều xe gần giống nhau, ưu tiên xe có ảnh thật.

Điều này giúp website không bị lỗi khi slug cũ vẫn còn người truy cập, hoặc khi nhiều xe có tên/model giống nhau.

### Bước 7: Nếu URL Có `#booking`, Page Cuộn Xuống Booking

Trong `CarDetail`, code đọc phần hash của URL:

```tsx
const { hash } = useLocation();
```

Nếu URL là:

```txt
/xe/toyota-vios-2023#booking
```

thì:

```txt
hash = "#booking"
```

Sau đó code kiểm tra:

```tsx
useEffect(() => {
  if (hash !== '#booking' || !car) return;
  const scroll = () => document.getElementById('booking')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
  const raf = requestAnimationFrame(() => {
    scroll();
    setTimeout(scroll, 300);
  });
  return () => cancelAnimationFrame(raf);
}, [hash, car]);
```

Ý nghĩa:

Khi đã tìm thấy xe và URL có `#booking`, app tìm phần tử:

```tsx
<div id="booking">
```

rồi cuộn màn hình xuống đó.

Khu vực booking chứa:

```tsx
<BookingWidget
  basePrice={car.price}
  carName={car.name}
  priceMonth={car.priceMonth}
  vehicleId={car.id}
  kmPerDay={car.kmPerDay}
/>
```

Đây là nơi chuẩn bị cho bước đặt xe thật.

### Hai Luồng Cần Nhớ

Luồng 1: bấm `Chi tiết`

```txt
CarCard
  -> Bấm "Chi tiết"
  -> trackCar('detail_click')
  -> URL thành /xe/{car.slug}
  -> Router mở CarDetail
  -> useParams đọc slug
  -> findVehicleBySlug tìm xe
  -> Render trang chi tiết
```

Luồng 2: bấm `Đặt xe`

```txt
CarCard
  -> Bấm "Đặt xe"
  -> trackCar('book_click')
  -> URL thành /xe/{car.slug}#booking
  -> Router mở CarDetail
  -> useParams đọc slug
  -> useLocation đọc hash
  -> findVehicleBySlug tìm xe
  -> scrollIntoView cuộn xuống id="booking"
  -> BookingWidget hiện ra
```

### Thuật Ngữ Cần Nhớ

`onClick`: hàm chạy khi người dùng bấm vào một phần tử.

`Link`: component của React Router dùng để điều hướng trong app mà không reload toàn bộ trang.

`to`: đích đến của `Link`.

`href`: đích đến của thẻ `a`, thường dùng cho link ngoài, gọi điện, email, Zalo.

`slug`: đoạn chữ dùng để định danh một nội dung trên URL. Ví dụ `toyota-vios-2023`.

`hash`: phần sau dấu `#` trong URL. Ví dụ `#booking`.

`useParams`: hook để đọc biến trong URL, ví dụ đọc `slug`.

`useLocation`: hook để đọc thông tin URL hiện tại, ví dụ đọc `hash`.

`tracking`: ghi nhận hành vi người dùng để phân tích sau này.

`side effect`: hành động phụ xảy ra ngoài việc render giao diện, ví dụ gửi tracking hoặc cuộn màn hình.

### Câu Cần Nhớ

Một nút trên web thường có hai phần:

```txt
Bấm để làm gì?
  -> đổi URL, mở link, submit form, hay chạy một hàm

Bấm xong có ghi nhận gì không?
  -> tracking, analytics, log, hoặc cập nhật state
```

Với Car Match:

```txt
Nút "Chi tiết" = đi đến trang chi tiết xe
Nút "Đặt xe" trên card = đi đến trang chi tiết xe và cuộn xuống khu vực booking
```

### Bài Tập Nhỏ

1. Mở `src/app/components/CarCard.tsx`, tìm hai dòng `to={`/xe/${car.slug}`}` và `to={`/xe/${car.slug}#booking`}`.
2. Mở `src/app/App.tsx`, tìm route `/xe/:slug`.
3. Mở `src/app/pages/CarDetail.tsx`, tìm `useParams`.
4. Mở `src/hooks/useVehicles.ts`, tìm `findVehicleBySlug`.
5. Tự giải thích bằng miệng: nếu `car.slug = "vinfast-vf3"` thì bấm `Đặt xe` sẽ đi qua những bước nào.

---

## Bài 3 Sẽ Học Gì?

Bài tiếp theo nên học:

```txt
Bài 3: Đọc một form từ lúc nhập thông tin đến lúc gửi dữ liệu
```

Ví dụ phù hợp trong dự án:

```txt
BookingWidget trong trang chi tiết xe
```

Mục tiêu của Bài 3:

- Hiểu form lưu dữ liệu người dùng nhập vào đâu.
- Hiểu `state` trong form.
- Hiểu validation là gì.
- Hiểu submit form gọi API nào.
- Hiểu khi gửi thành công hoặc thất bại thì màn hình đổi ra sao.

Luồng học dự kiến:

```txt
Người dùng nhập form
  -> State cập nhật
  -> Người dùng bấm submit
  -> Validate dữ liệu
  -> Gọi API
  -> API lưu hoặc gửi dữ liệu
  -> UI báo thành công/thất bại
```
